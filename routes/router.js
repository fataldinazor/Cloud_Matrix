const express = require("express");
const router = express.Router();
const homepageController = require("../controllers/homepage.js");
const signupController = require("../controllers/signup.js");
const loginController = require("../controllers/login.js");
const usersController = require("../controllers/users.js");
const folderController = require("../controllers/folders.js");
const securityController = require("../controllers/security.js");

//paths where unauthenticated users can enter
router.get("/", homepageController);
router.get("/sign-up", signupController.signupGet);
router.post("/sign-up", signupController.signupPost);
router.get("/log-in", loginController.loginGet);
router.post("/log-in", loginController.loginPost);

// middleware to check if user is authenticated 
// otherwise lead them to sign-up page 
router.use(securityController.authenticateUser);

//paths where user authentication is required
router.get("/users", usersController.allUsers);
router.get("/users/:user_id", usersController.userGet);
router.get("/users/:user_id/:folder_id", folderController.getFolder);
router.get("/users/:user_id/:folder_id/:file_id/download", folderController.downloadFile);

// middleware used to authorize before any Create, Update, Delete operation
router.use("/users/:user_id", securityController.authorizeUser );

//posts where user authorization is needed
router.post("/users/:user_id/create-folder", usersController.userCreateFolderPost);
router.post("/users/:user_id/:folder_id/edit", usersController.editFolderPost);
router.post("/users/:user_id/:folder_id/delete", usersController.deleteFolderPost);
router.post("/users/:user_id/:folder_id/upload", folderController.uploadFilePost);
router.post("/users/:user_id/:folder_id/:file_id/delete", folderController.deleteFile);

//logout User
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/log-in");
  });
});
module.exports = router;
