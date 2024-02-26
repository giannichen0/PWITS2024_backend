require("dotenv").config();
const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Exam = require("../../models/Exam");
const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const { checkId, checkDoctor, checkExam, checkPatient } = require("../../helper/checker");

const emailSender = asyncHandler(async (req, res) => {
  const { doctor, patient, exam } = req.body;
  if (!doctor || !patient || !exam)
    return res
      .status(400)
      .json({
        message: "missing data. Doctor, patient, and exam are required",
      });

    
  if (checkId(doctor))
    return res.status(400).json({ message: "invalid doctor id" });
  if (checkId(patient))
    return res.status(400).json({ message: "invalid patient id" });
  if (checkId(exam))
    return res.status(400).json({ message: "invalid exam id" });

  const doctorObj = await checkDoctor(doctor);
  const patientObj = await checkPatient(patient);
  const examObj = await checkExam(exam);

  if (!doctorObj) return res.status(400).json({ message: "doctor not found" });
  if (!patientObj) return res.status(400).json({ message: "patient not found" });
  if (!examObj) return res.status(400).json({ message: "exam not found" });

  if (doctorObj._id.toString() !== patientObj.doctor.toString())
    return res
      .status(400)
      .json({ message: "the doctor must be the same as the patient's doctor" });
  if (
    doctorObj._id.toString() !== examObj.doctor.toString() ||
    patientObj._id.toString() !== examObj.patient.toString()
  )
    return res
      .status(400)
      .json({
        message: "the doctor adn the patient must be the same as in exam",
      });

  const timeDifferenceMs = Date.now() - updatedAtDate.getTime();
  if (!exam.completed && timeDifferenceMs > 60 * 24 * 60 * 60 * 1000) {
    const email = patient.email;
    const html = `<h1> questo è il primo mail inviato con nodemailer</h1>`;
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

  res.status(200).json({message : "the exam does not exceed 60 days"})
});

module.exports = { emailSender };
