// OpenAI Client utilities
import OpenAI from 'openai';

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Chat completion for deconstruction and simulation
export async function callGPT(systemPrompt, userPrompt, temperature = 0.3, maxTokens = 2000) {
  try {
    const response = await client.chat.completions.create({
      model: process.env.GPT_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('GPT API Error:', error);
    throw new Error(`GPT API failed: ${error.message}`);
  }
}

// Image generation using DALL·E
export async function generateImage(prompt, size = "1024x1024", n = 1) {
  try {
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: size,
      n: n,
      quality: "standard",
      response_format: "url"
    });
    
    return response.data;
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

// Whisper transcription for audio input
export async function transcribeAudio(audioBuffer, filename) {
  try {
    // Convert buffer to File-like object
    const file = new File([audioBuffer], filename, { type: 'audio/wav' });
    
    const transcription = await client.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en"
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

// Text moderation check
export async function moderateContent(text) {
  try {
    const response = await client.moderations.create({
      input: text,
    });
    
    return response.results[0];
  } catch (error) {
    console.error('Moderation error:', error);
    return { flagged: false }; // Fail open for moderation
  }
}

export default client;