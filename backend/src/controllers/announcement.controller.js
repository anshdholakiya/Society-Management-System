const announcementModel = require("../models/announcement.model");
const { logAction } = require("../utils/auditLogger");

// Create Announcement (Admin & Committee only)
async function createAnnouncement(req, res) {
    const { title, content, targetAudience = "all" } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: "title and content are required" });
    }

    const announcement = await announcementModel.create({
        title,
        content,
        targetAudience,
        publishedBy: req.user.id,
    });

    await logAction("ANNOUNCEMENT_CREATED", req.user.id, `Published announcement: "${announcement.title}" targeting ${targetAudience}`, req);

    return res.status(201).json({
        success: true,
        message: "Announcement published successfully",
        announcement,
    });
}

// Get Announcements (Scoped by role target audience)
async function getAnnouncements(req, res) {
    const { page = 1, limit = 10 } = req.query;

    const query = {};

    // Role-based target audience check
    if (req.user.role === "resident") {
        query.targetAudience = { $in: ["all", "residents"] };
    } else if (req.user.role === "committee_member") {
        query.targetAudience = { $in: ["all", "committee"] };
    } // Admins can see everything (all, residents, committee)

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const total = await announcementModel.countDocuments(query);
    const announcements = await announcementModel.find(query)
        .populate("publishedBy", "fullName email role designation")
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

// Update Announcement (Admin or Publisher)
async function updateAnnouncement(req, res) {
    const { announcementId } = req.params;
    const { title, content, targetAudience } = req.body;

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

    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (targetAudience !== undefined) announcement.targetAudience = targetAudience;

    await announcement.save();
    await logAction("ANNOUNCEMENT_UPDATED", req.user.id, `Updated announcement: "${announcement.title}"`, req);

    return res.status(200).json({
        success: true,
        message: "Announcement updated successfully",
        announcement,
    });
}

// Delete Announcement (Admin or Publisher)
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
    updateAnnouncement,
    deleteAnnouncement,
};
