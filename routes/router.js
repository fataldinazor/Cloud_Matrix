const express = require("express");
const router = express.Router();
const homepageController = require("../controllers/homepage.js");
const signupController = require("../controllers/signup.js");
const loginController = require("../controllers/login.js");
const usersController = require("../controllers/users.js");

router.get("/", homepageController);

//sign-up User  
router.get("/sign-up", signupController.signupGet);
router.post("/sign-up", signupController.signupPost);

//log-in User 
router.get("/log-in", loginController.loginGet);
router.post("/log-in", signupController.loginPost);

//users
// router.get("users", usersController.allUsers);
// router.get("users/:user_id", usersController.getUser);


//logout User
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
  });
  res.redirect("/");
});
module.exports = router;
