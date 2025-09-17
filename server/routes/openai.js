// OpenAI API routes for AI Reverse-Invention Generator
import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs/promises';

// Simple rate limiting without external dependency
const rateLimits = new Map();

function simpleRateLimit(maxRequests, windowMs) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!rateLimits.has(key)) {
      rateLimits.set(key, []);
    }
    
    const requests = rateLimits.get(key);
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: windowMs
      });
    }
    
    validRequests.push(now);
    rateLimits.set(key, validRequests);
    next();
  };
}

import { callGPT, generateImage, transcribeAudio, moderateContent } from '../utils/openaiClient.js';
import { 
  DECONSTRUCTION_SYSTEM, 
  getDeconstructionPrompt,
  SIMULATION_SYSTEM,
  getSimulationPrompt,
  getVisualPrompt,
  NARRATIVE_SYSTEM,
  getNarrativePrompt,
  checkModerationKeywords
} from '../utils/prompts.js';
import {
  getCachedDeconstruction,
  setCachedDeconstruction,
  getCachedSimulation,
  setCachedSimulation,
  getCachedImage,
  setCachedImage,
  getCachedTranscription,
  setCachedTranscription,
  getCacheStats
} from '../utils/cache.js';
import { createPPTX, prepareSectionsForExport, generateExportFilename } from '../utils/exports.js';

const router = express.Router();

