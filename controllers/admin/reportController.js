const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler"); //async functionality, cosi posso a fare a meno del promise chaining o try/catch block
const { checkDoctor, checkPatient, checkId } = require("../../helper/checker");
const Exam = require("../../models/Exam");

//@desc GET all reports
//@route GET /admin/reports
//@access Private
const getAllReports = asyncHandler(async (req, res) => {
  const reports = await Report.find().select("-report -__v -updatedAt").lean();
  if (!reports?.length) {
    return res.status(404).json({ message: "Nessun referto trovato" });
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

//@desc POST Create a new report
//@route POST /admin/reports
//@access Private
const createNewReport = asyncHandler(async (req, res) => {
  const { content, field, patient, doctor } = req.body;
  if (!content || !field || !patient || !doctor)
    return res.status(400).json({ message: "Tutti i campi sono richiesti" });

  if (!checkId(doctor))
    return res.status(400).json({ message: "Dottore non valido" });

  if (!checkId(patient))
    return res.status(400).json({ message: "Paziente non valido" });

  //prima versione: Non permetto l'aggiunta di un esame se il dottore, il paziente e il referto non ci sono
  //seconda versione: se non ci sono li creo
  if (!(await checkDoctor(doctor)))
    return res
      .status(400)
      .json({ message: "Il dottore associato al referto non è definito" });

  if (!(await checkPatient(patient)))
    return res
      .status(400)
      .json({ message: "Il paziente associato al referto non è definito" });

  const patientDoctor = await Patient.findById(patient).lean().exec();
  if (doctor.toString() !== patientDoctor.doctor.toString())
    return res.status(400).json({
      message: "Il dottore sul referto deve corrispondere al dottore del paziente ",
    });

  const reportObj = {
    content,
    field,
    patient,
    doctor,
  };
  const report = await Report.create(reportObj);
  if (report) {
    res.status(201).json({ message: `nuovo referto ${content} creato` });
  } else {
    res.status(400).json({ message: "Dati del referto non validi " });
  }
});

//@desc Update a report
//@route PUT /admin/report
//@access Private
const updateReport = asyncHandler(async (req, res) => {
  const { id, content, field, patient, doctor } = req.body;

  if (!id) return res.status(400).json({ message: "Id mancante" });

  //id check
  if (!checkId(id)) return res.status(400).json({ message: "Id non valido" });
  if (doctor != null && !checkId(doctor))
    return res.status(400).json({ message: "Dottore non valido" });
  if (patient != null && !checkId(patient))
    return res.status(400).json({ message: "Paziente non valido" });

  const report = await Report.findById(id).exec();

  if (!report || report?._id.toString() !== id)
    return res.status(404).json({ message: "Referto non valido" });

  if (content) report.content = content;
  if (field) {
    report.field = field;
    await Exam.updateMany({ report: report._id }, { $set: { field: field } });
  }

  const patientDoctor = patient != null ? await Patient.findById(patient).lean().exec() : report;
  if (doctor != null && doctor.toString() !== patientDoctor.doctor.toString()) {
    return res.status(400).json({
      message: "Il dottore sul referto deve corrispondere al dottore del paziente",
    });
  }

  if (doctor != null) {
    if (await checkDoctor(doctor)) report.doctor = doctor;
    else return res.status(400).json({ message: "Il dottore non esiste" });
  }
  if (patient != null) {
    if (await checkPatient(patient)){
        report.patient = patient;
        await Exam.updateMany({ report: report._id }, { $set: { patient: patient } });
        
    }
    else return res.status(400).json({ message: "Il paziente non esiste" });
  }

  await report.save();
  res.status(200).json({ message: "Referto aggiornato" });
});

//@desc delete a report
//@route DELETE /admin/report
//@access Private
const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "Id mancante" });
  if (!checkId(id)) return res.status(400).json({ message: "Id non valido" });

  const report = await Report.findById(id).exec();
  if (!report) return res.status(404).json({ message: "Referto non valido" });

  await Exam.deleteMany({ report: report._id });

  //aggiungi referenza al dottore deleted
  const result = await report.deleteOne();
  const reply = `Dati del referto eliminati con successo`;
  return res.json({
    message: reply,
  });
});

module.exports = { getAllReports, createNewReport, updateReport, deleteReport };
