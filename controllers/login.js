const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const prisma = require("./prisma");

passport.use(
  LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });
      if (!user) {
        return done(null, false, { message: `Incorrect Username` });
      }
      const isMatch = bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: `Incorrect Password` });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

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

// get login form
const loginGet = (req, res) => {
  if (req.user) {
    redirect(`/users/${req.user.id}`);
  } else {
    res.render("login", {
      errors: [],
    });
  }
};

// POST login form and authenticate user
const loginPost = (req, res) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/log-in",
  })(req, res, next);
};

module.exports = {
  loginGet,
  loginPost,
};
