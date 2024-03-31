const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Exam = require("../../models/Exam");
const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler"); //async functionality, cosi posso a fare a meno del promise chaining o try/catch block
const jwtDecoder = require("../../helper/jwtDecoder");

const {
    checkDoctor,
    checkPatient,
    checkReport,
    checkId,
} = require("../../helper/checker");

//@desc GET all Exam where doctor in report and patient equal to decoded.user.id
//@route GET /doctor/exams
//@access Private
const getExams = asyncHandler(async (req, res) => {
    const doctorId = await jwtDecoder(req, res);
    const exams = await Exam.find({ doctor: doctorId })
        .select("-exam -__v -updatedAt")
        .lean();
    if (!exams?.length) {
        return res
            .status(200)
            .json({
                message:
                    "Nessun esame associato al dottore loggato è stato trovato",
            });
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

//@desc Create a new exam with logged doctor
//@route POST /doctor/exam
//@access Private
const createNewExam = asyncHandler(async (req, res) => {
    const { content, field, patient, report, completed, doctor } = req.body;

    if (!content || !field || !patient || !doctor || !report) {
        return res
            .status(400)
            .json({ message: "Tutti i campi sono richiesti, tranne lo stato" });
    }
    //id check
    if (!checkId(doctor))
        return res.status(400).json({ message: "Dottore non valido" });
    if (!checkId(patient))
        return res.status(400).json({ message: "Paziente non valido" });
    if (!checkId(report))
        return res.status(400).json({ message: "Referto non valido" });

    //prima versione: Non permetto l'aggiunta di un esame se il dottore, il paziente e il referto non ci sono
    //seconda versione: se non ci sono li creo
    if (!(await checkDoctor(doctor)))
        return res.status(400).json({
            message: "Il dottore associato all'esame non esiste",
        });
    if (!(await checkPatient(patient)))
        return res.status(400).json({
            message: "Il paziente associato all'esame non esiste",
        });
    if (!(await checkReport(report)))
        return res.status(400).json({
            message: "Il referto associato all'esame non esiste",
        });

    const reportOBJ = await Report.findById(report).lean().exec();

    if (field.toString() !== reportOBJ.field.toString())
        return res.status(400).json({
            message:
                "Il campo medico del referto deve corrispondere al campo medico dell'esame",
        });
    if (patient.toString() !== reportOBJ.patient.toString())
        return res.status(400).json({
            message:
                "Il paziente dell'esame deve corrispondere al paziente del referto",
        });
    const examObj = {
        content,
        field,
        patient,
        doctor,
        report,
        completed: completed !== null ? completed : false,
    };

    const exam = await Exam.create(examObj);
    if (exam) {
        res.status(201).json({ message: `Nuovo esame ${content} creato` });
    } else {
        res.status(400).json({ message: "Dati dell'esame non validi" });
    }
});

//@desc Update an logged doctor's exam
//@route PUT /doctor/exam
//@access Private
const updateExam = asyncHandler(async (req, res) => {
    const { id, content, field, patient, report, completed } = req.body;
    if (!id) return res.status(400).json({ message: "Id mancante" });

    //id check
    if (!checkId(id))
        return res.status(400).json({ message: "Id non valido" });
    if (patient != null && !checkId(patient))
        return res.status(400).json({ message: "Paziente non valido" });
    if (report != null && !checkId(report))
        return res.status(400).json({ message: "Referto non valido" });

    const exam = await Exam.findById(id).exec();

    if (!exam || exam?._id.toString() !== id)
        return res.status(404).json({ message: "Esame non trovato" });

    if (content) exam.content = content;

    //se report è presente nel req.body
    if (report) {
        //check se report corrisponde a un report(oggetto)
        if (await checkReport(report)) {
            //direttamente. Da definizione, il dottore di exa può variare dal dottore di report
            exam.report = report;
        } else {
            return res.status(400).json({ message: "Referto non trovato" });
        }
        //Se il referto è presente, uso il paziente e il field del report che mi ha passato
        const reportObj = await Report.findById(report).lean().exec();
        exam.patient = reportObj.patient;
        exam.field = reportObj.field;
        exam.report = report;
    } else {
        //se il report non è presente nel req.body vuol dire che sto usando il report corente come base per la modifica dell'esame
        //aggiorno il field e il paziente di exam e nello stesso tempo aggiorno anche il field e il paziente del report corente
        //se patient non viene passato, uso il patient di exam
        if (patient && field) {
            if (await checkPatient(patient)) {
                exam.patient = patient;
                await Report.findByIdAndUpdate(exam.report, {
                    $set: { field: field, patient: patient },
                })
                    .lean()
                    .exec();
            } else {
                return res.status(400).json({ message: "Paziente non trovato" });
            }
        } else {
            if (!patient && field) {
                exam.field = field;
                await Report.findByIdAndUpdate(exam.report, {
                    $set: { field: field },
                })
                    .lean()
                    .exec();
            } else if (patient && !field) {
                if (await checkPatient(patient)) {
                    exam.patient = patient;
                    await Report.findByIdAndUpdate(exam.report, {
                        $set: { patient: patient },
                    })
                        .lean()
                        .exec();
                } else {
                    return res
                        .status(400)
                        .json({ message: "paziente non trovato" });
                }
            }
        }
    }
    if (completed !== undefined) exam.completed = completed;

    await exam.save();

    res.status(200).json({ message: "Esame aggiornato" });
    // if (field) exam.field = field;

    // if (report != null) {
    //     if (await checkReport(report)) {
    //         exam.report = report;
    //     } else {
    //         return res
    //             .status(400)
    //             .json({ message: "The report doesn't exist" });
    //     }
    // }

    // if (patient != null) {
    //     if (await checkPatient(patient)) {
    //         exam.patient = patient;
    //     } else {
    //         return res
    //             .status(400)
    //             .json({ message: "The patient doesn't exist" });
    //     }
    // }

    // if (doctor != null) {
    //     if (await checkDoctor(doctor)) {
    //         exam.doctor = doctor;
    //     } else {
    //         return res
    //             .status(400)
    //             .json({ message: "The doctor doesn't exist" });
    //     }
    // }

    // const reportOBJ =
    //     report != null ? await Report.findById(report).lean().exec() : exam;
    // if (patient != null) {
    //     if (patient.toString() !== reportOBJ.patient.toString())
    //         return res.status(404).json({
    //             message:
    //                 "the patient in the exam must match the patient in the report",
    //         });
    // }
    // if (field != null) {
    //     if (field.toString() !== reportOBJ.field.toString())
    //         return res.status(404).json({
    //             message:
    //                 "the field in the exam must match the field in the report",
    //         });
    // }

    // if (completed) exam.completed = completed;

    // await exam.save();
    // res.status(200).json({ message: "exam updated" });
});

//@desc delete an logged doctor's exam
//@route DELETE /doctor/exams
//@access Private
const deleteExam = asyncHandler(async (req, res) => {
    const { id } = req.body;
    const doctor = await jwtDecoder(req, res);
    if (!id) return res.status(400).json({ message: "Id mancante" });
    if (!checkId(id)) {
        return res.status(400).json({ message: "Id non valido" });
    }

    const exam = await Exam.findById(id).exec();
    if (exam.doctor != doctor)
        res.status(400).json({
            message: "Il dottore loggato è diverso dal dottore sull'esame",
        });
    if (!exam) return res.status(404).json({ message: "Esame non trovato" });

    //aggiungi referenza al dottore deleted
    const result = await exam.deleteOne();
    const reply = `Esame e i relativi dati eliminati con successo`;
    return res.json({
        message: reply,
    });
});

module.exports = { getExams, createNewExam, updateExam, deleteExam };
