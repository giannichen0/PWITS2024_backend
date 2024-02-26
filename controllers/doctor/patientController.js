const Doctor = require("../../models/Doctor");
const bcrypt = require("bcrypt"); //hash password
const asyncHandler = require("express-async-handler");
const {checkId} = require("../../helper/checker");
const Patient = require("../../models/Patient");


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


module.exports = {getPatients}