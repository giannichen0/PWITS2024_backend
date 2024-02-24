const Doctor = require("../../models/Doctor");
const asyncHandler = require("express-async-handler");
const {
  checkDoctor,
  checkPatient,
  checkReport,
  checkId,
} = require("../../helper/checker");

//@desc GET doctor profile
//@route GET /doctor/profile
//@access Private
const getDoctorProfile = asyncHandler(async (req, res) => {
  //da modificare appena implemento il jwt
  const doctorId = req.query.doctorId;
  if (!doctorId) return res.status(400).json({ message: "missing doctor id" });
  if (!checkId(doctorId))
    return res.status(400).json({ message: "id is not valid" });

  const doctor = await Doctor.findById(doctorId).lean().exec();
  if (!doctor || doctor?._id.toString() !== doctorId) return res.status(400).json({ message: "doctor not found" });
  

  res.json(doctor);
});

//@desc PUT update doctor
//@route PUT /doctor/profile
//@access Private
const updateDoctor = asyncHandler(async (req, res) => {
  //da modificare appena implemento il jwt
  const { id, name, surname, password, email, telefono } = req.body;
  if (!id) return res.status(400).json({ message: "missing id" });
  if (!checkId(id)) return res.status(400).json({ message: "ID is not valid" });

  const doctor = await Doctor.findById(id).exec();
  if (!doctor || doctor?._id.toString() !== id) return res.status(400).json({ message: "doctor not found" });
  if (name) doctor.name = name;
  if (surname) doctor.surname = surname;
  if (password) {
    const hashedPwd = await bcrypt.hash(password, 10);
    doctor.password = hashedPwd;
  }
  if (email) doctor.email = email;
  if (telefono) doctor.telefono = telefono;
  await doctor.save();
  res.status(200).json({ message: "doctor updated" });
  
});

module.exports = { getDoctorProfile, updateDoctor };
