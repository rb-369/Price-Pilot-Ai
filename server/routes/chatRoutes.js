const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { protect } = require('../middleware/auth');
const {
    getChats,
    getChat,
    createChat,
    deleteChat,
    sendMessage
} = require('../controllers/chatController');

// Multer setup for in-memory file handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', protect, getChats);
router.post('/', protect, createChat);
router.get('/:id', protect, getChat);
router.delete('/:id', protect, deleteChat);
router.post('/:id/message', protect, sendMessage);

// PDF Upload & Parse route
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf');
        let extractedText = '';

        if (isPdf) {
            const data = await pdfParse(req.file.buffer);
            extractedText = data.text;
        } else {
            // Fallback for simple text/csv files
            extractedText = req.file.buffer.toString('utf-8');
        }

        // Limit the text size to avoid blowing up the LLM context limit
        if (extractedText.length > 15000) {
            extractedText = extractedText.substring(0, 15000) + '... [Truncated due to size]';
        }

        res.json({ text: extractedText });
    } catch (error) {
        console.error('File parsing error:', error);
        res.status(500).json({ message: 'Failed to parse file', error: error.message });
    }
});

module.exports = router;
