/**
 * ZEAI Chat Assistant Service
 * In-Experiment Floating Assistant providing live guidance without spoiling answers.
 */

import { saveChatLog } from './supabase';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GROK_URL = 'https://api.x.ai/v1/chat/completions';

/**
 * Build System Prompt for ZEAI Chat Assistant
 */
function buildZEAISystemPrompt(experimentContext, actionsLog = []) {
  const expName = experimentContext?.activeExperiment || experimentContext?.currentRoom || 'Virtual Lab';
  const actionsSummary = actionsLog.slice(-10).map(a => `- ${a.type || 'step'} at ${a.time ? new Date(a.time).toLocaleTimeString() : 'now'}`).join('\n') || 'No actions taken yet';

  return `You are ZEAI, a friendly in-lab AI assistant helping a student during a live virtual experiment.

Experiment: ${expName} (${experimentContext?.currentRoom || 'Lab'})
Current experiment state: ${JSON.stringify(experimentContext)}
Recent steps completed:
${actionsSummary}

Rules:
- Explain concepts and procedure clearly and simply.
- Give the NEXT STEP or a helpful hint, not the final answer/exact values needed to complete the experiment correctly.
- If the student seems stuck or has retried multiple times, be extra encouraging and break the explanation into smaller steps.
- Keep responses short (3-5 sentences) — this is a live chat, not an essay.
- If asked something unrelated to the experiment, gently redirect back to the lab.
- Respond conversationally as a helpful instructor.`;
}

/**
 * Send Message to ZEAI Chat Engine
 */
export async function sendZEAIChatMessage({
  experimentContext,
  actionsLog = [],
  studentMessage,
  messageHistory = [],
  studentId = null,
  experimentId = null,
}) {
  const apiKey = OPENROUTER_API_KEY || GROK_API_KEY;
  let replyText = '';

  // Save student message log
  saveChatLog(studentId, experimentId, studentMessage, 'user');

  if (apiKey) {
    try {
      const url = GROK_API_KEY ? GROK_URL : OPENROUTER_URL;
      const model = GROK_API_KEY ? 'grok-beta' : 'google/gemini-2.5-flash';

      const systemPrompt = buildZEAISystemPrompt(experimentContext, actionsLog);
      
      const payloadMessages = [
        { role: 'system', content: systemPrompt },
        ...messageHistory.slice(-6),
        { role: 'user', content: studentMessage },
      ];

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      if (OPENROUTER_API_KEY && !GROK_API_KEY) {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'VirtuLab';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: payloadMessages,
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        replyText = data.choices?.[0]?.message?.content || '';
      }
    } catch (err) {
      console.warn('ZEAI Chat API error, using contextual local mentor fallback:', err);
    }
  }

  if (!replyText) {
    replyText = generateLocalZEAIReply(experimentContext, actionsLog, studentMessage);
  }

  // Save assistant response log
  saveChatLog(studentId, experimentId, replyText, 'assistant');

  return replyText;
}

/**
 * Generate Local ZEAI Reply Fallback
 */
function generateLocalZEAIReply(experimentContext, actionsLog, studentMessage) {
  const msgLower = studentMessage.toLowerCase();
  const exp = experimentContext?.activeExperiment || experimentContext?.currentRoom || 'titration';

  if (msgLower.includes('how do i') || msgLower.includes('what next') || msgLower.includes('help') || msgLower.includes('stuck')) {
    if (exp === 'titration' || experimentContext?.currentRoom === 'chemistry') {
      if (!experimentContext?.chemistry?.flaskPlaced) {
        return "👋 First step: Click on the Conical Flask on the shelf to place it on the magnetic stirrer on your workbench!";
      }
      if (!experimentContext?.chemistry?.indicatorAdded) {
        return "🧪 Now add 2-3 drops of Phenolphthalein indicator to the flask before starting the burette drip.";
      }
      return "💧 Open the burette stopcock slowly. Watch the flask color carefully as you approach the 25 mL equivalence point!";
    }
    if (exp === 'circuit' || experimentContext?.currentRoom === 'physics') {
      if (!experimentContext?.physics?.circuitComplete) {
        return "⚡ Let's build the loop! Connect your Battery, Resistor, LED, and Switch onto the breadboard slots.";
      }
      return "🔌 Circuit is connected! Toggle the switch to check if electric current lights up the LED.";
    }
    return "🔬 Take your time! Review the equipment on the table, and follow the step-by-step experiment guide in the top toolbar.";
  }

  if (msgLower.includes('why') || msgLower.includes('explain') || msgLower.includes('formula')) {
    if (exp === 'titration' || experimentContext?.currentRoom === 'chemistry') {
      return "💡 In titration, M₁V₁ = M₂V₂. When moles of acid equal moles of base, neutralization occurs, causing the indicator to change color permanently!";
    }
    if (exp === 'circuit' || exp === 'ohms-law' || experimentContext?.currentRoom === 'physics') {
      return "⚡ Ohm's Law states V = I × R. Current (I) increases proportionally with Voltage (V) and decreases with Resistance (R).";
    }
    return "📚 Science is all about observing cause and effect! Check the pre-lab theory card in the menu for formula details.";
  }

  return "🤖 I'm ZEAI, your lab mentor! Tell me what step you're currently working on, or click 'What Next?' for guidance.";
}
