// AI Reverse-Invention Generator Prompts

// Deconstruction prompt (low creativity, structured analysis)
export const DECONSTRUCTION_SYSTEM = `You are an expert historian-engineer who specializes in analyzing inventions and their technological dependencies. You will deconstruct any given invention into its fundamental components in a structured JSON format.

Your analysis should be thorough, historically accurate, and consider both technical and cultural factors that enabled the invention.`;

export const getDeconstructionPrompt = (invention) => `
Deconstruct the invention: "${invention}"

Return a JSON object with the following structure:
{
  "name": "${invention}",
  "core_functions": ["list of primary functions this invention serves"],
  "materials": ["list of key materials required"],
  "enabling_sciences": ["list of scientific principles and discoveries required"],
  "subsystems": [
    {
      "name": "subsystem name",
      "dependencies": ["list of technologies or materials this subsystem requires"],
      "complexity": "low|medium|high"
    }
  ],
  "cultural_drivers": ["social, economic, or cultural needs that drove its development"],
  "min_tech_level": [
    {
      "technology": "required prerequisite technology",
      "notes": "brief explanation of why this is necessary"
    }
  ],
  "manufacturing_requirements": ["list of manufacturing processes or capabilities needed"],
  "key_breakthroughs": ["critical innovations that made this invention possible"]
}

Focus on being comprehensive and historically accurate.`;

// Simulation prompt (creative, alternate pathways)
export const SIMULATION_SYSTEM = `You are a speculative historian and systems engineer with expertise in technological development across different eras. You excel at imagining plausible alternate technological pathways and understanding how inventions could have emerged differently given different historical circumstances.

Your simulations should be creative yet grounded in historical possibility, considering the materials, knowledge, and cultural context of the specified era.`;

export const getSimulationPrompt = (invention, era, decomposition, creativity) => `
Using the decomposition data below, imagine 3-4 alternate invention pathways that could plausibly have produced "${invention}" during the "${era}" era.

Decomposition data:
${JSON.stringify(decomposition, null, 2)}

For each pathway, create a JSON object with:
{
  "pathways": [
    {
      "id": "unique_id",
      "title": "Creative name for this alternate invention",
      "narrative": "80-140 word story written as if this actually happened in that era, using period-appropriate language and context",
      "technical_steps": ["ordered list of how existing technology/knowledge would be combined"],
      "prototype_description": "detailed description of how the device would look, feel, and function using era-appropriate materials and methods",
      "feasibility_score": "0-10 rating (0=impossible, 10=very plausible for the era)",
      "required_breakthroughs": ["1-3 key innovations needed to make this work"],
      "cultural_impact": "how this would have changed society in that era",
      "visual_description": "detailed description for image generation, including era-appropriate aesthetics and materials"
    }
  ]
}

Consider:
- Available materials and manufacturing techniques of the era
- Scientific knowledge of the time
- Cultural and social context
- Economic factors and trade networks
- Existing technological foundations

Creativity level: ${creativity} (0=conservative, 1=highly speculative)`;

// Visual generation prompt
export const getVisualPrompt = (pathwayData, era) => {
  const styleInstructions = {
    "1800s": "Victorian era, brass and wood construction, mechanical gears, hand-crafted details, ornate engravings",
    "1700s": "Colonial period, simple wooden construction, basic metalwork, candlelit workshops",
    "1600s": "Renaissance style, elaborate clockwork mechanisms, guild craftsmanship, parchment diagrams",
    "medieval": "Medieval manuscript illumination style, stone and metal construction, monastery workshop",
    "ancient": "Ancient civilization aesthetic, stone, bronze, and clay materials, hieroglyphic annotations"
  };

  const eraStyle = styleInstructions[era.toLowerCase()] || styleInstructions["1800s"];

  return `Create a detailed technical illustration of "${pathwayData.title}" - ${pathwayData.prototype_description}

Style: ${eraStyle}
Format: Technical blueprint/schematic with cross-section views
Details: Show internal mechanisms, materials, and construction methods appropriate for the ${era} era
Quality: Photorealistic rendering with period-accurate materials and craftsmanship
Background: Neutral/white background suitable for documentation
Perspective: Isometric view with cutaway sections showing internal workings

Additional context: ${pathwayData.visual_description}`;
};

// Narrative history entry prompt
export const NARRATIVE_SYSTEM = `You are a distinguished historian writing entries for an alternate history textbook. Your writing style should match academic historical texts of the 19th century, with formal language and detailed analysis of technological and social impact.`;

export const getNarrativePrompt = (pathwayData, era) => `
Write a 250-350 word historical entry describing the invention of "${pathwayData.title}" during the ${era} era. 

Include:
- The circumstances of its invention
- Key figures involved (create plausible names)
- Technical details of how it worked
- Social and economic impact
- How it influenced subsequent technological development
- Challenges and limitations of the early versions

Write in the style of a formal historical textbook entry, as if this invention actually existed and shaped history. Use historically consistent vocabulary and tone appropriate for the ${era} period.

Context: ${pathwayData.narrative}
Technical details: ${pathwayData.prototype_description}
Cultural impact: ${pathwayData.cultural_impact}`;

// Moderation prompt for input validation
export const MODERATION_KEYWORDS = [
  'weapon', 'bomb', 'explosive', 'poison', 'drug', 'illegal', 'harmful', 'dangerous'
];

export function checkModerationKeywords(text) {
  const lowercaseText = text.toLowerCase();
  return MODERATION_KEYWORDS.some(keyword => lowercaseText.includes(keyword));
}