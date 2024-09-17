const prisma = require("./prisma");
const fs= require("fs");
const multer =require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e3)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

const getFolder=async (req, res)=>{
    let {user_id, folder_id}= req.params;
    folder_id=parseInt(folder_id);
    const folder = await prisma.folder.findUnique({
        where:{id:folder_id}
    })
    const files= await prisma.file.findMany({
        where:{
            id:folder_id
        }
    })
    res.render('folder',{
        files: files,
        folder:folder
    })
}

const dynamicUpload= (req, res, next) => {
    upload.array(`user${req.params.user_id}File`)(req, res, next);
}

const UploadFilePost=[dynamicUpload,(req, res)=>{
    let { user_id, folder_id } = req.params;
    console.log(req.files);
    res.redirect(`/users/${user_id}/${folder_id}`);
}]

module.exports = {
  getFolder,
  UploadFilePost,
};