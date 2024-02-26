require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const { logger, logEvents } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 8080;

connectDB();

//log eventi server
app.use(logger);

//gestione cors
app.use(cors(corsOptions));

//parse json body
app.use(express.json());

//parse dei cookies
app.use(cookieParser());

//serve public files as css
app.use("/", express.static(path.join(__dirname, "public")));

//route for splashpage of my API
app.use("/", require("./routes/root"));

app.use("/auth", require("./routes/authRoutes"))

app.use("/admin", require("./routes/adminRoutes"))

app.use("/doctor", require("./routes/doctorRoutes"))

app.use("/patient", require("./routes/patientRoutes"))

app.use("/utility", require("./routes/utilityRoutes"))



//gestione delle rotte non contemplate nell'API
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html"))
    res.sendFile(path.join(__dirname, "views", "404.html"));
  else if (req.accepts("json")) res.json({ message: "404 Not Found" });
  else res.type("text").send("404 Not Found");
});

//log degli errori
app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("connesso");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
