const OpenAI = require('openai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Extract text from different file types
async function extractText(file) {
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  
  try {
    if (fileExtension === 'txt') {
      return file.buffer.toString('utf-8');
    } else if (fileExtension === 'pdf') {
      const data = await pdf(file.buffer);
      return data.text;
    } else if (fileExtension === 'docx') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }
    throw new Error('Unsupported file type');
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

// Translate text using OpenAI
async function translateText(text, targetLanguage = 'English') {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the original meaning, tone, and structure. Only provide the translation without any explanations or additional text.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    throw new Error(`Translation failed: ${error.message}`);
  }
}

// Split text into sentences for segment analysis
function splitIntoSentences(text) {
  return text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
}

// Calculate metadata
function calculateMetadata(text) {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const sentences = splitIntoSentences(text);
  
  return {
    wordCount: words.length,
    characterCount: text.length,
    sentenceCount: sentences.length
  };
}

// Generate segments with mock confidence scores
async function generateSegments(originalText, translatedText) {
  const originalSentences = splitIntoSentences(originalText);
  const translatedSentences = splitIntoSentences(translatedText);
  
  const segments = [];
  const maxLength = Math.min(originalSentences.length, translatedSentences.length);
  
  for (let i = 0; i < maxLength; i++) {
    const originalSentence = originalSentences[i].trim();
    const translatedSentence = translatedSentences[i].trim();
    const tokens = originalSentence.split(/\s+/).length;
    
    segments.push({
      id: i + 1,
      spanish: originalSentence,
      english: translatedSentence,
      confidence: 0.96 + Math.random() * 0.04, // Random between 0.96-1.0
      tokens: tokens,
      processingTime: (tokens * 0.01 + Math.random() * 0.05).toFixed(2)
    });
  }
  
  return segments;
}

// Main translation service
async function performTranslation(file, targetLanguage = 'English') {
  const startTime = Date.now();
  
  try {
    // Extract text
    const originalText = await extractText(file);
    
    if (!originalText || originalText.trim().length === 0) {
      throw new Error('No text found in the document');
    }
    
    // Translate
    const translatedText = await translateText(originalText, targetLanguage);
    
    // Calculate metadata
    const originalMetadata = calculateMetadata(originalText);
    const endTime = Date.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);
    
    // Generate segments
    const segments = await generateSegments(originalText, translatedText);
    
    // Calculate KPIs
    const avgConfidence = segments.reduce((sum, seg) => sum + seg.confidence, 0) / segments.length;
    const totalTokens = segments.reduce((sum, seg) => sum + seg.tokens, 0);
    const throughput = Math.round(originalMetadata.wordCount / processingTime);
    
    return {
      originalText,
      translatedText,
      segments,
      kpis: {
        accuracy: (avgConfidence * 100).toFixed(1),
        latency: processingTime,
        throughput: throughput,
        wer: (Math.random() * 2 + 0.5).toFixed(1), // Mock WER between 0.5-2.5%
        bleuScore: (92 + Math.random() * 6).toFixed(1), // Mock BLEU 92-98%
        semanticSimilarity: (95 + Math.random() * 4).toFixed(1) // Mock similarity 95-99%
      },
      metadata: {
        fileName: file.originalname,
        fileSize: (file.size / 1024).toFixed(2),
        wordCount: originalMetadata.wordCount,
        characterCount: originalMetadata.characterCount,
        sentenceCount: originalMetadata.sentenceCount,
        processedAt: new Date().toLocaleString(),
        model: 'GPT-3.5-turbo',
        language: `Auto-detected → ${targetLanguage}`
      }
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  performTranslation,
  extractText,
  translateText
};