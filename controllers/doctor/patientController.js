const Doctor = require("../../models/Doctor");
const bcrypt = require("bcrypt"); //hash password
const asyncHandler = require("express-async-handler");
const { checkId, checkDoctor } = require("../../helper/checker");
const Patient = require("../../models/Patient");
const Exam = require("../../models/Exam");
const Report = require("../../models/Report");

const jwtDecoder = require("../../helper/jwtDecoder");

//@desc GET all patient with doctor = doctorId
//@route GET /doctor/patient
//@access Private
const getPatients = asyncHandler(async (req, res) => {
    const doctorID = await jwtDecoder(req, res);
    if (!doctorID) return res.status(400).json({ message: "Id mancante" });
    if (!checkId(doctorID))
        return res.status(400).json({ message: "Id non valido" });

    const doctor = await Doctor.findById(doctorID)
        .select("-password -__v")
        .lean()
        .exec();
    if (!doctor || doctor?._id.toString() !== doctorID)
        return res.status(400).json({ message: "Dottore non trovato" });

    const patients = await Patient.find({ doctor: doctor._id })
        .select("-password -__v")
        .lean()
        .exec();
    if (!patients?.length)
        return res.status(200).json({ message: "Il dottore non ha nessun paziente" });
    res.json(patients);
});

//@desc POST create patient with doctor = doctorID
//@route POST /doctor/patient
//@access Private
const createNewPatient = asyncHandler(async (req, res) => {
    const { name, surname, password, email, telefono } = req.body;
    const doctor = await jwtDecoder(req, res);
    if (!name || !surname || !password || !email || !telefono || !doctor) {
        return res.status(400).json({ message: "Tutti i campi sono richiesti" });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    //possibile togliere questi due check. Se è entrato il jwt è valido
    if (!checkId(doctor)) {
        return res.status(400).json({ message: "Dottore non valido" });
    }

    if (!(await checkDoctor(doctor))) {
        return res.status(400).json({
            message: "Il dottore associato al paziente non è valido",
        });
    }
    const adminDuplicate = await Admin.findOne({ email }).lean().exec();
    const patientDuplicate = await Patient.findOne({ email }).lean().exec();
    const doctorDuplicate = await Doctor.findOne({ email }).lean().exec();

    if (adminDuplicate || patientDuplicate || doctorDuplicate) {
        return res.status(409).json({ message: "Email già registrato" });
    }

    const patientObject = {
        name,
        surname,
        password: hashedPwd,
        email,
        telefono,
        doctor,
    };
    const patient = await Patient.create(patientObject);
    if (patient) {
        res.status(201).json({ message: `nuovo paziente ${name} creato` });
    } else {
        res.status(400).json({ message: "Dati del paziente non validi" });
    }
});

//@desc PUT update patient with doctor = doctorID
//@route PUT /doctor/patient
//@access Private
const updatePatient = asyncHandler(async (req, res) => {
    const { id, name, surname, password, email, telefono } = req.body;
    const doctor = await jwtDecoder(req, res);
    if (!id) {
        return res.status(400).json({ message: "Id mancante" });
    }
    if (!checkId(id)) {
        return res.status(400).json({ message: "Id non valido" });
    }

    const patient = await Patient.findById(id).exec();

    if (!patient || patient?._id.toString() !== id) {
        return res.status(404).json({ message: "Paziente non trovato" });
    }

    if (name) patient.name = name;
    if (surname) patient.surname = surname;
    if (password) {
        const hashedPwd = await bcrypt.hash(password, 10);
        patient.password = hashedPwd;
    }
    if (email) {
        const adminDuplicate = await Admin.findOne({ email }).lean().exec();
        const patientDuplicate = await Patient.findOne({ email }).lean().exec();
        const doctorDuplicate = await Doctor.findOne({ email }).lean().exec();

        if (adminDuplicate || patientDuplicate || doctorDuplicate) {
            return res.status(409).json({ message: "Email già registrato" });
        }

        patient.email = email;
    }
    if (telefono) patient.telefono = telefono;

    if (doctor != null && !checkId(doctor)) {
        return res.status(400).json({ message: "Dottore non valido" });
    }
    if (doctor != null) {
        if (await checkDoctor(doctor)) {
            patient.doctor = doctor;
        } else {
            return res
                .status(400)
                .json({ message: "Il dottore non esiste" });
        }
    }
    patient.doctor = doctor;

    await patient.save();
    res.status(200).json({ message: "Paziente aggiornato" });
});

const deletePatient = asyncHandler(async (req, res) => {
    const { id } = req.body;
    const doctorId = await jwtDecoder(req, res);
    if (!id) return res.status(400).json({ message: "Id mancante" });
    if (!checkId(id)) {
        return res.status(400).json({ message: "Id non valido" });
    }

    const patient = await Patient.findById(id).exec();
    if (!patient) return res.status(404).json({ message: "Paziente non trovato" });
    if (patient.doctor != doctorId)
        return res.status(404).json({
            message: "Il dottore del paziente è diverso dal dottore loggato",
        });

    const patientExams = await Exam.find({ patient: patient._id }).exec();

    // Delete all reports associated with the patient
    const patientReport = await Report.find({ patient: patient._id }).exec();

    if (patientExams.length !== 0 || patientReport.length !== 0) {
        await Exam.deleteMany({ patient: patient._id }).exec();
        await Report.deleteMany({ patient: patient._id }).exec();
    }
    //aggiungi referenza al dottore deleted
    const result = await patient.deleteOne();
    const reply = `Il paziente e i relativi dati sono stati eliminati con successo`;
    return res.json({
        message: reply,
    });
});

module.exports = {
    getPatients,
    createNewPatient,
    updatePatient,
    deletePatient,
};
