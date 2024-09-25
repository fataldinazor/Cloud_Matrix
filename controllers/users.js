const prisma = require("./prisma");
const { body, validationResult } = require("express-validator");
const { isUserAuthorized } = require("./folders");
const { unlink } = require("node:fs");

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
    console.log(error);
    throw new Error(error.message || "Sever Error");
  }
});

const allUsers = async (req, res) => {
  const allUsers = await prisma.user.findMany();
  if (allUsers.length < 1) {
    res.redirect("sign-up");
  }
  res.render("allUsers", {
    allUsers: allUsers,
  });
};

const userGet = async (req, res) => {
  const user_id = parseInt(req.params.user_id);
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });
    const allfolders = await prisma.folder.findMany({
      where: {
        userId: user_id,
      },
    });
    const publicFolders = await prisma.folder.findMany({
      where: {
        userId: user_id,
        private: false,
      },
    });
    if (!user) {
      return res.status(404).send("User Not Found");
    }
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

const userCreateFolderPost = [
  uniqueFolderName,
  isUserAuthorized,
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
        user: user,
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
      console.log(err);
      res.status(400).send("Server Error");
    }
    res.redirect(`/users/${user_id}`);
  },
];

const editFolderPost=[
  isUserAuthorized,
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

const deleteFolderPost = [
  isUserAuthorized,
  async (req, res) => {
    const { user_id, folder_id } = req.params;
    let files_in_folder=await prisma.file.findMany({
      where:{
        folderId:parseInt(folder_id)
      }
    })

    files_in_folder.forEach(file=>{
      unlink(file.url, () => {
        console.log("File was deleted from the Disk Storage");
      });
    })
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
