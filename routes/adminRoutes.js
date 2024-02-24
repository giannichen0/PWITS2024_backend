const express = require("express");
const router = express.Router();
const doctorsContoller = require("../controllers/admin/doctorsController");
const patientsController = require("../controllers/admin/patientsController");
const examsController = require("../controllers/admin/examController")
const reportController = require("../controllers/admin/reportController")

router
  .route("/doctors")
  .get(doctorsContoller.getAllDoctors)
  .post(doctorsContoller.createNewDoctor)
  .put(doctorsContoller.updateDoctor)
  .delete(doctorsContoller.deleteDoctor);

router
  .route("/patients")
  .get(patientsController.getAllPatients)
  .post(patientsController.createNewPatient)
  .put(patientsController.updatePatient)
  .delete(patientsController.deletePatient);

router
  .route("/exams")
  .get(examsController.getAllExams)
  .post(examsController.createNewExam)
  .put(examsController.updateExam)
  .delete(examsController.deleteExam);

router
  .route("/reports")
  .get(reportController.getAllReports)
  .post(reportController.createNewReport)
  .put(reportController.updateReport)
  .delete(reportController.deleteReport);

module.exports = router;