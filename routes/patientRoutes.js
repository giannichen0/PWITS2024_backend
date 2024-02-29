const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const { isPatient } = require("../middleware/verifyRole");
const profileController = require("../controllers/patient/profileController")
const doctorController = require("../controllers/patient/doctorController")
const reportController = require("../controllers/patient/reportController")
const examController = require("../controllers/patient/examController")


router.use(verifyJWT);
router.use(isPatient);

router.
    route("/profile")
    .get(profileController.getPatientProfile)
    .put(profileController.updatePatient);

router.get("/doctors", doctorController.getDoctor)
router.get("/exams", examController.getExams)
router.get("/reports", reportController.getReports)

module.exports = router;
