const express = require('express');
const router = express.Router();
const multer = require('multer');

// Polyfill DOMMatrix for pdfjs-dist/pdf-parse in Node.js environments
if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = class DOMMatrix {
        constructor() {
            this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
            this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
            this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
            this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
            this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
            this.is2D = true; this.isIdentity = true;
        }
    };
    global.DOMMatrix = globalThis.DOMMatrix;
}

const { protect } = require('../middleware/auth');
const {
    getChats,
    getChat,
    createChat,
    deleteChat,
    sendMessage,
    submitFeedback,
    editMessage
} = require('../controllers/chatController');

// Multer setup for in-memory file handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', protect, getChats);
router.post('/', protect, createChat);
router.get('/:id', protect, getChat);
router.delete('/:id', protect, deleteChat);
router.post('/:id/message', protect, sendMessage);
router.post('/:id/messages/:messageIndex/feedback', protect, submitFeedback);
router.put('/:id/messages/:messageIndex', protect, editMessage);

// PDF Upload & Parse route
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf');
        let extractedText = '';

        if (isPdf) {
            const pdfParse = require('pdf-parse');
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
