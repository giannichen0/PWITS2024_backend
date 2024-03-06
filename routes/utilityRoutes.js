const express = require("express");
const router = express.Router();
const utilityController = require("../controllers/utility/utilityController");
const verifyJWT = require("../middleware/verifyJWT");
const {isAdminOrDoctor} = require("../middleware/verifyRole")


router.post("/mail",[verifyJWT,isAdminOrDoctor], utilityController.emailSender);
router.post("/pdf",[verifyJWT,isAdminOrDoctor], utilityController.pdfGenerator);
module.exports = router;
