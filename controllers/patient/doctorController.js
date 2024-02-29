const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient")
const asyncHandler = require("express-async-handler")
const {checkId} = require("../../helper/checker");
const jwtDecoder = require("../../helper/jwtDecoder")

//@desc GET doctor profile
//@route GET /patients/doctors
//@access Private
const getDoctor = asyncHandler(async (req, res) => {
  const patientId = await jwtDecoder(req, res)
  if (!patientId) return res.status(400).json({ message: "missing doctor id" });
  if (!checkId(patientId)) return res.status(400).json({ message: "id is not valid" });

  const patient = await Patient.findById(patientId).lean().exec()
  const doctor = await Doctor.findById(patient.doctor).lean().exec()
  if (!doctor || doctor?._id.toString() != patient.doctor) return res.status(400).json({ message: "doctor not found" });
  

  res.json(doctor);
});


module.exports = {getDoctor} 
