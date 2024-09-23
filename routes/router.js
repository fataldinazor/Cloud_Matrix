const express = require("express");
const router = express.Router();
const homepageController = require("../controllers/homepage.js");
const signupController = require("../controllers/signup.js");
const loginController = require("../controllers/login.js");
const usersController = require("../controllers/users.js");
const folderController = require("../controllers/folders.js");

router.get("/", homepageController);

//sign-up User  
router.get("/sign-up", signupController.signupGet);
router.post("/sign-up", signupController.signupPost);

//log-in User 
router.get("/log-in", loginController.loginGet);
router.post("/log-in", loginController.loginPost);

//users
router.get("/users", usersController.allUsers);
router.get("/users/:user_id", usersController.userGet);
router.post("/users/:user_id/create-folder", usersController.userCreateFolderPost)

//folder
router.get("/users/:user_id/:folder_id", folderController.getFolder)
router.post("/users/:user_id/:folder_id/upload", folderController.uploadFilePost);
router.get("/users/:user_id/:folder_id/:file_id/download", folderController.downloadFile);
router.post("/users/:user_id/:folder_id/:file_id/delete", folderController.deleteFile);

//logout User
module.exports = router;
