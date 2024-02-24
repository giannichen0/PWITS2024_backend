const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Exam = require("../../models/Exam");
const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler"); //async functionality, cosi posso a fare a meno del promise chaining o try/catch block
const {
  checkDoctor,
  checkPatient,
  checkReport,
  checkId,
} = require("../../helper/checker");

//@desc GET all reports
//@route GET /admin/reports
//@access Private
const getAllReports = asyncHandler(async (req, res) => {
  const reports = await Report.find().lean();
  if (!reports?.length) {
    return res.status(404).json({ message: "No report found" });
  }

  //map di report con il nome del dottore, del  paziente
  const reportWithDoctorPatient = await Promise.all(
    reports.map(async (report) => {
      const doctor = await Doctor.findById(report.doctor).lean().exec();
      const patient = await Patient.findById(report.patient).lean().exec();
      return {
        ...report,
        doctor: `${doctor.name} ${doctor.surname} id: ${doctor._id}`,
        patient: `${patient.name} ${patient.surname} id: ${patient._id}`,
      };
    })
  );
  res.json(reportWithDoctorPatient);
});

//@desc Create a new report
//@route POST /admin/reports
//@access Private
const createNewReport = asyncHandler(async (req, res) => {
  const { content, field, patient, doctor } = req.body;
  if (!content || !field || !patient || !doctor) return res.status(400).json({ message: "All fields are required except" });
  
  if (!checkId(doctor)) return res.status(400).json({ message: "doctor is not valid" });
  
  if (!checkId(patient)) return res.status(400).json({ message: "patient is not valid" });
  

  //prima versione: Non permetto l'aggiunta di un esame se il dottore, il paziente e il referto non ci sono
  //seconda versione: se non ci sono li creo
  if (!(await checkDoctor(doctor))) return res.status(400).json({ message: "the doctor associated to the report is not defined" });
  
  if (!(await checkPatient(patient))) return res.status(400).json({ message: "the patient associated to the report is not defined" });
  
  const patientDoctor = await Patient.findById(patient).lean().exec();
  if(doctor.toString() !== patientDoctor.doctor.toString()) return res.status(400).json({message : "the doctor on the report must match the patient's doctor"})
  
  const reportObj = {
    content,
    field,
    patient,
    doctor
  };
  const report = await Report.create(reportObj);
  if (report) {
    res.status(201).json({ message: `new report ${content} created` });
  } else {
    res.status(400).json({ message: "Invalid report data " });
  }
});

//@desc Update a report
//@route PUT /admin/report
//@access Private
const updateReport = asyncHandler(async (req, res) => {
  const { id, content, field, patient, doctor } = req.body;

  if (!id) return res.status(400).json({ message: "missing ID" });

  //id check
  if (!checkId(id)) return res.status(400).json({ message: "ID is not valid" });
  if (!checkId(doctor)) return res.status(400).json({ message: "doctor is not valid" });
  if (!checkId(patient)) return res.status(400).json({ message: "patient is not valid" });
  
  const report = await Report.findById(id).exec();

  if (!report || report?._id.toString() !== id) return res.status(404).json({ message: "exam not found" });
  
  if (content) report.content = content;
  if (field) report.field = field;

  const patientDoctor = await Patient.findById(patient).lean().exec();
  console.log(JSON.stringify(patientDoctor, null, 2));
  if(doctor.toString() !== patientDoctor.doctor.toString()) return res.status(400).json({message : "the doctor on the report must match the patient's doctor"})

  if (await checkDoctor(doctor)) report.doctor = doctor;
  else return res.status(400).json({ message: "the doctor doesn't exists" });

  if (await checkPatient(patient)) report.patient = patient;
  else return res.status(400).json({ message: "the patient doesn't exists" });

  // const duplicate = await Doctor.findOne({name}).lean().exec()
  // if(duplicate && duplicate?._id.toString() !==id){
  //     return res.status(409).json({message:"duplicate name"})
  // }
  
  
  await report.save();
  res.status(200).json({ message: "report updated" });
});

//@desc delete a report
//@route DELETE /admin/report
//@access Private
const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "Missing ID" });
  if (!checkId(id)) return res.status(400).json({ message: "ID is not valid" });
  

  const report = await Report.findById(id).exec();
  if (!report) return res.status(404).json({ message: "report non found" });

  //aggiungi referenza al dottore deleted
  const result = await report.deleteOne();
  const reply = `report data deleted successfully`;
  return res.json({
    message: reply,
  });
});

module.exports = {getAllReports, createNewReport, updateReport, deleteReport}