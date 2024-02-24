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

//@desc GET all exams
//@route GET /admin/exams
//@access Private
const getAllExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find().lean();
  if (!exams?.length) {
    return res.status(404).json({ message: "No exams found" });
  }

  //map del exam con il nome del dottore, del  paziente e del report
  const examWithDoctorPatientReport = await Promise.all(
    exams.map(async (exam) => {
      const doctor = await Doctor.findById(exam.doctor).lean().exec();
      const patient = await Patient.findById(exam.patient).lean().exec();
      const report = await Report.findById(exam.report).lean().exec();
      return {
        ...exam,
        doctor: doctor.name + " " + doctor.surname + "/ " + doctor._id,
        patient: patient.name + " " + patient.surname + "/ " + patient._id,
        report: report.content+ "/ " + report._id,
      };
    })
  );
  res.json(examWithDoctorPatientReport);
});

//@desc Create a new exam
//@route POST /admin/exam
//@access Private
const createNewExam = asyncHandler(async (req, res) => {
  const { content, field, patient, doctor, report, completed } = req.body;
  if (!content || !field || !patient || !doctor || !report) {
    return res
      .status(400)
      .json({ message: "All fields are required except completed" });
  }
  if (!checkId(doctor)) {
    return res.status(400).json({ message: "doctor is not valid" });
  }
  if (!checkId(patient)) {
    return res.status(400).json({ message: "patient is not valid" });
  }
  if (!checkId(report)) {
    return res.status(400).json({ message: "report is not valid" });
  }

  //prima versione: Non permetto l'aggiunta di un esame se il dottore, il paziente e il referto non ci sono
  //seconda versione: se non ci sono li creo
  if (!(await checkDoctor(doctor))) {
    return res
      .status(400)
      .json({ message: "the doctor associated to the exam is not defined" });
  }
  if (!(await checkPatient(patient))) {
    return res
      .status(400)
      .json({ message: "the patient associated to the exam is not defined" });
  }
  if (!(await checkReport(report))) {
    return res
      .status(400)
      .json({ message: "the report associated to the exam is not defined" });
  }
  if ((await checkReport.field) !== field) {
    return res.status(400).json({
      message:
        "the field of the report and the field of the exam must be the same",
    });
  }
  
  const examObj = {
    content,
    field,
    patient,
    doctor,
    report,
    completed,
  };
  const exam = await Exam.create(examObj);
  if (exam) {
    res.status(201).json({ message: `new exam ${content} created` });
  } else {
    res.status(400).json({ message: "Invalid exam data " });
  }
});

//@desc Update a exam
//@route PUT /admin/exam
//@access Private
const updateExam = asyncHandler(async (req, res) => {
  const { id, content, field, patient, doctor, report, completed } = req.body;
  if (!id) {
    return res.status(400).json({ message: "missing ID" });
  }
  if (!checkId(id)) {
    return res.status(400).json({ message: "ID is not valid" });
  }
  if (!checkId(doctor)) {
    return res.status(400).json({ message: "doctor is not valid" });
  }
  if (!checkId(patient)) {
    return res.status(400).json({ message: "patient is not valid" });
  }
  if (!checkId(report)) {
    return res.status(400).json({ message: "report is not valid" });
  }
  //no .lean() perchè vogliamo un moongose document object e non un pojo
  const exam = await Exam.findById(id).exec();

  if (!exam || exam?._id.toString() !== id) {
    return res.status(404).json({ message: "exam not found" });
  }
  if (content) exam.content = content;
  if (field) exam.field = field;

  if (await checkPatient(patient)) exam.patient = patient;
  else return res.status(400).json({ message: "the patient doesn't exists" });

  if (await checkDoctor(doctor)) exam.doctor = doctor;
  else return res.status(400).json({ message: "the doctor doesn't exists" });

  if (await checkReport(report)) exam.report = report;
  else return res.status(400).json({ message: "the report doesn't exists" });

  if (completed) exam.completed = completed;

  
  await exam.save();
  res.status(200).json({ message: "exam updated" });
});

//@desc delete a exam
//@route DELETE /admin/exams
//@access Private
const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "Missing ID" });
  if (!checkId(id)) {
    return res.status(400).json({ message: "ID is not valid" });
  }

  const exam = await Exam.findById(id).exec();
  if (!exam) return res.status(404).json({ message: "exam non found" });


  //aggiungi referenza al dottore deleted
  const result = await exam.deleteOne();
  const reply = `exam and associated data deleted successfully`;
  return res.json({
    message: reply,
  });
});

module.exports = { getAllExams, createNewExam, updateExam, deleteExam };
