const express = require("express");
const router = express.Router()
const auth = require("../../middleware/auth")
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcryptjs");

const User = require('../../models/User');

//@route Get api/users
//@desc Test Route
//@access Public
router.get("/", auth, async (req,res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route Post api/users
//@desc authenticate user & get token
//@access Public
router.post(
    "/",
    [  
      check("email", "Please include a valid email").isEmail(),
  
      check(
        "password",
        "password is required"
      ).exists(),
  
      check("password2").custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Confirmation password must match the password field");
        } else {
          return true;
        }
      })
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { email, password } = req.body;
  
      try {
        let user = await User.findOne({ email });
  
        if (!user) {
          res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(isMatch){
            res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
        }
  
        const payload = {
          user: {
            id: user.id
          }
        };
  
        jwt.sign(
          payload,
          config.get("jwtSecret"),
          { expiresIn: 5000 },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        );
      } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
      }
    }
  );

module.exports = router