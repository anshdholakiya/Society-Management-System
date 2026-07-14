let ImageKit;
try {
    ImageKit = require("imagekit");
} catch (e) {
    ImageKit = require("@imagekit/nodejs");
}

let imagekit = null;

const hasCredentials =
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT;

if (hasCredentials) {
    try {
        imagekit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        });
        console.log("ImageKit initialized successfully.");
    } catch (err) {
        console.error("Failed to initialize ImageKit:", err.message);
    }
} else {
    console.warn("WARNING: ImageKit credentials missing from environment. Using mock upload fallback.");
}

/**
 * Uploads a file buffer to ImageKit (or falls back to mock)
 * @param {Buffer} fileBuffer - The file buffer from Multer
 * @param {string} fileName - The name of the file
 * @returns {Promise<{url: string, fileId: string}>}
 */
async function uploadToImageKit(fileBuffer, fileName) {
    if (!imagekit) {
        // Mock fallback for testing if no credentials are provided
        console.log(`[Mock ImageKit] Uploading ${fileName} (size: ${fileBuffer.length} bytes)`);
        const mockFileId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
            url: `https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600`, // Nice apartment placeholder image
            fileId: mockFileId,
        };
    }

    try {
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: fileName,
            folder: "/society_management/complaints",
        });

        return {
            url: response.url,
            fileId: response.fileId,
        };
    } catch (error) {
        console.error("ImageKit upload error:", error);
        throw new Error("Image upload failed: " + (error.message || error));
    }
}

/**
 * Deletes a file from ImageKit
 * @param {string} fileId - The ImageKit fileId to delete
 * @returns {Promise<boolean>}
 */
async function deleteFromImageKit(fileId) {
    if (!imagekit || fileId.startsWith("mock_")) {
        console.log(`[Mock ImageKit] Deleting file with ID: ${fileId}`);
        return true;
    }

    try {
        await imagekit.deleteFile(fileId);
        return true;
    } catch (error) {
        console.error("ImageKit deletion error:", error);
        // We log but don't crash, as the database deletion is primary
        return false;
    }
}

module.exports = {
    uploadToImageKit,
    deleteFromImageKit,
};
