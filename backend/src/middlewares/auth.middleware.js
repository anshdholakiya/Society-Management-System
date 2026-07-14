const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

async function authenticate(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lookup user in DB to ensure account is active and not deleted
        const user = await userModel.findOne({ _id: decoded.id, isDeleted: false });
        if (!user || !user.isActive) {
            return res.status(401).json({ message: "Unauthorized: Account is deactivated or deleted" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    };
}

module.exports = {
    authenticate,
    authorizeRoles,
};