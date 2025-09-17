import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  size?: string;
  pathwayData?: any;
  era?: string;
}

// Hugging Face Image Generation (free tier)
async function generateWithHuggingFace(prompt: string) {
  const hfToken = Deno.env.get('HUGGING_FACE_API_KEY');
  if (!hfToken) {
    throw new Error('HUGGING_FACE_API_KEY not configured');
  }

  const response = await fetch(
    "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
    {
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          guidance_scale: 7.5,
          num_inference_steps: 4, // Fast generation
          width: 1024,
          height: 1024
        }
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
  }

  const imageBuffer = await response.arrayBuffer();
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  
  return {
    id: Date.now().toString(),
    url: `data:image/png;base64,${base64Image}`,
    provider: 'HuggingFace'
  };
}

// Pollinations.ai (free)
async function generateWithPollinations(prompt: string) {
  const cleanPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;
  
  try {
    // Fetch the image to verify it exists
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.status}`);
    }
    
    return {
      id: Date.now().toString(),
      url: imageUrl,
      provider: 'Pollinations'
    };
  } catch (error) {
    throw new Error(`Failed to generate image with Pollinations: ${error.message}`);
  }
}

async function generateImage(prompt: string) {
  // Try different providers in order of preference
  const providers = [
    { name: 'HuggingFace', fn: () => generateWithHuggingFace(prompt) },
    { name: 'Pollinations', fn: () => generateWithPollinations(prompt) }
  ];

  let lastError;
  
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name} for image generation...`);
      const result = await provider.fn();
      console.log(`${provider.name} image generation succeeded`);
      return result;
    } catch (error) {
      console.log(`${provider.name} failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All image generation providers failed');
}

function enhancePrompt(prompt: string, pathwayData?: any, era?: string): string {
  let enhancedPrompt = prompt;

  if (pathwayData && era) {
    const eraStyle = getEraStyle(era);
    enhancedPrompt = `${eraStyle} technical blueprint illustration of ${pathwayData.prototype_description || prompt}. ${pathwayData.title || ''} from the ${era}. Detailed schematic drawing, vintage style, sepia tones, hand-drawn appearance, technical annotations, cross-section view, high detail, neutral background.`;
  } else if (era) {
    const eraStyle = getEraStyle(era);
    enhancedPrompt = `${eraStyle} technical illustration of ${prompt}. Vintage blueprint style, detailed schematic, era-appropriate materials and design, technical drawing, neutral background.`;
  } else {
    enhancedPrompt = `Technical blueprint illustration of ${prompt}. Detailed schematic drawing, cross-section view, technical annotations, high detail, neutral background.`;
  }

  return enhancedPrompt;
}

function getEraStyle(era: string): string {
  const eraLower = era.toLowerCase();
  
  if (eraLower.includes('1800') || eraLower.includes('victorian')) {
    return 'Victorian era (1800s)';
  } else if (eraLower.includes('1700') || eraLower.includes('colonial')) {
    return '18th century colonial';
  } else if (eraLower.includes('medieval') || eraLower.includes('middle ages')) {
    return 'Medieval';
  } else if (eraLower.includes('renaissance')) {
    return 'Renaissance';
  } else if (eraLower.includes('ancient') || eraLower.includes('classical')) {
    return 'Ancient classical';
  } else {
    return era;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style, pathwayData, era }: ImageGenerationRequest = await req.json();

    if (!prompt || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating image for: ${prompt}`);

    const enhancedPrompt = enhancePrompt(prompt, pathwayData, era);
    console.log(`Enhanced prompt: ${enhancedPrompt}`);

    const image = await generateImage(enhancedPrompt);

    console.log('Image generation completed successfully');

    return new Response(
      JSON.stringify({ 
        images: [image],
        prompt: enhancedPrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate image', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});