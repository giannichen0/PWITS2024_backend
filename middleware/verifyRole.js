const isAdmin = (req, res, next) => {
    if (req.role !== "admin")
        return res
            .status(403)
            .json({ message: "Forbidden. Richiede ruolo di Admin." });

    next();
};

const isDoctor = (req, res, next) => {
    if (req.role !== "doctor")
        return res
            .status(403)
            .json({ message: "Forbidden. Richiede ruolo di Dottore." });

    next();
};

const isPatient = (req, res, next) => {
    if (req.role !== "patient")
        return res
            .status(403)
            .json({ message: "Forbidden. Richiede ruolo di Paziente." });

    next();
};

const isAdminOrDoctor = (req, res, next) => {
    if (req.role !== "doctor" && req.role !== "admin")
        return res
            .status(403)
            .json({ message: "Forbidden. Richiede ruolo di Admin o Dottore." });

    next();
};

const isAdminOrDoctorOrPatient = (req, res, next) => {
    if (req.role !== "doctor" && req.role !== "admin" && req.role !== "patient")
        return res
            .status(403)
            .json({ message: "Forbidden. Richiede ruolo di Admin o Dottore o Paziente." });

    next();
};
module.exports = { isAdmin, isDoctor, isPatient, isAdminOrDoctor, isAdminOrDoctorOrPatient };
