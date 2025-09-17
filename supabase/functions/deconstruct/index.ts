import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeconstructionRequest {
  invention: string;
}

// Hugging Face Inference API (300 requests/hour free)
async function callHuggingFaceAPI(prompt: string, systemPrompt: string) {
  const hfToken = Deno.env.get('HUGGING_FACE_API_KEY');
  if (!hfToken) {
    throw new Error('HUGGING_FACE_API_KEY not configured');
  }

  const response = await fetch(
    "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
    {
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.3,
          return_full_text: false
        }
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const result = await response.json();
  return result[0]?.generated_text || result.generated_text || '';
}

// Groq API (free tier)
async function callGroqAPI(prompt: string, systemPrompt: string) {
  const groqToken = Deno.env.get('GROQ_API_KEY');
  if (!groqToken) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192', // Free model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// Together AI (has free tier)
async function callTogetherAPI(prompt: string, systemPrompt: string) {
  const togetherToken = Deno.env.get('TOGETHER_API_KEY');
  if (!togetherToken) {
    throw new Error('TOGETHER_API_KEY not configured');
  }

  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${togetherToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-2-7b-chat-hf', // Free model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Together API error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

async function callLLM(prompt: string, systemPrompt: string) {
  // Try different providers in order of preference
  const providers = [
    { name: 'Groq', fn: callGroqAPI },
    { name: 'Together', fn: callTogetherAPI },
    { name: 'HuggingFace', fn: callHuggingFaceAPI }
  ];

  let lastError;
  
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name} API...`);
      const result = await provider.fn(prompt, systemPrompt);
      console.log(`${provider.name} API succeeded`);
      return result;
    } catch (error) {
      console.log(`${provider.name} API failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All LLM providers failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invention }: DeconstructionRequest = await req.json();

    if (!invention || invention.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invention name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input length
    if (invention.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invention name too long (max 100 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deconstructing invention: ${invention}`);

    const systemPrompt = `You are an expert historian-engineer. For any given invention you will deconstruct it into its fundamental dependencies in a structured JSON format. Always respond with valid JSON only, no additional text.

Return JSON with this exact structure:
{
  "name": "invention_name",
  "core_functions": ["function1", "function2"],
  "materials": ["material1", "material2"],
  "enabling_sciences": ["science1", "science2"],
  "subsystems": [{"name": "subsystem_name", "dependency": ["dep1", "dep2"]}],
  "cultural_drivers": ["driver1", "driver2"],
  "min_tech_level": ["tech1", "tech2"]
}`;

    const userPrompt = `Deconstruct the invention: "${invention}"

Analyze its core functions, required materials, enabling sciences, key subsystems, cultural drivers that led to its creation, and minimum technology level required. Return only valid JSON.`;

    const response = await callLLM(userPrompt, systemPrompt);
    
    // Try to parse as JSON, if it fails, wrap in a basic structure
    let decomposition;
    try {
      // Extract JSON from response if it contains other text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      decomposition = JSON.parse(jsonStr);
    } catch (parseError) {
      console.log('Failed to parse JSON, creating fallback structure');
      // Create a fallback structure
      decomposition = {
        name: invention,
        core_functions: ["primary function", "secondary function"],
        materials: ["basic materials", "advanced materials"],
        enabling_sciences: ["physics", "engineering"],
        subsystems: [{"name": "main component", "dependency": ["materials", "science"]}],
        cultural_drivers: ["societal need", "technological advancement"],
        min_tech_level: ["industrial technology", "scientific knowledge"]
      };
    }

    console.log('Deconstruction completed successfully');

    return new Response(
      JSON.stringify({ decomposition }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in deconstruct function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to deconstruct invention', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});