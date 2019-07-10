const express = require("express");
const router = express.Router()

//@route Get api/users
//@desc Test Route
//@access Public
router.get("/", (req,res) => res.send("profile Route"))

module.exports = router