const express = require("express");
const router = express.Router();
const profileController = require("../controllers/doctor/profileController")
const patientController = require("../controllers/doctor/patientController")
const verifyJWT = require("../middleware/verifyJWT")
const {isDoctor} = require("../middleware/verifyRole")


router.use(verifyJWT)
router.use(isDoctor)

router.get("/profile/:doctorID", profileController.getDoctorProfile)
router.put('/profile', profileController.updateDoctor);

router.get("/patients/:doctorID", patientController.getPatients)
    

module.exports = router
  