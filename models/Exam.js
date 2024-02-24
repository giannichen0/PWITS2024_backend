const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose)

const ExamSchema = new mongoose.Schema(
    {
        content : {
            type : String,
            required : true
        },
        field: {
            type : String,
            required : true
        },
        patient: {
            type : mongoose.Schema.Types.ObjectId,
            required : true,
            ref : "Patient"
        },
        doctor: {
            type : mongoose.Schema.Types.ObjectId,
            required : true,
            ref : "Doctor"
        },
        report: {
            type : mongoose.Schema.Types.ObjectId,
            required : true,
            ref : "Report"
        },
        completed: {
            type : Boolean,
            default: false
        }
    },
    {
        timestamps : true
    }
)

ExamSchema.plugin(AutoIncrement,{
    inc_field: "exam",
    id : "examNums",
    start_seq: 1
})
module.exports = mongoose.model("Exam", ExamSchema)