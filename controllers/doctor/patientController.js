const Doctor = require("../../models/Doctor");
const bcrypt = require("bcrypt"); //hash password
const asyncHandler = require("express-async-handler");
const { checkId } = require("../../helper/checker");
const Patient = require("../../models/Patient");
const jwtDecoder = require("../../helper/jwtDecoder");

//@desc GET a specific patient
//@route GET /doctor/patient
//@access Private
const getPatients = asyncHandler(async (req, res) => {
    const doctorID = await jwtDecoder(req, res);
    if (!doctorID) return res.status(400).json({ message: "missing id" });
    if (!checkId(doctorID))
        return res.status(400).json({ message: "invalid id" });

    const doctor = await Doctor.findById(doctorID).lean().exec();
    if (!doctor || doctor?._id.toString() !== doctorID)
        return res.status(400).json({ message: "doctor not found" });

    const patients = await Patient.find({ doctor: doctor._id }).lean().exec();
    if (!patients?.length)
        return res.status(200).json({ message: "the doctor has no patients" });
    res.json(patients);
});

//@desc POST create patient with doctor = doctorID
//@route POST /doctor/patient
//@access Private
const createNewPatient = asyncHandler(async (req, res) => {
    const { name, surname, password, email, telefono } = req.body;
    const doctor = await jwtDecoder(req, res);
    if (!name || !surname || !password || !email || !telefono || !doctor) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    if (!checkId(doctor)) {
        return res.status(400).json({ message: "doctor is not valid" });
    }

    if (!(await checkDoctor(doctor))) {
        return res
            .status(400)
            .json({
                message: "the doctor associated to the patient is not defined",
            });
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
        res.status(201).json({ message: `new patient ${name} created` });
    } else {
        res.status(400).json({ message: "Invalid patient data " });
    }
});

//@desc PUT update patient with doctor = doctorID
//@route PUT /doctor/patient
//@access Private
const updatePatient = asyncHandler(async (req, res) => {
    const { id, name, surname, password, email, telefono} = req.body;
    const doctor = await jwtDecoder(req,res)
    if (!id) {
        return res.status(400).json({ message: "missing ID" });
    }
    if (!checkId(id)) {
        return res.status(400).json({ message: "ID is not valid" });
    }
   
    const patient = await Patient.findById(id).exec();

    if (!patient || patient?._id.toString() !== id) {
        return res.status(404).json({ message: "patient not found" });
    }

    if (name) patient.name = name;
    if (surname) patient.surname = surname;
    if (password) {
        const hashedPwd = await bcrypt.hash(password, 10);
        patient.password = hashedPwd;
    }
    if (email) patient.email = email;
    if (telefono) patient.telefono = telefono;

    if (doctor != null && !checkId(doctor)) {
        return res.status(400).json({ message: "doctor is not valid" });
    }
    if (doctor != null) {
        if (await checkDoctor(doctor)) {
            patient.doctor = doctor;
        } else {
            return res
                .status(400)
                .json({ message: "The doctor doesn't exist" });
        }
    }

    await patient.save();
    res.status(200).json({ message: "patient updated" });
});

module.exports = { getPatients, createNewPatient, updatePatient };
