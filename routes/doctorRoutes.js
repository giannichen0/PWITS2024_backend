const express = require("express");
const router = express.Router();
const profileController = require("../controllers/doctor/profileController");
const patientController = require("../controllers/doctor/patientController");
const verifyJWT = require("../middleware/verifyJWT");
const { isDoctor } = require("../middleware/verifyRole");

router.use(verifyJWT);
router.use(isDoctor);

router
    .route("/profile")
    .get(profileController.getDoctorProfile)
    .post(profileController.updateDoctor);

router
    .route("patients")
    .get(patientController.getPatients)
    .post(patientController.createNewPatient)
    .put(patientController.updatePatient);

module.exports = router;
