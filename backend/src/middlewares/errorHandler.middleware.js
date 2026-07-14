function errorHandler(err, req, res, next) {
    // Log error internally for debugging
    console.error("Error handler caught:", err);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = err.errors || undefined;

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation Error";
        errors = Object.values(err.errors).map((el) => el.message);
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }

    // JWT Errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token. Please log in again.";
    }
    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token has expired. Please log in again.";
    }

    // Express-validator validation results check (if passing custom array)
    if (err.name === "RequestValidationError") {
        statusCode = 400;
        message = "Invalid input data";
        errors = err.errors;
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}

module.exports = errorHandler;
