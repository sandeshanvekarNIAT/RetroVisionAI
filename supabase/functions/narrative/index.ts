import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NarrativeRequest {
  pathwayData: any;
  era: string;
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
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}


async function callLLM(prompt: string, systemPrompt: string) {
  // Try different providers in order of preference
  const providers = [
    { name: 'Groq', fn: callGroqAPI }
  ];

  let lastError;
  
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name} API for narrative...`);
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
    const { pathwayData, era }: NarrativeRequest = await req.json();

    if (!pathwayData || !era) {
      return new Response(
        JSON.stringify({ error: 'Pathway data and era are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating narrative for ${pathwayData.title} in ${era}`);

    const systemPrompt = `You are a distinguished historian writing alternate history textbook entries. Write in the style appropriate for the historical era requested. Use historically accurate language, terminology, and social context for that time period.`;

    const userPrompt = `Write a 250-350 word history book entry about this alternate invention pathway:

Title: ${pathwayData.title}
Era: ${era}
Description: ${pathwayData.prototype_description}
Technical Steps: ${pathwayData.technical_steps?.join(', ')}
Required Breakthroughs: ${pathwayData.required_breakthroughs?.join(', ')}

Write as if this invention actually existed and had real historical impact in the ${era}. Include:
- The circumstances of its invention
- Its social and economic impact
- How it changed daily life
- Technical details appropriate for the era
- Names of fictional but plausible inventors/locations

Use vocabulary and writing style appropriate for the ${era} period. Make it sound like it's from an actual history textbook about this alternate timeline.`;

    const narrative = await callLLM(userPrompt, systemPrompt);

    console.log('Narrative generation completed successfully');

    return new Response(
      JSON.stringify({ 
        narrative: narrative.trim(),
        era,
        title: pathwayData.title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in narrative function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate narrative', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});