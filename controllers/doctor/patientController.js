const Doctor = require("../../models/Doctor");
const bcrypt = require("bcrypt"); //hash password
const asyncHandler = require("express-async-handler");
const {checkId} = require("../../helper/checker");
const Patient = require("../../models/Patient");

//@desc GEt a specific patient
//@route PUT /doctor/patient
//@access Private
const getPatients = asyncHandler(async (req,res)=>{
    //da moficare appena implemento jwt
    const doctorID = req.params.doctorID
    if(!doctorID) return res.status(400).json({message : "missing id"})
    if(!checkId(doctorID)) return res.status(400).json({message : "invalid id"})

    const doctor = await Doctor.findById(doctorID).lean().exec()
    if (!doctor || doctor?._id.toString() !== doctorID) return res.status(400).json({ message: "doctor not found" });

    const patients = await Patient.find({doctor : doctor._id}).lean().exec()
    if(!patients?.length)
        return res.status(200).json({message : "the doctor has no patients"})
    res.json(patients)
})


const createNewPatient = asyncHandler(async (req, res) => {
    const { name, surname, password, email, telefono, doctor } = req.body;
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
        .json({ message: "the doctor associated to the patient is not defined" });
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
  
const updatePatient = asyncHandler(async (req, res)=>{
    const {doctor, patient, name, surname, email, telefono} = req.body

})

module.exports = {getPatients}