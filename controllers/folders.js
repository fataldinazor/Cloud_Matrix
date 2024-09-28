const prisma = require("./prisma");
const multer = require("multer");
const axios = require("axios");
const cloudinary = require("../cloudinaryConfig");
const streamifier = require("streamifier");

const storage = multer.memoryStorage();
let maxSize = 5 * 1024 * 1024;
const upload = multer({ storage, limits: { fileSize: maxSize } });

// // middleware to recoganise if the logged user 
// // owns the profile
// const isUserAuthorized = (req, res, next) => {
//   const profile_user_id = parseInt(req.params.user_id);
//   const logged_user_id = parseInt(req.session.passport.user);
//   if (profile_user_id === logged_user_id) next();
//   else res.status(403).send("Forbidden: Unauthorized access");
// };

//get all the files in a folder
//(checks user is folder owner or not to show private folders)
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

//upload file using multer and getting req.file object
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

//checking for file duplication
//if a file exists with the same name
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
    return res.status(400).send("File with the same name exists.");
  }
  next();
};

//uploading a file to cloudinary by giving a bufer stream
//streamfier is used to give buffer stream to cloudinary
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

//uploading the file to cloudinary and then
//the file credentials to prisma
const uploadFilePost = [
  // isUserAuthorized,
  dynamicUpload,
  checkDuplicateFilename,
  async (req, res) => {
    let { user_id, folder_id } = req.params;
    if (req.file) {
      try {
        //uploading to cloudinary
        const result = await uploadToCloudinary(req.file.buffer);
        console.log(req.file,result);
        //creating a transaction to create new file creadentials in prisma
        await prisma.$transaction(async (prisma) => {
          await prisma.file.create({
            data: {
              name: req.file.originalname,
              folderId: parseInt(folder_id),
              url: result.secure_url,
              size: req.file.size,
              public_id: result.public_id,
            },
          });
        });
        console.log(
          "File upload to Cloudinary and saved in the DB successfully"
        );
      } catch (err) {
        // if the transactions fails the file gets deleted from cloud as well
        if (result && result.public_id) {
          await cloudinary.uploader.destroy(result.public_id);
        }
        console.error("Error occurred:", err);
        return res.status(500).send("Error uploading file");
      }
    } else {
      return res.status(400).send("No File to Upload");
    }
    res.redirect(`/users/${user_id}/${folder_id}`);
  },
];

// deleting the file
const deleteFile = [
  // isUserAuthorized,
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
    await cloudinary.uploader.destroy(file.public_id);
    await prisma.file.delete({
      where: {
        id: parseInt(file_id),
      },
    });
    res.redirect(`/users/${user_id}/${folder_id}`);
  },
];

//downloading file 
const downloadFile = async (req, res) => {
  //getting the file credentials from database
  let { file_id } = req.params;
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(file_id),
    },
  });

  if (!file) {
    return res.status(404).send("File not Found");
  }

  // Dowloading file from cloudinary
  try {
    const response = await axios({
      url: file.url,
      method: "GET",
      responseType: "stream",
    });
    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    response.data.pipe(res);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error downloading file");
  }
};

module.exports = {
  deleteFile,
  getFolder,
  uploadFilePost,
  downloadFile,
  // isUserAuthorized,
};
