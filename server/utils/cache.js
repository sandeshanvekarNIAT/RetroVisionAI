// Simple in-memory caching system with TTL
import NodeCache from 'node-cache';

// Create cache instances with different TTLs
const deconstructionCache = new NodeCache({ stdTTL: 3600 }); // 1 hour
const simulationCache = new NodeCache({ stdTTL: 1800 }); // 30 minutes
const imageCache = new NodeCache({ stdTTL: 7200 }); // 2 hours
const audioCache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Deconstruction caching
export function getCachedDeconstruction(invention) {
  const key = `deconstruct_${invention.toLowerCase().trim()}`;
  return deconstructionCache.get(key);
}

export function setCachedDeconstruction(invention, data) {
  const key = `deconstruct_${invention.toLowerCase().trim()}`;
  deconstructionCache.set(key, data);
}

// Simulation caching
export function getCachedSimulation(invention, era, creativity) {
  const key = `simulate_${invention.toLowerCase().trim()}_${era.toLowerCase().trim()}_${creativity}`;
  return simulationCache.get(key);
}

export function setCachedSimulation(invention, era, creativity, data) {
  const key = `simulate_${invention.toLowerCase().trim()}_${era.toLowerCase().trim()}_${creativity}`;
  simulationCache.set(key, data);
}

// Image caching
export function getCachedImage(prompt) {
  const key = `image_${Buffer.from(prompt).toString('base64').slice(0, 50)}`;
  return imageCache.get(key);
}

export function setCachedImage(prompt, data) {
  const key = `image_${Buffer.from(prompt).toString('base64').slice(0, 50)}`;
  imageCache.set(key, data);
}

// Audio transcription caching
export function getCachedTranscription(audioHash) {
  return audioCache.get(`audio_${audioHash}`);
}

export function setCachedTranscription(audioHash, text) {
  audioCache.set(`audio_${audioHash}`, text);
}

// Cache statistics
export function getCacheStats() {
  return {
    deconstruction: {
      keys: deconstructionCache.keys().length,
      hits: deconstructionCache.getStats().hits,
      misses: deconstructionCache.getStats().misses
    },
    simulation: {
      keys: simulationCache.keys().length,
      hits: simulationCache.getStats().hits,
      misses: simulationCache.getStats().misses
    },
    image: {
      keys: imageCache.keys().length,
      hits: imageCache.getStats().hits,
      misses: imageCache.getStats().misses
    },
    audio: {
      keys: audioCache.keys().length,
      hits: audioCache.getStats().hits,
      misses: audioCache.getStats().misses
    }
  };
}

// Clear all caches
export function clearAllCaches() {
  deconstructionCache.flushAll();
  simulationCache.flushAll();
  imageCache.flushAll();
  audioCache.flushAll();
}