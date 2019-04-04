const { PythonShell } = require("python-shell")
const express = require("express")
const fs = require("fs")
const multer = require("multer")
const sharp = require("sharp")
const path = require("path")

const port = process.env.PORT || 3001
const app = express()

const socketio = require("socket.io")

let filename;

// const storage = multer.diskStorage({
//     destination(req, file, cb) {
//         console.log("Uploading...");
        
//         cb(null, './uploads')
//     },
//     filename(req, file, cb) {
//         const ext = file.mimetype.split("/")[1];
//         filename = file.fieldname + '-' + Date.now() + "." + ((ext === "jpeg") ? ("jpg") : (ext))
//         console.log(filename);
        
//         cb(null, filename)
//     }
// })
  
const upload = multer({
    limits: {
        fileSize: 20000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
            return cb("Error: Upload an image!", false)
        }
        
        cb(undefined, true)
    }
})

app.use("/sudoku/", express.static(path.join(__dirname, "../public")))

app.post("/sudoku/sudoku:solve", upload.single("image"), async (req, res) => {
    let filePath
    if(!req.body.url) {
        try {
            filePath = req.file.path
        } catch(e) {
            return res.status(400).send({Error: "Please upload a valid image."})
        }
    }

    const buffer = await sharp(req.file.buffer)
        .jpeg()
        .toBuffer();
    
    filename = req.file.fieldname + '-' + Date.now() + ".jpg"
    absFilePath = (path.join(__dirname, "../uploads/") + filename);
    filePath = "./uploads/" + filename
    fs.writeFile(absFilePath, buffer, (e) => {
        if(e) {
            console.log(e); 
        }
        console.log(filePath);
        
    })
    
    let args = ["-f", "./" + filePath, "-s", "./public/solved", "-c", "192,57,43"]

    try {
        let shell = new PythonShell("./python/main.py", { 
            mode: "text",
            args
        })

        shell.on("message", (message) => {

            if(message.substring(0, 6) === "Error:") {
                res.send({
                    error: message.substring(6, message.length)
                })
                console.log("Big error " + message);
            }
    
            if(message.substring(0, 6) === "Saved:") {
                res.send({
                    url: "/sudoku" + message.substring(15, message.length)
                })
    
                setTimeout(() => {
                    fs.unlink(path.join(__dirname, "." + message.substring(7, message.length)), (e) => {
                        if(e) {
                            console.log(e);
                        }
                        console.log("Deleted: " + path.join(__dirname, "." + message.substring(7, message.length)));
                        
                    })
                }, 30000)
    
                console.log("Public URL:" + message.substring(15, message.length));
            }
            console.log(message);
        })
    } catch(e) {
        res.send({
            error: message
        })
    }

    setTimeout(() => {
        fs.unlink(path.join(__dirname, "../uploads/" + filename), (e) => {
        if(e) {
            console.log(e);
        }
        console.log("Deleted: " + path.join(__dirname, "../uploads/" + filename));
        
        })
    }, 360000)
})

app.listen(port, () => {
    console.log("Server up on port " + port);
    
})