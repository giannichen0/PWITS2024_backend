const Doctor = require("../../models/Doctor");
const Admin = require("../../models/Admin")
const Patient = require("../../models/Patient");
const Exam = require("../../models/Exam");

const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler"); //async functionality, cosi posso a fare a meno del promise chaining o try/catch block
const bcrypt = require("bcrypt"); //hash password
const { checkDoctor, checkId } = require("../../helper/checker");

//@desc GET all patients
//@route GET /admin/patients
//@access Private
const getAllPatients = asyncHandler(async (req, res) => {
    const patients = await Patient.find().select("-password -__v").lean();
    if (!patients?.length) {
        return res.status(404).json({ message: "Nessun paziente trovato" });
    }

    //map del paziente con il nome del dottore
    const patientsWithDoctor = await Promise.all(
        patients.map(async (patient) => {
            const doctor = await Doctor.findById(patient.doctor).lean().exec();
            return {
                ...patient,
                doctor: `${doctor.name} ${doctor.surname} id: ${doctor._id}`,
            };
        })
    );
    res.json(patientsWithDoctor);
});

//@desc Create a new patient with doctor = logged doctor
//@route POST /doctor/patient
//@access Private
const createNewPatient = asyncHandler(async (req, res) => {
    const { name, surname, password, email, telefono, doctor } = req.body;
    if (!name || !surname || !password || !email || !telefono || !doctor) {
        return res.status(400).json({ message: "Tutti i campi sono richiesti" });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

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
        return res.status(409).json({ message: "Email già registrata" });
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
        res.status(201).json({ message: `Nuovo paziente ${name} registrato` });
    } else {
        res.status(400).json({ message: "Dati del paziente non validi" });
    }
});

//@desc Update a specific patient
//@route PUT /doctor/patient
//@access Private
const updatePatient = asyncHandler(async (req, res) => {
    const { id, name, surname, password, email, telefono, doctor } = req.body;
    if (!id) {
        return res.status(400).json({ message: "Id mancante" });
    }
    if (!checkId(id)) {
        return res.status(400).json({ message: "Id non valido" });
    }
    //no .lean() perchè vogliamo un moongose document object e non un pojo
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
            return res.status(409).json({ message: "Email già registrata" });
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

    await patient.save();
    res.status(200).json({ message: "Paziente aggiornato" });
});

//@desc delete a patient
//@route DELETE /admin/patients
//@access Private
const deletePatient = asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "Id mancante" });
    if (!checkId(id)) {
        return res.status(400).json({ message: "Id non valido" });
    }

    const patient = await Patient.findById(id).exec();
    if (!patient) return res.status(404).json({ message: "Paziente non trovato" });

    await Exam.deleteMany({ patient: patient._id }).exec();

    // Delete all reports associated with the patient
    await Report.deleteMany({ patient: patient._id }).exec();

    //aggiungi referenza al dottore deleted
    const result = await patient.deleteOne();
    const reply = `Paziente e i relativi dati cancellati con successo`;
    return res.json({
        message: reply,
    });
});

module.exports = {
    getAllPatients,
    createNewPatient,
    updatePatient,
    deletePatient,
};
