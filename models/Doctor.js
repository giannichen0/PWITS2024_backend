const mongoose = require("mongoose")

const DoctorSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    surname:{
        type: String,
        required : true
    },
    password: {
        type : String,
        required : true
    },
    email: {
        type : String,
        required : true
    },
    telefono: {
        type : String,
        required : true,
    }
})

module.exports = mongoose.model("Doctor", DoctorSchema)