const { PythonShell } = require("python-shell")
const express = require("express")
const fs = require("fs")
const multer = require("multer")
const path = require("path")

const port = process.env.PORT || 3001
const app = express()

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, './uploads')
    },
    filename(req, file, cb) {
        filename = file.fieldname + '-' + Date.now()
        cb(null, filename)
    }
  })
  
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb("Upload an image!", false)
        }
        
        cb(undefined, true)
    }
})

app.use(express.static(path.join(__dirname, "../public")))

app.post("/sudoku:solve", upload.single("image"), (req, res) => {
    let filePath
    if(!req.body.url) {
        try {
            filePath = req.file.path
        } catch(e) {
            return res.status(400).send({image: "Please upload a valid image."})
        }
    }
    
    var args = ["-f", "./" + filePath, "-j", "./JSONimages"]
})

let shell = new PythonShell("./python/main.py", { 
    mode: "text",
    // args: ["-w"]
    args: ["-f", "./img/c1.jpg", "-s"]
 })

shell.on("message", (message) => {
    console.log(message);
})

// PythonShell.run("./python/main.py", {
//     mode: "text",
//     args: ["--help"]
// }, (e, results) => {
//     console.log(e)
//     console.log(results);
// })