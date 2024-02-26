const express = require("express");
const router = express.Router();
const utilityController = require("../controllers/utility/utilityController")



router.post("/mail", utilityController.emailSender)

module.exports = router