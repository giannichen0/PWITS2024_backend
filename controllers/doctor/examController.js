const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Exam = require("../../models/Exam");
const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler"); //async functionality, cosi posso a fare a meno del promise chaining o try/catch block
const jwtDecoder = require("../../helper/jwtDecoder")

const {
  checkDoctor,
  checkPatient,
  checkReport,
  checkId,
} = require("../../helper/checker");

//@desc GET all Exam where doctor in report and patient equal to decoded.user.id
//@route GET /doctor/patient
//@access Private
const getAllExams = asyncHandler(async (req, res)=>{
    
})


module.exports = {getAllExams}