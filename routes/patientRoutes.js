const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT")
const {isPatient} = require("../middleware/verifyRole")
router.use(verifyJWT)
router.use(isPatient)



module.exports = router