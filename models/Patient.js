const mongoose = require("mongoose")

const PatientSchema = new mongoose.Schema({
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
    },
    doctor: {
        type : mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Doctor"
    }
})

module.exports = mongoose.model("Patient", PatientSchema)