const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Exam = require("../models/Exam");
const Report = require("../models/Report");
const mongoose = require("mongoose");

const checkDoctor = async (doctor) => {
  return await Doctor.findById(doctor).lean().exec();
}; 

const checkPatient = async (patient) => {
  return await Patient.findById(patient).lean().exec();
};

const checkReport = async (report) => {
  return await Report.findById(report).lean().exec();
};

const checkExam = async (exam) =>{
    return await Exam.findById(exam).lean().exec();
}

const checkId = (id)=>{
    return mongoose.isValidObjectId(id)
}
module.exports = {checkDoctor, checkPatient, checkReport, checkExam, checkId}