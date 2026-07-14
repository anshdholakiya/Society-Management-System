const announcementModel = require("../models/announcement.model");
const { uploadToImageKit, deleteFromImageKit } = require("../services/imagekit.service");
const { logAction } = require("../utils/auditLogger");

// Create Announcement (Admin & Committee only)
async function createAnnouncement(req, res) {
    const { title, content, targetAudience = "all", targetBlock = "", priority = "normal", expiresAt } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: "title and content are required" });
    }

    const priorities = ["normal", "important", "urgent"];
    if (!priorities.includes(priority)) {
        return res.status(400).json({ message: "Invalid priority value" });
    }

    // Expiry check
    let parsedExpiry = null;
    if (expiresAt) {
        parsedExpiry = new Date(expiresAt);
        if (isNaN(parsedExpiry.getTime())) {
            return res.status(400).json({ message: "Invalid expiry date format" });
        }
        if (parsedExpiry <= new Date()) {
            return res.status(400).json({ message: "Expiry date must be in the future" });
        }
    }

    let imageUrl = "";
    let imageFileId = "";

    // Process file upload if present
    if (req.file) {
        try {
            const uploadResult = await uploadToImageKit(
                req.file.buffer, 
                `announcement_${Date.now()}_${req.file.originalname}`
            );
            imageUrl = uploadResult.url;
            imageFileId = uploadResult.fileId;
        } catch (uploadError) {
            console.error("ImageKit Announcement Upload Error Details:", uploadError);
            return res.status(400).json({ 
                success: false, 
                message: "Image upload failed: " + uploadError.message 
            });
        }
    }

    const announcement = await announcementModel.create({
        title,
        content,
        targetAudience,
        targetBlock: targetBlock || "",
        priority,
        expiresAt: parsedExpiry || undefined,
        imageUrl,
        imageFileId,
        publishedBy: req.user.id,
    });

    await logAction("ANNOUNCEMENT_CREATED", req.user.id, `Published announcement: "${announcement.title}" targeting ${targetAudience}`, req);

    return res.status(201).json({
        success: true,
        message: "Announcement published successfully",
        announcement,
    });
}

// Get Announcements (Scoped by role, block targeting, and expiry)
async function getAnnouncements(req, res) {
    const { page = 1, limit = 10 } = req.query;

    const query = {};

    // Scoping check based on user role
    if (req.user.role === "resident") {
        // Residents only see notices targeted to all or residents
        query.targetAudience = { $in: ["all", "residents"] };

        // Residents only see notices targeting their block or all blocks
        query.$or = [
            { targetBlock: "" },
            { targetBlock: req.user.block },
            { targetBlock: { $exists: false } }
        ];

        // Residents only see non-expired notices
        query.$and = [
            {
                $or: [
                    { expiresAt: { $gt: new Date() } },
                    { expiresAt: null },
                    { expiresAt: { $exists: false } }
                ]
            }
        ];
    } else if (req.user.role === "committee_member") {
        // Management View (Manager feed is unscoped - they need to see all categories they posted or oversee)
        // No filters applied so they see the entire board, same as admin.
    }

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const total = await announcementModel.countDocuments(query);
    
    // Sort logic: Bubble up urgent first, then important, then normal (using collation or multiple matches, 
    // but in Mongoose/JS sorting by priority is easily done or sorted in Mongo using aggregate. 
    // For standard find, we sort by priority mapping. Since standard priority fields don't alphabetically sort 
    // 'urgent' > 'important' > 'normal', we can sort by createdAt descending, and we will sort/re-arrange them on the client,
    // or sort by createdAt desc here which is standard, and prioritize urgent in client UI. Let's do createdAt desc here to keep paging clean).
    const announcements = await announcementModel.find(query)
        .populate("publishedBy", "fullName email role designation block unitNumber")
        .sort({ createdAt: -1 })
        .skip(skipCount)
        .limit(parseInt(limit));

    return res.status(200).json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        announcements,
    });
}

// Get Announcement Details (with ID guessing prevention)
async function getAnnouncementDetails(req, res) {
    const { announcementId } = req.params;

    const announcement = await announcementModel.findById(announcementId)
        .populate("publishedBy", "fullName email role designation");

    if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
    }

    // Role-based details security checks
    if (req.user.role === "resident") {
        // 1. Audience validation
        if (!["all", "residents"].includes(announcement.targetAudience)) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this announcement" });
        }

        // 2. Block validation
        if (announcement.targetBlock && announcement.targetBlock !== req.user.block) {
            return res.status(403).json({ message: "Forbidden: This announcement is block-restricted" });
        }

        // 3. Expiry validation
        if (announcement.expiresAt && new Date(announcement.expiresAt) <= new Date()) {
            return res.status(403).json({ message: "Forbidden: This announcement has expired" });
        }
    } else if (req.user.role === "committee_member") {
        // Committee members can view any announcement in management desk
    }

    return res.status(200).json({
        success: true,
        announcement,
    });
}

// Update Announcement (Admin or original Publisher only)
async function updateAnnouncement(req, res) {
    const { announcementId } = req.params;
    const { title, content, targetAudience, targetBlock, priority, expiresAt } = req.body;

    const announcement = await announcementModel.findById(announcementId);
    if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
    }

    // Auth check: Admin or the actual publisher
    const isPublisher = announcement.publishedBy.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isPublisher && !isAdmin) {
        return res.status(403).json({ message: "Forbidden: You do not have permission to edit this announcement" });
    }

    // Validations
    if (priority) {
        const priorities = ["normal", "important", "urgent"];
        if (!priorities.includes(priority)) {
            return res.status(400).json({ message: "Invalid priority value" });
        }
    }

    if (expiresAt) {
        const parsedExpiry = new Date(expiresAt);
        if (isNaN(parsedExpiry.getTime())) {
            return res.status(400).json({ message: "Invalid expiry date format" });
        }
        if (parsedExpiry <= new Date()) {
            return res.status(400).json({ message: "Expiry date must be in the future" });
        }
        announcement.expiresAt = parsedExpiry;
    }

    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
    if (targetBlock !== undefined) announcement.targetBlock = targetBlock;
    if (priority !== undefined) announcement.priority = priority;

    await announcement.save();
    await logAction("ANNOUNCEMENT_UPDATED", req.user.id, `Updated announcement: "${announcement.title}"`, req);

    return res.status(200).json({
        success: true,
        message: "Announcement updated successfully",
        announcement,
    });
}

// Delete Announcement (Admin or original Publisher only)
async function deleteAnnouncement(req, res) {
    const { announcementId } = req.params;

    const announcement = await announcementModel.findById(announcementId);
    if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
    }

    const isPublisher = announcement.publishedBy.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isPublisher && !isAdmin) {
        return res.status(403).json({ message: "Forbidden: You do not have permission to delete this announcement" });
    }

    // Process file attachment rollback deletion on ImageKit if exists
    if (announcement.imageFileId) {
        try {
            await deleteFromImageKit(announcement.imageFileId);
        } catch (deleteError) {
            console.error("Failed to delete announcement image attachment during rollback:", deleteError);
        }
    }

    await announcementModel.findByIdAndDelete(announcementId);
    await logAction("ANNOUNCEMENT_DELETED", req.user.id, `Deleted announcement: "${announcement.title}"`, req);

    return res.status(200).json({
        success: true,
        message: "Announcement deleted successfully",
    });
}

module.exports = {
    createAnnouncement,
    getAnnouncements,
    getAnnouncementDetails,
    updateAnnouncement,
    deleteAnnouncement,
};
