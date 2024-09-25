const prisma = require("./prisma");
const { unlink } = require("node:fs");
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e3)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});
let maxSize = 5 * 1024 * 1024;
const upload = multer({ storage: storage, limits: { fileSize: maxSize } });

const isUserAuthorized = (req, res, next) => {
  const profile_user_id = parseInt(req.params.user_id);
  const logged_user_id = parseInt(req.session.passport.user);
  if (profile_user_id === logged_user_id) next();
  else res.status(403).send("Forbidden: Unauthorized access");
};

const getFolder = async (req, res) => {
  let { user_id, folder_id } = req.params;
  const folder = await prisma.folder.findUnique({
    where: { id: parseInt(folder_id) },
  });
  if (folder.private === true && req.user.id !== parseInt(user_id)) {
    res.redirect(`/users/${user_id}`);
  }
  const files = await prisma.file.findMany({
    where: {
      folderId: parseInt(folder_id),
    },
  });
  res.render("folder", {
    files: files,
    folder: folder,
  });
};

const dynamicUpload = (req, res, next) => {
  const uploadFile = upload.single(`user${req.params.user_id}File`);
  uploadFile(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.log(err);
    } else if (err) {
      console.log(err);
    }
    next();
  });
};

checkDuplicateFilename = async (req, res, next) => {
  const orginalFileName = req.file.originalname;
  const folder_id = parseInt(req.params.folder_id);
  const file = await prisma.file.findFirst({
    where: {
      folderId: folder_id,
      name: orginalFileName,
    },
  });
  if (file) {
    unlink(req.file.path, (err) => {
      if (err) throw err;
      console.log("file was removed due to duplication");
    });
    return res.status(400).send({ message: "File with the same name exists." });
  }
  next();
};

const uploadFilePost = [
  dynamicUpload,
  checkDuplicateFilename,
  async (req, res) => {
    let { user_id, folder_id } = req.params;
    console.log(user_id, req.session.passport.user);
    if (req.session.passport.user !== parseInt(user_id)) {
      return res
        .status(400)
        .send(`The user is not authorized to upload files here`);
    }
    if (req.file) {
      await prisma.file.create({
        data: {
          name: req.file.originalname,
          folderId: parseInt(folder_id),
          url: req.file.path,
          size: req.file.size,
        },
      });
    }
    res.redirect(`/users/${user_id}/${folder_id}`);
  },
];

const deleteFile = [isUserAuthorized, async (req, res) => {
  const { user_id, folder_id, file_id } = req.params;
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(file_id),
    },
  });
  if(!file){
    return res.status(404).send("File not found");
  }
  unlink(file.url, () => {
    console.log("file was removed form the uploads folder");
  });
  await prisma.file.delete({
    where: {
      id: parseInt(file_id),
    },
  });
  res.redirect(`/users/${user_id}/${folder_id}`);
}];

const downloadFile = async (req, res) => {
  let { file_id } = req.params;
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(file_id),
    },
  });
  res.download(file.url);
};

module.exports = {
  deleteFile,
  getFolder,
  uploadFilePost,
  downloadFile,
  isUserAuthorized
};
