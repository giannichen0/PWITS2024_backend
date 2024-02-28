const express = require("express");
const router = express.Router();
const profileController = require("../controllers/doctor/profileController");
const patientController = require("../controllers/doctor/patientController");
const examController = require("../controllers/doctor/examController");
const reportController = require("../controllers/doctor/reportController");
const verifyJWT = require("../middleware/verifyJWT");
const { isDoctor } = require("../middleware/verifyRole");

router.use(verifyJWT);
router.use(isDoctor);

router
    .route("/profile")
    .get(profileController.getDoctorProfile)
    .post(profileController.updateDoctor);

router
    .route("/patients")
    .get(patientController.getPatients)
    .post(patientController.createNewPatient)
    .put(patientController.updatePatient)
    .delete(patientController.deletePatient);
router
    .route("/reports")
    .get(reportController.getReports)
    .post(reportController.createNewReport)
    .put(reportController.createNewReport)
    .delete(reportController.deleteReport);

router
    .route("/exams")
    .get(examController.getExams)
    .post(examController.createNewExam)
    .put(examController.updateExam)
    .delete(examController.deleteExam);

module.exports = router;
