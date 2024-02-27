const isAdmin = (req, res, next) => {
    if (req.role !== "admin")
        return res
            .status(403)
            .json({ message: "Forbidden. Admin access required." });

    next(); // Pass control to the next middleware if user is admin
};

const isDoctor = (req, res, next) => {
    if (req.role !== "doctor")
        return res
            .status(403)
            .json({ message: "Forbidden. Doctor acess required" });

    next();
};

const isPatient = (req, res, next) => {
    if (req.role !== "patient")
        return res
            .status(403)
            .json({ message: "Forbidden. Patient acess required" });

    next();
};

const isAdminOrDoctor = (req, res, next) => {
    if (req.role !== "doctor" || req.role !== "admin")
        return res
            .status(403)
            .json({ message: "Forbidden. Doctor or admin acess required " });

    next();
};
module.exports = { isAdmin, isDoctor, isPatient, isAdminOrDoctor };
