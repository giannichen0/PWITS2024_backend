const Admin = require("../../models/Admin");
const bcrypt = require("bcrypt"); //hash password
const asyncHandler = require("express-async-handler");

const createNewAdmin = asyncHandler(async (req, res) => {
    const { name, surname, password, email, telefono } = req.body;
    if (!name || !surname || !password || !email || !telefono) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    const hashedPwd = await bcrypt.hash(password, 10);
    const adminObj = { name, surname, password: hashedPwd, email, telefono };
  
    const admin = await Admin.create(adminObj);
    if (admin) {
      res.status(201).json({ message: `new admin ${name} created` });
    } else {
      res.status(400).json({ message: "Invalid admin data " });
    }
  });
module.exports = {createNewAdmin}