// Configure multer for audio uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /audio\/(wav|mp3|m4a|ogg|webm)/;
    if (allowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Rate limiters
const deconstructLimiter = simpleRateLimit(10, 300000); // 10 requests per 5 minutes
const simulateLimiter = simpleRateLimit(5, 300000);     // 5 requests per 5 minutes  
const imageLimiter = simpleRateLimit(3, 300000);        // 3 requests per 5 minutes

// Middleware for input validation and moderation
async function validateAndModerateInput(req, res, next) {
  const { invention, era } = req.body;
  
  if (!invention || invention.trim().length === 0) {
    return res.status(400).json({ error: 'Invention name is required' });
  }

  if (invention.length > 100) {
    return res.status(400).json({ error: 'Invention name too long (max 100 characters)' });
  }

  // Basic keyword moderation
  if (checkModerationKeywords(invention)) {
    return res.status(400).json({ error: 'Invalid invention topic' });
  }

  // OpenAI moderation check
  try {
    const moderation = await moderateContent(invention);
    if (moderation.flagged) {
      return res.status(400).json({ error: 'Content flagged by moderation system' });
    }
  } catch (error) {
    console.warn('Moderation check failed, proceeding:', error.message);
  }

  req.sanitizedInput = {
    invention: invention.trim(),
    era: era ? era.trim() : "1800s"
  };

  next();
}

// POST /api/deconstruct - Deconstruct invention into components
router.post('/deconstruct', validateAndModerateInput, deconstructLimiter, async (req, res) => {
  try {

    const { invention } = req.sanitizedInput;

    // Check cache first
    const cached = getCachedDeconstruction(invention);
    if (cached) {
      return res.json({ decomposition: cached, cached: true });
    }

    console.log(`Deconstructing invention: ${invention}`);

    const prompt = getDeconstructionPrompt(invention);
    const response = await callGPT(DECONSTRUCTION_SYSTEM, prompt, 0.2, 1500);

    let decomposition;
    try {
      decomposition = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    // Cache the result
    setCachedDeconstruction(invention, decomposition);

    res.json({ decomposition, cached: false });

  } catch (error) {
    console.error('Deconstruction error:', error);
    res.status(500).json({ error: 'Failed to deconstruct invention' });
  }
});

// POST /api/simulate - Generate alternate timeline simulations
router.post('/simulate', validateAndModerateInput, simulateLimiter, async (req, res) => {
  try {

    const { invention, era } = req.sanitizedInput;
    const { depth = 3, creativity = 0.7, decomposition } = req.body;

    // Validate parameters
    const validatedCreativity = Math.max(0, Math.min(1, creativity));
    const validatedDepth = Math.max(1, Math.min(5, depth));

    // Check cache first
    const cached = getCachedSimulation(invention, era, validatedCreativity);
    if (cached) {
      return res.json({ simulations: cached, cached: true });
    }

    console.log(`Simulating ${invention} in ${era} (creativity: ${validatedCreativity})`);

    let deconstructionData = decomposition;
    
    // Get decomposition if not provided
    if (!deconstructionData) {
      const cachedDecomposition = getCachedDeconstruction(invention);
      if (cachedDecomposition) {
        deconstructionData = cachedDecomposition;
      } else {
        // Generate decomposition on-demand
        const decompPrompt = getDeconstructionPrompt(invention);
        const decompResponse = await callGPT(DECONSTRUCTION_SYSTEM, decompPrompt, 0.2, 1500);
        try {
          deconstructionData = JSON.parse(decompResponse);
          setCachedDeconstruction(invention, deconstructionData);
        } catch (error) {
          console.error('Failed to generate decomposition for simulation:', error);
          return res.status(500).json({ error: 'Failed to analyze invention' });
        }
      }
    }

    // Generate simulations
    const simulationPrompt = getSimulationPrompt(invention, era, deconstructionData, validatedCreativity);
    const temperature = 0.7 + (validatedCreativity * 0.2); // 0.7 to 0.9
    const response = await callGPT(SIMULATION_SYSTEM, simulationPrompt, temperature, 2500);

    let simulations;
    try {
      simulations = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse simulation response:', parseError);
      return res.status(500).json({ error: 'Failed to parse simulation results' });
    }

    // Cache the result
    setCachedSimulation(invention, era, validatedCreativity, simulations);

    res.json({ simulations, cached: false });

  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Failed to generate simulations' });
  }
});

// POST /api/generate-image - Generate DALL-E images
router.post('/generate-image', imageLimiter, async (req, res) => {
  try {

    const { prompt, style = "technical", size = "1024x1024", pathwayData, era } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Image prompt is required' });
    }

    // Check cache first
    const cacheKey = `${prompt}_${style}_${size}`;
    const cached = getCachedImage(cacheKey);
    if (cached) {
      return res.json({ images: cached, cached: true });
    }

    console.log('Generating image with prompt:', prompt);

    let enhancedPrompt = prompt;
    if (pathwayData && era) {
      enhancedPrompt = getVisualPrompt(pathwayData, era);
    }

    const images = await generateImage(enhancedPrompt, size, 1);

    // Cache the result
    setCachedImage(cacheKey, images);

    res.json({ images, cached: false });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// POST /api/narrative - Generate historical narrative
router.post('/narrative', async (req, res) => {
  try {
    const { pathwayData, era } = req.body;

    if (!pathwayData || !era) {
      return res.status(400).json({ error: 'Pathway data and era are required' });
    }

    console.log(`Generating narrative for ${pathwayData.title} in ${era}`);

    const prompt = getNarrativePrompt(pathwayData, era);
    const narrative = await callGPT(NARRATIVE_SYSTEM, prompt, 0.6, 800);

    res.json({ narrative });

  } catch (error) {
    console.error('Narrative generation error:', error);
    res.status(500).json({ error: 'Failed to generate narrative' });
  }
});

// POST /api/transcribe - Transcribe audio to text
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    console.log('Transcribing audio file:', req.file.originalname);

    // Generate hash for caching
    const fileBuffer = await fs.readFile(req.file.path);
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // Check cache
    const cached = getCachedTranscription(fileHash);
    if (cached) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(console.error);
      return res.json({ text: cached, cached: true });
    }

    const transcription = await transcribeAudio(fileBuffer, req.file.originalname);

    // Cache result
    setCachedTranscription(fileHash, transcription);

    // Clean up uploaded file
    await fs.unlink(req.file.path).catch(console.error);

    res.json({ text: transcription, cached: false });

  } catch (error) {
    // Clean up file on error
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// POST /api/export - Export results as PPTX
router.post('/export', async (req, res) => {
  try {
    const { title, invention, era, decomposition, simulations, narratives, images = {} } = req.body;

    if (!title || !invention) {
      return res.status(400).json({ error: 'Title and invention are required' });
    }

    console.log(`Exporting PPTX for: ${title}`);

    // Prepare sections for export
    const sections = prepareSectionsForExport(decomposition, simulations, narratives);
    
    // Create PPTX
    const pptx = await createPPTX(title, sections, images);
    
    // Generate filename
    const filename = generateExportFilename(invention, era, 'pptx');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream PPTX to response
    await pptx.stream(res);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export presentation' });
  }
});

// GET /api/cache-stats - Get cache statistics (for debugging)
router.get('/cache-stats', (req, res) => {
  const stats = getCacheStats();
  res.json(stats);
});

export default router;