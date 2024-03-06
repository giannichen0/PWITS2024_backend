const express = require("express");
const router = express.Router();
const utilityController = require("../controllers/utility/utilityController");
const verifyJWT = require("../middleware/verifyJWT");
const {isAdminOrDoctor} = require("../middleware/verifyRole")


router.post("/mail",[verifyJWT,isAdminOrDoctor], utilityController.emailSender);

//scommentare dopo presentazione
//router.get("/pdf", utilityController.pdfGenerator);
module.exports = router;
