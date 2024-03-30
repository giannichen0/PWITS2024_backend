const express = require("express");
const router = express.Router();
const utilityController = require("../controllers/utility/utilityController");
const verifyJWT = require("../middleware/verifyJWT");
const {isAdminOrDoctorOrPatient, isAdminOrDoctor} = require("../middleware/verifyRole")


router.post("/mail",[verifyJWT,isAdminOrDoctor], utilityController.emailSender);
router.post("/pdf",[verifyJWT,isAdminOrDoctorOrPatient], utilityController.pdfGenerator);
module.exports = router;
