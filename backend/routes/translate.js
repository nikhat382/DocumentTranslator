const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { performTranslation } = require('../services/openaiService');

// POST /api/translate - Main translation endpoint
router.post('/translate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const targetLanguage = req.body.targetLanguage || 'English';
    
    console.log(`📄 Processing file: ${req.file.originalname}`);
    console.log(`🌐 Target language: ${targetLanguage}`);
    
    const result = await performTranslation(req.file, targetLanguage);
    
    console.log(`✅ Translation completed successfully`);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Translation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;