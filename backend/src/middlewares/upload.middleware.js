const multer = require("multer");

// Use memory storage to store files temporarily in buffer before uploading to ImageKit
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Verify file mimetype is an image
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB limit
    },
    fileFilter: fileFilter,
});

module.exports = upload;
