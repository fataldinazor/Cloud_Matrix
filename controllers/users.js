const prisma = require("./prisma");
const { body, validationResult } = require("express-validator");
const cloudinary = require("../cloudinaryConfig.js");

//using express-validator for folder duplication check
const uniqueFolderName = body("folderName").custom(async (value, { req }) => {
  try {
    const user_id = parseInt(req.params.user_id);
    const folderName = await prisma.folder.findUnique({
      where: {
        userId: user_id,
        name: value,
      },
    });
    if (folderName) {
      throw new Error("Folder name exists");
    }
    return true;
  } catch (error) {
    throw new Error(error.message || "Sever Error");
  }
});

// GETTING all users available on the site
const allUsers = async (req, res) => {
  const allUsers = await prisma.user.findMany();
  if (allUsers.length < 1) {
    res.redirect("sign-up");
  }
  res.render("allUsers", {
    allUsers: allUsers,
  });
};

// GETTING all the files asscoiated with a user
const userGet = async (req, res) => {
  const user_id = parseInt(req.params.user_id);
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });
    //getting all the folders associated with a user
    const allfolders = await prisma.folder.findMany({
      where: {
        userId: user_id,
      },
    });

    //getting all the public folders of the user
    const publicFolders = await prisma.folder.findMany({
      where: {
        userId: user_id,
        private: false,
      },
    });
    if (!user) {
      return res.status(404).send("User Not Found");
    }
    // if the folder belongs to logged user then
    //show all the folders
    //else only show the private folders
    if (user_id === req.session.passport.user) {
      res.render("user", {
        selected_user: user,
        folders: allfolders,
        errors: [],
      });
    } else {
      res.render("user", {
        selected_user: user,
        folders: publicFolders,
        errors: [],
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

// CREATING a new Folder for user
const userCreateFolderPost = [
  uniqueFolderName,
  async (req, res) => {
    const errors = validationResult(req);
    const user_id = parseInt(req.params.user_id);

    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });
    const folders = await prisma.folder.findMany({
      where: { userId: user_id },
    });

    if (!errors.isEmpty()) {
      return res.status(400).render("user", {
        selected_user: user,
        folders: folders,
        errors: errors.array(),
      });
    }
    let { folderName, visibility } = req.body;
    let private = visibility === "private" ? true : false;
    try {
      await prisma.folder.create({
        data: {
          name: folderName,
          userId: user_id,
          private: private,
        },
      });
    } catch (err) {
      // console.log(err);
      res.status(400).send("Server Error");
    }
    res.redirect(`/users/${user_id}`);
  },
];

//EDIT Folder name and visibility
const editFolderPost=[
  async(req, res)=>{
    const {user_id, folder_id} =req.params;
    let {folderName, visibility}= req.body;
    private= visibility==="private"?true:false;
    await prisma.folder.update({
      where:{
        id:parseInt(folder_id)
      },
      data:{
        name:folderName,
        private: private
      }
    })
    res.redirect(`/users/${user_id}`);
  }
]

// DELETE a folder and the files inside it.
const deleteFolderPost = [
  async (req, res) => {
    const { user_id, folder_id } = req.params;
    let files_in_folder=await prisma.file.findMany({
      where:{
        folderId:parseInt(folder_id)
      }
    })
    // deleting all the files associated with the folder 
    // from cloudinary 
    const deletePromises = files_in_folder.map((file)=>
      cloudinary.uploader.destroy(file.public_id)
    )

    await Promise.all(deletePromises);

    // deleting the folder from database
    // this will also delete associated files as 
    // files are cascaded to the folder
    await prisma.folder.delete({
      where: {
        id: parseInt(folder_id),
      },
    });
    res.redirect(`/users/${user_id}`);
  },
];

module.exports = {
  allUsers,
  userGet,
  userCreateFolderPost,
  editFolderPost,
  deleteFolderPost,
};
