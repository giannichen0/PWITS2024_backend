const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler"); //async functionality, cosi posso a fare a meno del promise chaining o try/catch block
const { checkDoctor, checkPatient, checkId } = require("../../helper/checker");
const Exam = require("../../models/Exam");
const jwtDecoder = require("../../helper/jwtDecoder");


//@desc GET all logged doctor's reports
//@route GET /patient/reports
//@access Private
const getReports = asyncHandler(async (req, res) => {
    const patientId = await jwtDecoder(req, res);
    const reports = await Report.find({ patient: patientId }).select("-report -__v -updatedAt").lean();
    if (!reports?.length) {
        return res.status(200).json({ message: "the patient have no reports" });
    }

    //map di report con il nome del dottore, del  paziente
    const reportWithDoctorPatient = await Promise.all(
        reports.map(async (report) => {
            const doctor = await Doctor.findById(report.doctor).lean().exec();
            const patient = await Patient.findById(report.patient)
                .lean()
                .exec();
            return {
                ...report,
                doctor: `${doctor.name} ${doctor.surname} id: ${doctor._id}`,
                patient: `${patient.name} ${patient.surname} id: ${patient._id}`,
            };
        })
    );
    res.json(reportWithDoctorPatient);
});


module.exports = {getReports}