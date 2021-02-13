const express = require('express');
const app = express();
const fs = require('fs');
const multer = require('multer');
const { createWorker} = require('tesseract.js');

const worker = createWorker({
    logger:m => console.log(m)

});

const storage = multer.diskStorage({
    destination: (req,file, cd) =>{
        cd(null, './uploads')
    },
    filename: (req,file, cd) =>{
        cd(null, file.originalname)
    }
});


const upload = multer({storage}).single('avatar');

app.set("view engine","ejs")

app.get('/',(req,res)=>res.render('index'))

app.post('/upload',(req,res)=>{

    upload(req,res,err=>{
        console.log(req)
        fs.readFile(`./uploads/${req.file.originalname}`, (err,data)=>{
            if(err) return console.error(err);

            (async()=>{
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');

                const{ data: {text}} = await worker.recognize(data);
                console.log(text);

                const{data : pdfData}  = await worker.getPDF('Tesseract OCR result');
                fs.writeFileSync(`${req.file.originalname}.pdf`, Buffer.from(pdfData));
                console.log(`Generate PDF: ${req.file.originalname}.pdf`);

                res.send(text)
                await worker.terminate();
                
            })();
        })

    })
})

const PORT = 5000
app.listen(PORT, ()=> console.log("Running"))

