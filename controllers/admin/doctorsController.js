const Doctor = require("../../models/Doctor");
const Admin = require("../../models/Admin")
const Patient = require("../../models/Patient");
const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler"); //async functionality, cosi posso a fare a meno del promise chaining o try/catch block
const bcrypt = require("bcrypt"); //hash password
const { checkId } = require("../../helper/checker");
const Exam = require("../../models/Exam");

//@desc GET all doctors
//@route GET /admin/doctors
//@access Private
const getAllDoctors = asyncHandler(async (req, res) => {
    const doctors = await Doctor.find().select("-password -__v").lean();
    if (!doctors?.length) {
        return res.status(400).json({ message: "Nessun dottore trovato" });
    }
    res.json(doctors);
});

//@desc Create a new doctor
//@route POST /admin/doctors
//@access Private
const createNewDoctor = asyncHandler(async (req, res) => {
    const { name, surname, password, email, telefono } = req.body;
    if (!name || !surname || !password || !email || !telefono) {
        return res.status(400).json({ message: "Tutti i campi sono richiesti" });
    }
    const adminDuplicate = await Admin.findOne({ email }).lean().exec();
    const patientDuplicate = await Patient.findOne({ email }).lean().exec();
    const doctorDuplicate = await Doctor.findOne({ email }).lean().exec();

    if (adminDuplicate || patientDuplicate || doctorDuplicate) {
        return res.status(409).json({ message: "Email già registrata" });
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    const doctorObject = {
        name,
        surname,
        password: hashedPwd,
        email,
        telefono,
    };

    const doctor = await Doctor.create(doctorObject);
    if (doctor) {
        res.status(201).json({ message: `Nuovo dottore ${name} creato` });
    } else {
        res.status(400).json({ message: "Dati del dottore non validi" });
    }
});

//@desc Update a doctor
//@route PUT /admin/doctors
//@access Private
const updateDoctor = asyncHandler(async (req, res) => {
    const { id, name, surname, password, email, telefono } = req.body;
    if (!id) {
        return res.status(400).json({ message: "Id mancante" });
    }
    if (!checkId(id)) {
        return res.status(400).json({ message: "Id non valido" });
    }

    //no .lean() perchè vogliamo un moongose document object e non un pojo
    const doctor = await Doctor.findById(id).exec();

    if (!doctor || doctor?._id.toString() !== id) {
        return res.status(400).json({ message: "Dottore non trovato" });
    }
    if (name) doctor.name = name;
    if (surname) doctor.surname = surname;
    if (password) {
        const hashedPwd = await bcrypt.hash(password, 10);
        doctor.password = hashedPwd;
    }
    if (email) {
        const adminDuplicate = await Admin.findOne({ email }).lean().exec();
        const patientDuplicate = await Patient.findOne({ email }).lean().exec();
        const doctorDuplicate = await Doctor.findOne({ email }).lean().exec();

        if (adminDuplicate || patientDuplicate || doctorDuplicate) {
            return res.status(409).json({ message: "Email già registrata" });
        }

        doctor.email = email;
    }

    if (telefono) doctor.telefono = telefono;

    await doctor.save();
    res.status(200).json({ message: "Dottore aggiornato" });
});

//@desc Delete a doctor
//@route DELETE /admin/doctors
//@access Private
const deleteDoctor = asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "Id mancante" });
    if (!checkId(id)) {
        return res.status(400).json({ message: "Is non valido" });
    }

    const doctor = await Doctor.findById(id).exec();
    if (!doctor) return res.status(400).json({ message: "Dottore non trovato" });

    //elimino tutti i dati relativi al dottore
    const patients = await Patient.find({ doctor: id }).exec();
    if (patients?.length) {
        for (const patient of patients) {
            // elimino tutti gli esami associati al paziente del medico
            await Exam.deleteMany({ patient: patient._id }).exec();
            // elimino tutti gli referti associati al paziente del medico
            await Report.deleteMany({ patient: patient._id }).exec();
            // elimino il paziente
            await Patient.findByIdAndDelete(patient._id).exec();
        }
    }

    //aggiungi referenza al dottore deleted
    const result = await doctor.deleteOne();
    const reply = `Dottore e dati associati eliminati con successo`;
    return res.json({
        message: reply,
    });
});

module.exports = { getAllDoctors, createNewDoctor, updateDoctor, deleteDoctor };
