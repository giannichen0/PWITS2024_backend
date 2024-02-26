const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res
            .status(403)
            .json({ message: "Forbidden. Admin access required." });
    }
    next(); // Pass control to the next middleware if user is admin
};

module.exports = isAdmin