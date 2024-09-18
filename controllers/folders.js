const prisma = require("./prisma");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "../public/uploads"));
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

const getFolder = async (req, res) => {
  let { user_id, folder_id } = req.params;
  const folder = await prisma.folder.findUnique({
    where: { id: parseInt(folder_id) },
  });
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

const UploadFilePost = [
  dynamicUpload,
  async (req, res) => {
    let { user_id, folder_id } = req.params;

    if (req.file) {
      await prisma.file.create({
        data: {
          name: req.file.originalname,
          folderId: parseInt(folder_id),
          url: req.file.path,
        },
      });
    }
    res.redirect(`/users/${user_id}/${folder_id}`);
  },
];

const downloadFile = async (req, res) => {
  let { user_id, folder_id, file_id } = req.params;
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(file_id),
    },
  });
  res.download(file.url);
};

module.exports = {
  getFolder,
  UploadFilePost,
  downloadFile,
};
