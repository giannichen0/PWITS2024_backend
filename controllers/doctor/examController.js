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
    const exams = await Exam.find({ doctor: doctorId }).lean();
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

//@desc Create a new exam with logged doctor
//@route POST /doctor/exam
//@access Private
const createNewExam = asyncHandler(async (req, res) => {
    const { content, field, patient, report, completed } = req.body;
    const doctor = await jwtDecoder(req, res);
    if (!content || !field || !patient || !doctor || !report) {
        return res
            .status(400)
            .json({ message: "All fields are required except completed" });
    }
    //id check
    if (!checkId(doctor))
        return res.status(400).json({ message: "doctor is not valid" });
    if (!checkId(patient))
        return res.status(400).json({ message: "patient is not valid" });
    if (!checkId(report))
        return res.status(400).json({ message: "report is not valid" });

    //prima versione: Non permetto l'aggiunta di un esame se il dottore, il paziente e il referto non ci sono
    //seconda versione: se non ci sono li creo
    if (!(await checkDoctor(doctor)))
        return res.status(400).json({
            message: "the doctor associated to the exam is not defined",
        });
    if (!(await checkPatient(patient)))
        return res.status(400).json({
            message: "the patient associated to the exam is not defined",
        });
    if (!(await checkReport(report)))
        return res.status(400).json({
            message: "the report associated to the exam is not defined",
        });

    const reportOBJ = await Report.findById(report).lean().exec();

    if (field.toString() !== reportOBJ.field.toString())
        return res.status(400).json({
            message: "the field in exam must match the field in report",
        });
    if (patient.toString() !== reportOBJ.patient.toString())
        return res.status(400).json({
            message: "the patient in exam must match the patient in report",
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
        res.status(201).json({ message: `new exam ${content} created` });
    } else {
        res.status(400).json({ message: "Invalid exam data " });
    }
});

//@desc Update an logged doctor's exam
//@route PUT /doctor/exam
//@access Private
const updateExam = asyncHandler(async (req, res) => {
    const { id, content, field, patient, report, completed } = req.body;
    if (!id) return res.status(400).json({ message: "missing ID" });

    //id check
    if (!checkId(id))
        return res.status(400).json({ message: "ID is not valid" });
    if (patient != null && !checkId(patient))
        return res.status(400).json({ message: "patient is not valid" });
    if (report != null && !checkId(report))
        return res.status(400).json({ message: "report is not valid" });

    const exam = await Exam.findById(id).exec();

    if (!exam || exam?._id.toString() !== id)
        return res.status(404).json({ message: "exam not found" });

    if (content) exam.content = content;

     //se report è presente nel req.body
     if(report){
        //check se report corrisponde a un report(oggetto)
        if(await checkReport(report)){
            //direttamente. Da definizione, il dottore di exa può variare dal dottore di report
            exam.report = report
        }else{
            return res.status(400).json({message : "report not found"})
        }
        //Se il referto è presente, uso il paziente e il field del report che mi ha passato
        const reportObj = await Report.findById(report).lean().exec()
        exam.patient = reportObj.patient
        exam.field = reportObj.field
        exam.report = report
    }else{
        //se il report non è presente nel req.body vuol dire che sto usando il report corente come base per la modifica dell'esame
        //aggiorno il field e il paziente di exam e nello stesso tempo aggiorno anche il field e il paziente del report corente
        //se patient non viene passato, uso il patient di exam
        if(patient && field){
            if(await checkPatient(patient)){
                exam.patient = patient
                await Report.findByIdAndUpdate(exam.report, { $set: { field: field, patient: patient } }).lean().exec()
            }else{
                return res.status(400).json({message : "patient not found"})
            }
        }else{
            if(!patient && field){
                exam.field = field
                await Report.findByIdAndUpdate(exam.report, { $set: { field: field} }).lean().exec()
            }else if(patient && !field){
                if(await checkPatient(patient)){
                    exam.patient = patient
                    await Report.findByIdAndUpdate(exam.report, { $set: { patient: patient } }).lean().exec()
                }else{
                    return res.status(400).json({message : "patient not found"})
                }
            }
        }   
    }
    if (completed !== undefined) exam.completed = completed;

    await exam.save();
    
    res.status(200).json({ message: "exam updated" });
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
    if (!id) return res.status(400).json({ message: "Missing ID" });
    if (!checkId(id)) {
        return res.status(400).json({ message: "ID is not valid" });
    }

    const exam = await Exam.findById(id).exec();
    if (exam.doctor != doctor)
        res.status(400).json({
            message: "the logged doctor is different than the exam's doctor",
        });
    if (!exam) return res.status(404).json({ message: "exam non found" });

    //aggiungi referenza al dottore deleted
    const result = await exam.deleteOne();
    const reply = `exam data deleted successfully`;
    return res.json({
        message: reply,
    });
});

module.exports = { getExams, createNewExam, updateExam, deleteExam };
