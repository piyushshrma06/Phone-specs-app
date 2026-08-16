/**
 * verdict.js
 *
 * The ONLY agent in this pipeline that calls an LLM. Takes the clean,
 * flattened object from analyst.js and asks Gemini to produce a
 * buy/pass call with pros and cons - reasoning over real structured
 * data instead of raw messy HTML, which keeps the prompt short and
 * the output reliable.
 */

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// gemini-2.5-flash: fast and cheap, appropriate for a structured
// extraction/reasoning task like this (no need for a heavier model).
const MODEL = 'gemini-2.5-flash';

function buildPrompt(cleanedPhone) {
  return `You are a phone-buying advisor. Based ONLY on the specs below, give a verdict.

Phone specs:
${JSON.stringify(cleanedPhone, null, 2)}

Respond with ONLY valid JSON, no markdown code fences, no extra text, in exactly this shape:
{
  "verdict": "Buy" or "Pass",
  "summary": "one sentence explaining the verdict",
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2", "con 3"]
}`;
}

/**
 * Strips markdown code fences if Gemini adds them despite instructions
 * not to - models don't always follow formatting instructions perfectly,
 * so we defend against it rather than assume.
 */
function extractJson(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Main entry point: cleaned phone object in, verdict object out.
 */
async function getVerdict(cleanedPhone) {
  const prompt = buildPrompt(cleanedPhone);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const text = response.text;

  try {
    return extractJson(text);
  } catch (err) {
    // If Gemini's output isn't valid JSON, fail loudly rather than
    // silently caching garbage - this is exactly the kind of failure
    // that should NOT get written to MongoDB (see cacheService later).
    throw new Error(`Verdict agent returned unparseable output: ${text.slice(0, 200)}`);
  }
}

module.exports = { getVerdict };