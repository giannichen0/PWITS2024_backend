const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose)

const ReportSchema = new mongoose.Schema(
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
    },
    {
        timestamps : true
    }
)

ReportSchema.plugin(AutoIncrement,{
    inc_field: "report",
    id : "reportNums",
    start_seq : 1
})
module.exports = mongoose.model("Report", ReportSchema)