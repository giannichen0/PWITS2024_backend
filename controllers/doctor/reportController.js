const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler"); //async functionality, cosi posso a fare a meno del promise chaining o try/catch block
const { checkDoctor, checkPatient, checkId } = require("../../helper/checker");
const Exam = require("../../models/Exam");
const jwtDecoder = require("../../helper/jwtDecoder");

//@desc GET all logged doctor's reports
//@route GET /doctor/reports
//@access Private
const getReports = asyncHandler(async (req, res) => {
    const doctorId = await jwtDecoder(req, res);
    const reports = await Report.find({ doctor: doctorId }).select("-report -__v -updatedAt").lean();
    if (!reports?.length) {
        return res.status(200).json({ message: "Il dottore non ha nessun referto" });
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

//@desc POST Create a new report with logged doctor
//@route POST /doctor/reports
//@access Private
const createNewReport = asyncHandler(async (req, res) => {
    const { content, field, patient } = req.body;
    const doctor = await jwtDecoder(req, res);
    if (!content || !field || !patient || !doctor)
        return res
            .status(400)
            .json({ message: "Tutti i campi sono richiesti" });

    //possibile eliminare questi due check
    if (!checkId(doctor))
        return res.status(400).json({ message: "Dottore non valido" });
    if (!(await checkDoctor(doctor)))
        return res.status(400).json({
            message: "Il dottore associato al referto non è valido",
        });

    if (!checkId(patient))
        return res.status(400).json({ message: "Paziente non valido" });

    if (!(await checkPatient(patient)))
        return res.status(400).json({
            message: "Il paziente associato al referto non è valido",
        });

    const patientDoctor = await Patient.findById(patient).lean().exec();
    if (doctor.toString() !== patientDoctor.doctor.toString())
        return res.status(400).json({
            message: "Il dottore deve corrispondere al dottore sul referto",
        });

    const reportObj = {
        content,
        field,
        patient,
        doctor,
    };
    const report = await Report.create(reportObj);
    if (report) {
        res.status(201).json({ message: `Nuovo referto ${content} creato` });
    } else {
        res.status(400).json({ message: "Dati del referto non validi" });
    }
});

//@desc Update a report of the logged doctor
//@route PUT /doctor/reports
//@access Private
const updateReport = asyncHandler(async (req, res) => {
    const { id, content, field, patient} = req.body;

    if (!id) return res.status(400).json({ message: "Id mancate" });
    const doctor = await jwtDecoder(req,res)
    //id check
    if (!checkId(id))
        return res.status(400).json({ message: "Id non valido" });
    //possibile eliminare il check
    if (doctor != null && !checkId(doctor))
        return res.status(400).json({ message: "Dottore non valido" });
    if (patient != null && !checkId(patient))
        return res.status(400).json({ message: "Paziente non valido" });

    const report = await Report.findById(id).exec();

    if (!report || report?._id.toString() !== id)
        return res.status(404).json({ message: "referto non trovato" });

    if (content) report.content = content;
    if (field) {
        report.field = field;
        await Exam.updateMany(
            { report: report._id },
            { $set: { field: field } }
        );
    }

    const patientDoctor =
        patient != null
            ? await Patient.findById(patient).lean().exec()
            : report;
    if (doctor != null) {
        if (doctor.toString() !== patientDoctor.doctor.toString())
            return res.status(400).json({
                message:
                    "Il dottore sul reporto deve corrispondere al dottore del paziente",
            });
    }

    if (doctor != null) {
        if (await checkDoctor(doctor)) report.doctor = doctor;
        else
            return res
                .status(400)
                .json({ message: "Il dottore non esiste" });
    }
    if (patient != null) {
        if (await checkPatient(patient)) {
            report.patient = patient;
            await Exam.updateMany({ report: report._id },{ $set: { patient: patient } });
        } else
            return res
                .status(400)
                .json({ message: "Il paziente non esiste" });
    }

    await report.save();
    res.status(200).json({ message: "Referto aggiornato" });
});

//@desc delete an logged doctor's report
//@route DELETE /doctor/report
//@access Private
const deleteReport = asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "Id mancante" });
    if (!checkId(id)) return res.status(400).json({ message: "Id non valido" });
  
    const report = await Report.findById(id).exec();
    const doctor = await jwtDecoder(req,res);

    if(report.doctor != doctor) return res.status(400).json({message : "Il dottore loggato è diverso dal dottore sul referto"})
    if (!report) return res.status(404).json({ message: "Referto non trovato" });
  
    await Exam.deleteMany({ report: report._id });
  
    //aggiungi referenza al dottore deleted
    const result = await report.deleteOne();
    const reply = `Dati del referto eliminati con successo`;
    return res.json({
      message: reply,
    });
  });

module.exports = { getReports, createNewReport, updateReport, deleteReport };
