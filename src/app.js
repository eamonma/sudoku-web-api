const { PythonShell } = require("python-shell")
const express = require("express")
const fs = require("fs")
const multer = require("multer")
const path = require("path")

const port = process.env.PORT || 3001
const app = express()

const socketio = require("socket.io")

const storage = multer.diskStorage({
    destination(req, file, cb) {
        console.log("Uploading...");
        
        cb(null, './uploads')
    },
    filename(req, file, cb) {
        filename = file.fieldname + '-' + Date.now() + ".jpg"
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

app.use("/sudoku/", express.static(path.join(__dirname, "../public")))

app.post("/sudoku/sudoku:solve", upload.single("image"), (req, res) => {
    let filePath
    if(!req.body.url) {
        try {
            filePath = req.file.path
        } catch(e) {
            return res.status(400).send({error: "Please upload a valid image."})
        }
    }
    
    var args = ["-f", "./" + filePath, "-s", "./public/solved"]


    let shell = new PythonShell("./python/main.py", { 
        mode: "text",
        args
    })

    shell.on("message", (message) => {

        if(message.substring(0, 6) === "Error:") {
            res.send({
                error: message
            })
            return console.log("Big error " + message);
        }

        if(message.substring(0, 6) === "Saved:") {
            res.send({
                url: message.substring(15, message.length)
            })

            setTimeout(() => {
                fs.unlink(path.join(__dirname, "." + message.substring(7, message.length)), (e) => {
                    if(e) {
                        console.log(e);
                    }
                })
            }, 60000)

            return console.log("Public URL:" + message.substring(15, message.length));
        }
    
        console.log(message);
    })
})



// PythonShell.run("./python/main.py", {
//     mode: "text",
//     args: ["--help"]
// }, (e, results) => {
//     console.log(e)
//     console.log(results);
// })

app.listen(port, () => {
    console.log("Server up on port " + port);
    
})