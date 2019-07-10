//initiate express
const express = require('express');
const app = express();
const chalk = require("chalk")
//initiate mongodb
const connectDB = require("../config/db")();

//initiate middleware
//values can only be strings or arrays when set to false
app.use(express.json({ extended: false }));

//api routes
app.use("/api/auth", require("./routes/api/auth"))
app.use("/api/users", require("./routes/api/users"))

app.use("/api/equipmentPosts", require("./routes/api/equipmentPosts"))
app.use("/api/profile", require("./routes/api/profile"))
app.use("/api/trailPosts", require("./routes/api/trailPosts"))

// app.use("/", (req, res) => {
//     res.send("Hey rich, its Maddie. How have you been!?")
// })

const PORT = process.env.PORT || 5000;

app.listen(PORT, (err) => {
    if (err) {
        console.log(err)
    }
    console.log(chalk.bgGreen.black("Server is running on port: " + PORT))
})