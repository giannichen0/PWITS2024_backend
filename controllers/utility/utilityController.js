require("dotenv").config();
const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Exam = require("../../models/Exam");
const Report = require("../../models/Report");
const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
const path = require("path");

const fsPromises = require("fs").promises;

const {
    checkId,
    checkDoctor,
    checkExam,
    checkPatient,
} = require("../../helper/checker");

//@desc POST send a email to patient
//@route POST /utility/mail
//@access Private
const emailSender = asyncHandler(async (req, res) => {
    const { doctor, patient, exam } = req.body;
    if (!doctor || !exam)
        return res.status(400).json({
            message: "Dati mancanti. Dottore e Esami sono richiesti",
        });

    if (!checkId(doctor))
        return res.status(400).json({ message: "Dottore non valido" });
    //if (checkId(patient)) return res.status(400).json({ message: "invalid patient id" });
    if (!checkId(exam))
        return res.status(400).json({ message: "Esame non valido" });

    const doctorObj = await checkDoctor(doctor);
    const examObj = await checkExam(exam);
    const patientObj =
        (await checkPatient(patient)) != null
            ? await checkPatient(patient)
            : await Patient.findById(examObj.patient).lean().exec();

    if (!doctorObj)
        return res.status(400).json({ message: "Dottore non trovato" });
    if (!patientObj)
        return res.status(400).json({ message: "Paziente non trovato" });
    if (!examObj) return res.status(400).json({ message: "Esame non trovato" });

    if (patientObj._id.toString() !== examObj.patient.toString())
        return res.status(400).json({
            message: "Il dottore deve corrisondere al dottore del paziente",
        });

    // const timeDifferenceMs = Date.now() - examObj.createdAt.getTime();
    // if (!exam.completed && timeDifferenceMs > 60 * 24 * 1000)

    const createdAtDate = new Date(examObj.createdAt);
    const currentDate = new Date();
    const differenceInDays = Math.floor(
        (currentDate - createdAtDate) / (1000 * 60 * 60)
        // *24 differenza in ore cosi.
    );
    if (differenceInDays > 5) {
        const doctorExam = await Doctor.findById(examObj.doctor).lean().exec();
        const email = patientObj.email;

        const replacements = {
            "{{data}}": examObj.createdAt.toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }),
            "{{exam}}": examObj._id,
            "{{examId}}": examObj._id,
            "{{patient}}": patientObj.name + " " + patientObj.surname,
            "{{doctor}}": doctorObj.name + " " + doctorObj.surname,
            "{{doctorReport}}": patientObj.name + " " + patientObj.surname,
            "{{report}}": examObj.report,
            "{{examField}}": examObj.field,
            "{{examContent}}": examObj.content,
            "{{completed}}":
                examObj.completed == true ? "effettuato" : "non effettuato",
            "{{examCreatedAt}}": new Date().toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }),
        };

        const htmlTemplate = await fsPromises.readFile(
            path.join(__dirname, "..", "..", "template", "email.html"),
            "utf-8"
        );
        const htmlContent = Object.entries(replacements).reduce(
            (html, [placeholder, value]) => html.replace(placeholder, value),
            htmlTemplate
        );
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "chengianni38@gmail.com",
                pass: process.env.APP_PASSWORD_GIANNICHEN,
            },
        });
        await new Promise((resolve, reject) => {
            transport.sendMail(
                {
                    from: "chengianni38@gmail.com",
                    to: email,
                    html: htmlContent,
                    subject: "Solecitazione Esame " + examObj._id,
                },
                (err, info) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(info);
                    }
                }
            );
        })
            .then(() => {
                return res.status(200).json({ message: "Email inviato" });
            })
            .catch((err) => {
                return res.status(500).json({
                    message: "Impossibile inviare mail. Errore: " + err,
                });
            });
    }

    //res.status(200).json({message : "the exam does not exceed 60 days"})
});

//@desc GET generate a sample pdf and send it back
//@route PUT /utility/pdf
//@access Private
const pdfGenerator = asyncHandler(async (req, res) => {
    const { doctorId, patientId, examId, reportId } = req.body;

    const doctor = await Doctor.findById(doctorId).lean().exec();
    const patient = await Patient.findById(patientId).lean().exec();
    const exam = await Exam.findById(examId).lean().exec();
    const report = await Report.findById(reportId).lean().exec();
    const doctorReport = await Doctor.findById(report.doctor).lean().exec();

    const replacements = {
        "{{data}}": exam.createdAt.toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }),
        "{{exam}}": examId,
        "{{patient}}": patient.name + " " + patient.surname,
        "{{doctor}}": doctor.name + " " + doctor.surname,
        "{{doctorReport}}": doctorReport.name + " " + doctorReport.surname,
        "{{report}}": reportId,
        "{{examField}}": exam.field,
        "{{examContent}}": exam.content,
        "{{completed}}":
            exam.completed == true ? "effettuato" : "non effettuato",
        "{{examCreatedAt}}": new Date().toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }),
    };

    const htmlTemplate = await fsPromises.readFile(
        path.join(__dirname, "..", "..", "template", "pdf.html"),
        "utf-8"
    );
    const htmlContent = Object.entries(replacements).reduce(
        (html, [placeholder, value]) => html.replace(placeholder, value),
        htmlTemplate
    );
    const browser = await puppeteer.launch({
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
        ],
        executablePath:
            process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer.executablePath(),
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent);

    const buffer = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();

    // Stream PDF buffer
    res.setHeader("Content-Type", "application/pdf");
    res.send(buffer);
});
module.exports = { emailSender, pdfGenerator };
