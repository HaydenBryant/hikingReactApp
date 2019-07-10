const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator")
const User = require("../../models/User")
const bcrypt = require("bcryptjs")

//@route Post api/users
//@desc register user
//@access Public
router.post(
    "/",
    [
        check("name", "name is required")
            .not()
            .isEmpty(),

        check('email', 'Please include a valid email').isEmail(),

        check(
            'password',
            'please enter a password with 6 or more characters'
            ).isLength({ min: 6 }),

        check('password2').custom((value, {req}) => {
                if (value !== req.body.password) {
                    throw new Error('Confirmation password must match the password field')
                } else {
                    return true
                }
            })
    ],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password} = req.body;

    try{
        let user = await User.findOne({ email });

        if (user) {
            res.status(400)
              .json({ errors: [{ msg: 'User already exists' }] });
          }

          user = new User ({
            name,
            email,
            password
          });

          const salt = await bcrypt.genSalt(10);

          user.password = await bcrypt.hash(password, salt);

          await user.save();

          res.send("user register")


        //see if user exists


        //encrypt password

        //return json webtoken

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }



    res.send("User Route")
})

module.exports = router
