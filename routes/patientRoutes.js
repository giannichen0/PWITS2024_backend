const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT")
const {isPatient} = require("../middleware/verifyRole")
router.use(verifyJWT)
router.use(isPatient)

router.route("/profile").get().put()

router.get("/doctor")
module.exports = router