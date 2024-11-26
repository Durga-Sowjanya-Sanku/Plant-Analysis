require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdfkit = require('pdfkit');
const fs = require('fs');

const {GoogleGenerativeAI} = require('@google/generative-ai');

const fsPromises = fs.promises;
const path = require('path');

const PORT = 4040;
const app = express();


const upload = multer({dest: 'upload/'});
app.use(express.json({limit: "10mb"}));

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
app.use(express.static('public'));

app.post('/analyze', upload.single('image'), async (request, response) => {
    try {
        // Check if the file exists
        if (!request.file) {
            return response.status(400).json({
                message: "File upload failed",
            });
        }

        // Read the uploaded image file as base64
        const imagePath = request.file.path;
        const imageData = await fsPromises.readFile(imagePath, {
            encoding: "base64",
        });

        // Load the generative AI model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Analyze this plant and give some detailed information";

        // Use the model to analyze the uploaded image
        const result = await model.generateContent([prompt, {
            inlineData: {
                mimeType: request.file.mimetype, 
                data: imageData,
            },
        }]);

        const text = await result.response.text();
        console.log(text);
        
        await fsPromises.unlink(imagePath);
        response.json({ 
            results: text,
            image: `data:${request.file.mimetype};base64,${imageData}`
        });

    } catch (err) {
    
        response.status(500).json({
            message: "Failed",
            error: err.message, 
        });
    }
});


app.listen(PORT, () =>{
    console.log('Listening on port 3000');
});

