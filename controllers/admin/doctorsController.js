const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Exam = require("../../models/Exam");
const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler"); //async functionality, cosi posso a fare a meno del promise chaining o try/catch block
const bcrypt = require("bcrypt"); //hash password
const {checkId} = require("../../helper/checker")

//@desc GET all doctors
//@route GET /admin/doctors
//@access Private
const getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find().select("-password").lean();
  if (!doctors?.length) {
    return res.status(400).json({ message: "No doctors found" });
  }
  res.json(doctors);
});

//@desc Create a new doctor
//@route POST /admin/doctors
//@access Private
const createNewDoctor = asyncHandler(async (req, res) => {
  const { name, surname, password, email, telefono } = req.body;
  if (!name || !surname || !password || !email || !telefono) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // const duplicate = await Doctor.findOne({username}).lean().exec()
  // if(duplicate){
  //     return res.status(409).json({message:"duplicate name"})
  // }
  const hashedPwd = await bcrypt.hash(password, 10);
  const doctorObject = { name, surname, password: hashedPwd, email, telefono };

  const doctor = await Doctor.create(doctorObject);
  if (doctor) {
    res.status(201).json({ message: `new doctor ${name} created` });
  } else {
    res.status(400).json({ message: "Invalid doctor data " });
  }
});

//@desc Update a doctor
//@route PUT /admin/doctors
//@access Private
const updateDoctor = asyncHandler(async (req, res) => {
  const { id, name, surname, password, email, telefono } = req.body;
  if (!id) {
    return res.status(400).json({ message: "missing id" });
  }
  if (!checkId(id)) {
    return res.status(400).json({ message: "ID is not valid" });
  }

  //no .lean() perchè vogliamo un moongose document object e non un pojo
  const doctor = await Doctor.findById(id).exec();

  if (!doctor || doctor?._id.toString() !== id) {
    return res.status(400).json({ message: "doctor not found" });
  }
  if (name) doctor.name = name;
  if (surname) doctor.surname = surname;
  if (password) {
    const hashedPwd = await bcrypt.hash(password, 10);
    doctor.password = hashedPwd;
  }
  if (email) doctor.email = email;
  if (telefono) doctor.telefono = telefono;

  // const duplicate = await Doctor.findOne({name}).lean().exec()
  // if(duplicate && duplicate?._id.toString() !==id){
  //     return res.status(409).json({message:"duplicate name"})
  // }
  await doctor.save();
  res.status(200).json({ message: "doctor updated" });
});

//@desc Delete a doctor
//@route DELETE /admin/doctors
//@access Private
const deleteDoctor = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "Missing ID" });
  if (!checkId(id)) {
    return res.status(400).json({ message: "ID is not valid" });
  }

  const doctor = await Doctor.findById(id).exec()
  if(!doctor) return res.status(400).json({message : "Doctor non found"})
  
  //elimino tutti i dati relativi al dottore
  const patients = await Patient.find({ doctor: id }).exec();
  if (patients?.length) {
    for (const patient of patients) {
      // Delete all exams associated with the patient
      await Exam.deleteMany({ patient: patient._id }).exec();
      // Delete all reports associated with the patient
      await Report.deleteMany({ patient: patient._id }).exec();
      // Delete the patient
      await Patient.findByIdAndDelete(patient._id).exec();
    }
  }
  // Delete the doctor
  //await Doctor.findByIdAndDelete(id).exec();
  
  //aggiungi referenza al dottore deleted
  const result = await doctor.deleteOne()
  const reply = `Doctor and associated data deleted successfully`
  return res.json({
    message: reply,
  });
});

module.exports = { getAllDoctors, createNewDoctor, updateDoctor, deleteDoctor };
