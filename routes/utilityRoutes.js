const express = require("express");
const router = express.Router();
const utilityController = require("../controllers/utility/utilityController")
// const verifyJWT = require("../middleware/verifyJWT")

// router.use(verifyJWT)

router.post("/mail", utilityController.emailSender)
router.get("/pdf", utilityController.pdfGenerator)
module.exports = router