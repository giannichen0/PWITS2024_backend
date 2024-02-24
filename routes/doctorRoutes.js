const express = require("express");
const router = express.Router();
const profileController = require("../controllers/doctor/profileController")

router.get("/profile/:doctorID", profileController.getDoctorProfile)
router.put('/profile', profileController.updateDoctor);

module.exports = router
  