// Export utilities for PPTX and PDF generation
import PptxGenJS from 'pptxgenjs';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

// Create PPTX export
export async function createPPTX(title, sections, images = []) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "AI Reverse-Invention Generator";
  pptx.subject = `Alternate History: ${title}`;
  pptx.title = title;

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "1a1a2e" };
  
  titleSlide.addText("AI Reverse-Invention Generator", {
    x: 1, y: 1, w: 8, h: 1,
    fontSize: 36, bold: true, color: "ffffff",
    align: "center"
  });
  
  titleSlide.addText(title, {
    x: 1, y: 2.5, w: 8, h: 1.5,
    fontSize: 28, color: "64b5f6",
    align: "center"
  });

  titleSlide.addText("Reimagining History Through AI", {
    x: 1, y: 4.5, w: 8, h: 0.5,
    fontSize: 18, color: "b0bec5",
    align: "center"
  });

  // Process each section
  for (const section of sections) {
    const slide = pptx.addSlide();
    slide.background = { color: "1a1a2e" };

    // Section title
    slide.addText(section.title, {
      x: 0.5, y: 0.3, w: 9, h: 0.8,
      fontSize: 24, bold: true, color: "64b5f6"
    });

    // Section content
    if (section.content) {
      const contentY = section.image ? 1.2 : 1.2;
      const contentW = section.image ? 5.5 : 9;
      
      slide.addText(section.content, {
        x: 0.5, y: contentY, w: contentW, h: 4,
        fontSize: 14, color: "ffffff",
        valign: "top"
      });
    }

    // Add image if available
    if (section.image && images[section.image]) {
      try {
        // Download image if it's a URL
        let imageData = images[section.image];
        if (typeof imageData === 'string' && imageData.startsWith('http')) {
          const response = await fetch(imageData);
          imageData = await response.buffer();
        }

        slide.addImage({
          data: imageData,
          x: 6, y: 1.2, w: 3, h: 3,
          rounding: true
        });
      } catch (error) {
        console.error('Error adding image to slide:', error);
      }
    }

    // Add pathway-specific data
    if (section.type === 'pathway') {
      // Feasibility score
      if (section.feasibility_score) {
        slide.addText(`Feasibility: ${section.feasibility_score}/10`, {
          x: 0.5, y: 5.5, w: 3, h: 0.5,
          fontSize: 12, color: "ffa726", bold: true
        });
      }

      // Required breakthroughs
      if (section.required_breakthroughs && section.required_breakthroughs.length > 0) {
        slide.addText("Key Breakthroughs:", {
          x: 4, y: 5.5, w: 2, h: 0.3,
          fontSize: 12, color: "ffa726", bold: true
        });

        const breakthroughs = section.required_breakthroughs.join(" • ");
        slide.addText(breakthroughs, {
          x: 4, y: 5.8, w: 5, h: 0.7,
          fontSize: 10, color: "ffffff"
        });
      }
    }
  }

  // Summary slide
  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: "1a1a2e" };
  
  summarySlide.addText("Alternate History Insights", {
    x: 1, y: 1, w: 8, h: 1,
    fontSize: 28, bold: true, color: "64b5f6",
    align: "center"
  });

  summarySlide.addText([
    "• Technology emerges from the intersection of need, knowledge, and materials",
    "• Historical timing shapes how inventions develop and spread",
    "• Alternate pathways reveal missed opportunities and inspire new innovations",
    "• Understanding the past helps us imagine better futures"
  ].join("\n"), {
    x: 1, y: 2.5, w: 8, h: 3,
    fontSize: 16, color: "ffffff",
    bullet: true
  });

  return pptx;
}

// Helper function to prepare sections for export
export function prepareSectionsForExport(decomposition, simulations, narratives) {
  const sections = [];

  // Add decomposition section
  if (decomposition) {
    sections.push({
      title: "Invention Deconstruction",
      content: formatDecomposition(decomposition),
      type: "decomposition"
    });
  }

  // Add simulation sections
  if (simulations && simulations.pathways) {
    simulations.pathways.forEach((pathway, index) => {
      sections.push({
        title: `Pathway ${index + 1}: ${pathway.title}`,
        content: formatPathway(pathway),
        type: "pathway",
        feasibility_score: pathway.feasibility_score,
        required_breakthroughs: pathway.required_breakthroughs,
        image: pathway.id // Reference to image
      });
    });
  }

  // Add narrative section
  if (narratives) {
    sections.push({
      title: "Historical Narrative",
      content: narratives,
      type: "narrative"
    });
  }

  return sections;
}

function formatDecomposition(decomposition) {
  let content = `Core Functions:\n${decomposition.core_functions?.join(", ") || "N/A"}\n\n`;
  content += `Key Materials:\n${decomposition.materials?.join(", ") || "N/A"}\n\n`;
  content += `Enabling Sciences:\n${decomposition.enabling_sciences?.join(", ") || "N/A"}\n\n`;
  
  if (decomposition.subsystems && decomposition.subsystems.length > 0) {
    content += "Subsystems:\n";
    decomposition.subsystems.forEach(sub => {
      content += `• ${sub.name}: ${sub.dependencies?.join(", ") || "N/A"}\n`;
    });
  }

  return content;
}

function formatPathway(pathway) {
  let content = `${pathway.narrative}\n\n`;
  
  if (pathway.technical_steps && pathway.technical_steps.length > 0) {
    content += "Technical Steps:\n";
    pathway.technical_steps.forEach((step, i) => {
      content += `${i + 1}. ${step}\n`;
    });
    content += "\n";
  }

  content += `Prototype: ${pathway.prototype_description}\n\n`;

  if (pathway.cultural_impact) {
    content += `Cultural Impact: ${pathway.cultural_impact}`;
  }

  return content;
}

// Generate unique filename
export function generateExportFilename(invention, era, format) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const cleanInvention = invention.replace(/[^a-zA-Z0-9]/g, "_");
  const cleanEra = era.replace(/[^a-zA-Z0-9]/g, "_");
  return `reverse_invention_${cleanInvention}_${cleanEra}_${timestamp}.${format}`;
}