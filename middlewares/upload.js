const multer = require('multer');
const path=require('path')

const filepath=path.join(__dirname, '../public/uploads')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filepath) // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// In your routes file:
module.exports = upload;