const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Exam = require("../../models/Exam");
const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler"); //async functionality, cosi posso a fare a meno del promise chaining o try/catch block
const jwtDecoder = require("../../helper/jwtDecoder");



//@desc GET all Exam where doctor in report and patient equal to decoded.user.id
//@route GET /patient/exams
//@access Private
const getExams = asyncHandler(async (req, res) => {
    const patientId = await jwtDecoder(req, res); 
    const exams = await Exam.find({ patient: patientId }).lean();
    if (!exams?.length) {
        return res
            .status(200)
            .json({ message: "No exams associated with logged doctor found" });
    }

    //map del exam con il nome del dottore, del  paziente e del report
    const examWithDoctorPatientReport = await Promise.all(
        exams.map(async (exam) => {
            const doctor = await Doctor.findById(exam.doctor).lean().exec();
            const patient = await Patient.findById(exam.patient).lean().exec();
            const report = await Report.findById(exam.report).lean().exec();
            return {
                ...exam,
                doctor: `${doctor.name} ${doctor.surname} id: ${doctor._id}`,
                patient: `${patient.name} ${patient.surname} id: ${patient._id}`,
                report: `${report.content} id: ${report._id}`,
            };
        })
    );
    res.json(examWithDoctorPatientReport);
});

module.exports = {getExams}