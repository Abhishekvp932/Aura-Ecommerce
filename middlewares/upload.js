const multer = require('multer');
const path=require('path')
const filepath=path.join(__dirname, '../public/uploads')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filepath) 
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });
module.exports = upload;