import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SimulationRequest {
  invention: string;
  era: string;
  decomposition?: any;
  depth?: number;
  creativity?: number;
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
      temperature: 0.8, // Higher creativity for simulation
      max_tokens: 1500,
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
      model: 'meta-llama/Llama-2-7b-chat-hf',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1500,
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
    { name: 'Together', fn: callTogetherAPI }
  ];

  let lastError;
  
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name} API for simulation...`);
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
    const { invention, era, decomposition, depth = 3, creativity = 0.8 }: SimulationRequest = await req.json();

    if (!invention || !era) {
      return new Response(
        JSON.stringify({ error: 'Invention and era are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Simulating ${invention} in ${era}`);

    const systemPrompt = `You are a speculative historian and systems engineer. You create alternate invention pathways that could plausibly produce inventions in different historical eras. Always respond with valid JSON only, no additional text.

Return JSON with this exact structure:
{
  "pathways": [
    {
      "id": 1,
      "title": "Pathway Name",
      "narrative": "80-140 word historical narrative as if it happened",
      "technical_steps": ["step1", "step2", "step3"],
      "prototype_description": "How the device looks and works in that era",
      "feasibility_score": 7,
      "required_breakthroughs": ["breakthrough1", "breakthrough2"]
    }
  ]
}`;

    const decompositionText = decomposition ? 
      `Based on this decomposition: ${JSON.stringify(decomposition)}\n\n` : 
      `For the invention "${invention}", consider its basic requirements.\n\n`;

    const userPrompt = `${decompositionText}Imagine 3 alternate invention pathways that could plausibly produce "${invention}" in the "${era}" era.

For each pathway:
- Create a compelling title
- Write a 80-140 word narrative as if it actually happened in that era
- List 3-5 technical steps describing how existing technology is combined
- Describe the prototype (appearance, materials, interface) for that era
- Give a feasibility score 0-10 (considering available technology in ${era})
- List 1-3 required breakthroughs

Creativity level: ${creativity}
Depth level: ${depth}

Return only valid JSON.`;

    const response = await callLLM(userPrompt, systemPrompt);
    
    let simulations;
    try {
      // Extract JSON from response if it contains other text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      simulations = JSON.parse(jsonStr);
    } catch (parseError) {
      console.log('Failed to parse JSON, creating fallback simulations');
      // Create fallback simulations
      simulations = {
        pathways: [
          {
            id: 1,
            title: `Early ${invention} - Mechanical Approach`,
            narrative: `In the ${era}, inventors combined existing mechanical principles to create an early version of the ${invention}. Using materials and techniques available at the time, they developed a functional prototype that served similar purposes to the modern invention.`,
            technical_steps: [
              "Combine existing mechanical components",
              "Use available materials and craftsmanship",
              "Apply known scientific principles",
              "Iterate through manual testing"
            ],
            prototype_description: `A ${era}-era device using wood, metal, and basic mechanisms to replicate core functions of a ${invention}.`,
            feasibility_score: 6,
            required_breakthroughs: ["Advanced materials", "Precision manufacturing"]
          },
          {
            id: 2,
            title: `${invention} - Alternative Path`,
            narrative: `An alternate timeline where the ${invention} emerged through a different technological path in the ${era}. Inventors approached the problem from a unique angle, leading to an innovative solution using period-appropriate technology.`,
            technical_steps: [
              "Alternative technical approach",
              "Use of different base technologies",
              "Novel combination of existing tools",
              "Gradual refinement process"
            ],
            prototype_description: `A unique ${era} interpretation of the ${invention} using alternative materials and methods.`,
            feasibility_score: 5,
            required_breakthroughs: ["New manufacturing techniques", "Scientific understanding"]
          },
          {
            id: 3,
            title: `Revolutionary ${invention} Concept`,
            narrative: `A visionary ${era} inventor reimagined the fundamental approach to creating a ${invention}. This revolutionary concept challenged conventional thinking and proposed a radically different method to achieve the same goals.`,
            technical_steps: [
              "Revolutionary design approach",
              "Novel use of available resources", 
              "Innovative problem-solving",
              "Prototype development"
            ],
            prototype_description: `A groundbreaking ${era} device that challenges traditional approaches to the ${invention} concept.`,
            feasibility_score: 4,
            required_breakthroughs: ["Paradigm shift", "Technical innovations", "Resource availability"]
          }
        ]
      };
    }

    console.log('Simulation completed successfully');

    return new Response(
      JSON.stringify(simulations),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in simulate function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to simulate invention pathways', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});