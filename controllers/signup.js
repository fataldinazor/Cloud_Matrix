const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const prisma = require("./prisma");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

// using local strategy to verify user after signup for auto login
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });
      if (!user) {
        return done(null, false, { message: "Incorrect Username" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Incorrect Password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// serailze user 
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// deserialize user 
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// get the sign up form 
const signupGet = (req, res) => {
  if (req.user) {
    res.redirect(`users/${req.user.id}`);
  } else {
    res.render("signup", {
      errors: [],
    });
  }
};

//validate form data
const alphaErr = "must only contain letters";
const lengthErr = "must be between 1 and 15 characters";

const validateUser = [
  body("fname")
    .trim()
    .isAlpha()
    .withMessage(`First Name ${alphaErr}`)
    .isLength({ min: 1, max: 15 })
    .withMessage(`Last Name ${lengthErr}`),
  body("lname")
    .trim()
    .isAlpha()
    .withMessage(`Last Name ${alphaErr}`)
    .isLength({ min: 1, max: 15 })
    .withMessage(`Last Name ${lengthErr}`),
  body("username")
    .isLength({ min: 1, max: 15 })
    .withMessage(`Username ${lengthErr}`),
  body("password")
    .exists()
    .withMessage(`Please enter the password`)
    .bail()
    .isLength({ min: 4 })
    .withMessage(`Password must be at least 4 characters long.`),
  body("confirmPassword").exists().withMessage(`Confirm your Password`),
];

//check username doesn't exist in database
const usernameMatch = body("username").custom(async (value) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: value,
      },
    });
    if (user) {
      throw new Error("Username already exist");
    }
    return true;
  } catch (err) {
    throw new Error(err.message || "An error occurred during validation");
  }
});

// check password and confirm password match
const passwordsMatch = body("password").custom((value, { req }) => {
  if (value !== req.body.confirmPassword) {
    throw new Error("The passwords dont match");
  }
  return true;
});

// POST sign up function 
const signupPost = [
  validateUser,
  usernameMatch,
  passwordsMatch,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("signup", {
        errors: errors.array(),
      });
    }
    const { fname, lname, username, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          fname: fname,
          lname: lname,
          username: username,
          password: hashedPassword,
        },
      });

      // auto login after user sign-up
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.redirect("/log-in");
      });
    } catch (err) {
      res.status(500).render("signup", {
        errors: [{ msg: err.message }],
      });
    }
  },
];

module.exports = {
  signupGet,
  signupPost,
};
