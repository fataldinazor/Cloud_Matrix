const prisma = require("./prisma");
const { unlink } = require("node:fs");
const multer = require("multer");
// const path = require("path");
const cloudinary = require("../cloudinaryConfig");
const streamifier = require("streamifier");

const storage = multer.memoryStorage();
let maxSize = 5 * 1024 * 1024;
const upload = multer({ storage, limits: { fileSize: maxSize } });

const isUserAuthorized = (req, res, next) => {
  const profile_user_id = parseInt(req.params.user_id);
  const logged_user_id = parseInt(req.session.passport.user);
  if (profile_user_id === logged_user_id) next();
  else res.status(403).send("Forbidden: Unauthorized access");
};

//get all the files in a folder
//  (checks user is folder owner or not to show private folders)
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

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream(
      { folder: "fileUploaderApp", resource_type: "auto" },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

const uploadFilePost = [
  isUserAuthorized,
  dynamicUpload,
  checkDuplicateFilename,
  async (req, res) => {
    let { user_id, folder_id } = req.params;
    console.log(req.file);
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        await prisma.file.create({
          data: {
            name: req.file.originalname,
            folderId: parseInt(folder_id),
            url: result.secure_url,
            size: req.file.size,
          },
        });
      } catch (err) {
        console.log(err);
        return res.status(500).send("Error Uploading file to Cloudinary");
      }
    } else {
      return res.status(400).send("No File to Upload");
    }
    res.redirect(`/users/${user_id}/${folder_id}`);
  },
];

const deleteFile = [
  isUserAuthorized,
  async (req, res) => {
    const { user_id, folder_id, file_id } = req.params;
    const file = await prisma.file.findUnique({
      where: {
        id: parseInt(file_id),
      },
    });
    if (!file) {
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
  },
];

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
  isUserAuthorized,
};
