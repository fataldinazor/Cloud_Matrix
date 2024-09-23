const prisma = require("./prisma");
const { body, validationResult } = require("express-validator");

const uniqueFolderName = body("folderName").custom(async (value, {req}) => {
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
    return true
  } catch (error) {
    console.log(error);
    throw new Error(error.message || "Sever Error")
  }
});

const allUsers = async (req, res) => {
  const allUsers = await prisma.user.findMany();
  if(allUsers.length<1){
    res.redirect('sign-up');
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
      where:{
        userId:user_id,
        private:false
      }
    })
    if (!user) {
      return res.status(404).send("User Not Found");
    }
    if(user_id===req.session.passport.user){
      res.render("user", {
        selected_user: user,
        folders: allfolders,
        errors: [],
      });
    }else{
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
  async (req, res) => {
    if(req.user.id!==parseInt(req.params.user_id)){
      return res.status(400).send("You are not authorized to make this folder")
    }
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
    let { folderName, private } = req.body;
    private = private[1] === "true"? true : false;
    console.log(folderName, private, user_id);
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

module.exports = {
  allUsers,
  userGet,
  userCreateFolderPost,
};
