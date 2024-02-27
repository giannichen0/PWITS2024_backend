require("dotenv").config();
const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Exam = require("../../models/Exam");
const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

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
            message: "missing data. Doctor and exam are required",
        });

    if (!checkId(doctor))
        return res.status(400).json({ message: "invalid doctor id" });
    //if (checkId(patient)) return res.status(400).json({ message: "invalid patient id" });
    if (!checkId(exam))
        return res.status(400).json({ message: "invalid exam id" });

    const doctorObj = await checkDoctor(doctor);
    const examObj = await checkExam(exam);
    const patientObj =
        (await checkPatient(patient)) != null
            ? await checkPatient(patient)
            : await Patient.findById(examObj.patient).lean().exec();

    if (!doctorObj)
        return res.status(400).json({ message: "doctor not found" });
    if (!patientObj)
        return res.status(400).json({ message: "patient not found" });
    if (!examObj) return res.status(400).json({ message: "exam not found" });

    if (
        doctorObj._id.toString() !== patientObj.doctor.toString() ||
        patientObj._id.toString() !== examObj.patient.toString()
    )
        return res
            .status(400)
            .json({ message: "the doctor must be the same patient's doctor" });

    const timeDifferenceMs = Date.now() - examObj.createdAt.getTime();
    if (!exam.completed && timeDifferenceMs > 60 * 24 * 1000) {
        const doctorExam = await Doctor.findById(examObj.doctor).lean().exec();
        const email = patientObj.email;
        const html = `<h1> Clinica Rossi</h1> 
    <h1>Paziente ${patientObj.name} ${patientObj.surname}</h1>
    <h1>Medico di base: ${doctorObj.name}</h1>
    <h1>Medico che effetuerà la visita: ${doctorExam.name}</h1>
    <h1>visita di tipo: ${examObj.field}</h1>
    <h1>dettaglio della visita: ${examObj.content}</h1>
    <h1>visita creata in data: ${examObj.createdAt.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })}</h1>
    <h1>la visita risulta ancora non effettuata</h1>
    `;
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
                    //to : email,
                    to: "gianni.chen@fitstic-edu.com",
                    html: html,
                    subject: "test con nodemailer",
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
                return res.status(200).json({ message: "mail sended" });
            })
            .catch((err) => {
                return res
                    .status(500)
                    .json({ message: "impossible to send email" + err });
            });
    }

    //res.status(200).json({message : "the exam does not exceed 60 days"})
});

//@desc GET generate a sample pdf and send it back
//@route PUT /utility/pdf
//@access Private
const pdfGenerator = asyncHandler(async (req, res) => {
    const doc = new PDFDocument();
    // Create a buffer to store the PDF content
    let buffer = Buffer.from([]);

    // Pipe the PDF content to the buffer
    doc.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
    });

    // When the PDF document is finished, resolve with the buffer
    doc.on("end", () => {
        res.setHeader("Content-Type", "application/pdf");
        res.status(200).send(buffer);
    });
    doc.fontSize(20);
    doc.text("Hello, PDFKit!", { align: "center" });
    doc.moveDown();
    doc.fontSize(14);
    doc.text("This is a simple PDF generated using PDFKit.");

    // Finalize the PDF document
    doc.end();
});

module.exports = { emailSender, pdfGenerator };
