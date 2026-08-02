/**
 * ZEAI AI Lab Mentor — Groq API Chat Service
 * Provides real-time, context-aware experiment guidance using Groq LLM.
 * Maintains conversation history for multi-turn chat within a session.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

/**
 * Full ZEAI Lab Mentor system prompt — defines persona, responsibilities, and response structure.
 */
const ZEAI_SYSTEM_PROMPT = `You are ZEAI, an intelligent AI Laboratory Mentor inside an immersive 3D Virtual STEM Laboratory.

You are NOT a normal chatbot. You behave exactly like an experienced laboratory instructor, science teacher, and personal tutor.

Your primary goal is to help students understand concepts, safely perform experiments, correct mistakes, improve learning, and build confidence.

Always provide educational responses that are scientifically accurate, concise, interactive, and encouraging. Never hallucinate scientific facts. If you are unsure, clearly say that additional verification is required.

# PLATFORM CONTEXT
Platform Name: ZEAI – AI Powered Virtual STEM Laboratory
Students perform experiments inside an interactive 3D laboratory built using Three.js and React.
The laboratory contains Chemistry and Physics experiments.

# YOUR RESPONSIBILITIES
- Guide students step by step
- Explain scientific concepts
- Answer questions
- Correct mistakes
- Provide safety instructions
- Generate viva questions
- Generate observation tables
- Generate conclusions
- Evaluate student performance
- Motivate students
- Never simply give answers — TEACH

# RESPONSE STYLE
Always respond in this structure whenever possible:
1. **Short Answer** — Direct answer to the question
2. **Scientific Explanation** — The underlying science
3. **Why it happened** — Cause and effect
4. **Next Step** — What to do next
5. **Safety Tip** — Relevant safety advice
6. **Viva Question** — A question to test understanding
7. **Fun Fact** (optional) — An interesting related fact

Keep responses concise and well-formatted with markdown. Use emoji sparingly for visual appeal.

# TEACHING STYLE
- Be friendly and patient
- Never insult students
- Never say "Wrong." Instead say "Almost correct" or "Let's improve this step"
- Always encourage learning

# WHEN STUDENT ASKS "WHAT NEXT?"
Analyze current experiment step and return:
- Current Progress
- Next Immediate Step
- Expected Observation
- Common Mistake to Avoid
- Safety Reminder

# WHEN STUDENT MAKES A MISTAKE
- Identify the mistake
- Explain why it's incorrect
- Explain the scientific reason
- Tell how to fix it

# CHEMISTRY SUPPORT
You understand: Acid-Base Titration, Flame Test, Salt Preparation, pH Test, Precipitation, Electrolysis, Distillation, Iodine Clock Reaction.
Explain: Chemical equations, Reaction mechanisms, Color changes, Indicators, Observations, Safety, Expected results.

# PHYSICS SUPPORT
You understand: Circuit Builder, Ohm's Law, Projectile Motion, Pendulum, Snell's Law, Reflection, Electromagnetic Induction, Electric Circuits.
Always explain with simple real-life examples.

# VIVA MODE
If student asks for viva:
- Generate 5 questions one at a time
- After each answer, evaluate it, give score, explain correct answer

# SAFETY
Always include safety advice whenever chemicals, electricity, heat, or glassware are involved.

# NEVER DO
- Never generate fake observations
- Never fabricate formulas
- Never encourage unsafe actions
- Never provide misleading scientific information`;

/**
 * Experiment name map for human-readable labels in context.
 */
const EXP_NAMES = {
  'titration': 'Acid-Base Titration',
  'flame-test': 'Flame Test',
  'ph-test': 'pH Testing',
  'precipitation': 'Precipitation Reaction',
  'iodine-clock': 'Iodine Clock Reaction',
  'salt-prep': 'Salt Preparation',
  'electrolysis': 'Electrolysis of Water',
  'distillation': 'Distillation',
  'circuit': 'Circuit Building (Series)',
  'ohms-law': "Ohm's Law Verification",
  'pendulum': 'Simple Pendulum',
  'projectile': 'Projectile Motion',
  'refraction': "Snell's Law (Refraction)",
  'induction': 'Electromagnetic Induction',
};

/**
 * Builds a context string describing the student's current experiment state.
 * This is prepended to the user's message so the AI knows what's happening in real-time.
 */
export function buildExperimentContext(store) {
  const room = store.currentRoom;
  if (room === 'hallway') {
    return '[Student Location: Hallway — not currently at an experiment bench]';
  }

  const domain = room; // 'chemistry' or 'physics'
  const exp = store.activeExperiment || (domain === 'chemistry' ? 'titration' : 'circuit');
  const expName = EXP_NAMES[exp] || exp;

  let ctx = `[LIVE EXPERIMENT CONTEXT]\nDomain: ${domain}\nExperiment: ${expName}\n`;

  // Chemistry experiments
  if (exp === 'titration') {
    const c = store.chemistry;
    ctx += `Flask Placed: ${c.flaskPlaced}\nIndicator Added: ${c.indicatorAdded}\nVolume Added: ${c.volumeAdded.toFixed(1)} mL\nEquivalence Volume: ${c.equivalenceVolume.toFixed(1)} mL\nEndpoint Marked: ${c.endpointMarked}\n`;
    if (!c.flaskPlaced) ctx += 'Current Step: Student needs to pick up and place the conical flask.\n';
    else if (!c.indicatorAdded) ctx += 'Current Step: Student needs to add phenolphthalein indicator.\n';
    else if (c.volumeAdded === 0) ctx += 'Current Step: Student needs to start adding titrant from burette.\n';
    else if (!c.endpointMarked) ctx += 'Current Step: Student is adding titrant. Watch for color change to mark endpoint.\n';
    else ctx += 'Current Step: Experiment complete!\n';
  }
  else if (exp === 'flame-test') {
    const f = store.flameTest;
    ctx += `Selected Sample: ${f.selectedSample || 'None'}\nFlame Active: ${f.flameActive}\nObserved Color: ${f.observedColor || 'N/A'}\nStudent Guess: ${f.studentGuess || 'Not yet'}\nSubmitted: ${f.submitted}\n`;
  }
  else if (exp === 'ph-test') {
    const p = store.phTest;
    ctx += `Strip Held: ${p.stripHeld}\nStrip Dipped: ${p.stripDipped}\nSolution: ${p.selectedSolution || 'None'}\nActual pH: ${p.actualPH || 'N/A'}\nStudent Guess: ${p.studentGuess || 'Not yet'}\n`;
  }
  else if (exp === 'precipitation') {
    const p = store.precipitation;
    ctx += `Solution A (AgNO₃) Added: ${p.beakerAAdded}\nSolution B (NaCl) Added: ${p.beakerBAdded}\nPrecipitate Formed: ${p.precipitateFormed}\n`;
  }
  else if (exp === 'iodine-clock') {
    const ic = store.iodineClock;
    ctx += `Reagents Added: ${ic.reagentsAdded}/2\nTimer Started: ${!!ic.timerStarted}\nColor Changed: ${ic.colorChanged}\nStudent Stop Time: ${ic.studentStopTime ? 'Recorded' : 'Not yet'}\n`;
  }
  else if (exp === 'salt-prep') {
    const sp = store.saltPrep;
    ctx += `Heating: ${sp.heated}\nEvaporation Progress: ${(sp.heatProgress * 100).toFixed(0)}%\nCrystals Formed: ${sp.crystalsFormed}\n`;
  }
  else if (exp === 'electrolysis') {
    const el = store.electrolysis;
    ctx += `Power ON: ${el.powerOn}\nGas Level: ${(el.gasLevel * 100).toFixed(0)}%\nH₂ Volume: ${(el.gasLevel * 20).toFixed(1)} mL\nO₂ Volume: ${(el.gasLevel * 10).toFixed(1)} mL\n`;
  }
  else if (exp === 'distillation') {
    const d = store.distillation;
    ctx += `Heating: ${d.heating}\nDistillate Collected: ${(d.distillateVolume * 100).toFixed(1)} mL\n`;
  }
  // Physics experiments
  else if (exp === 'circuit') {
    const ph = store.physics;
    const placed = Object.values(ph.slots).filter(Boolean);
    ctx += `Components Placed: ${placed.join(', ') || 'None'}\nCircuit Complete: ${ph.circuitComplete}\nSwitch ON: ${ph.switchOn}\nCurrent: ${(ph.current * 1000).toFixed(1)} mA\nVoltage: ${ph.voltage}V\nResistance: ${ph.resistance}Ω\nLED ON: ${ph.ledOn}\n`;
  }
  else if (exp === 'ohms-law') {
    const ol = store.ohmsLaw;
    ctx += `Voltage: ${ol.voltage}V\nResistance: ${ol.resistance}Ω\nCurrent: ${((ol.voltage / ol.resistance) * 1000).toFixed(1)} mA\nReadings Taken: ${ol.readings.length}\nCircuit Built: ${ol.circuitBuilt}\nSwitch Closed: ${ol.switchClosed}\n`;
    if (ol.readings.length > 0) {
      ctx += 'V-I Data Points:\n';
      ol.readings.forEach((r, i) => {
        ctx += `  #${i + 1}: ${r.voltage}V → ${(r.current * 1000).toFixed(1)}mA\n`;
      });
    }
  }
  else if (exp === 'pendulum') {
    const pd = store.pendulum;
    ctx += `Length: ${pd.length.toFixed(1)}m\nInitial Angle: ${pd.initialAngle}°\nReleased: ${pd.released}\nTimer Running: ${pd.timerRunning}\n`;
    if (pd.timerStop && pd.timerStart) {
      const elapsed = ((pd.timerStop - pd.timerStart) / 1000).toFixed(2);
      ctx += `Timer Duration: ${elapsed}s\n`;
    }
  }
  else if (exp === 'projectile') {
    const pj = store.projectile;
    ctx += `Launch Angle: ${pj.angle}°\nVelocity: ${pj.velocity} m/s\nLaunched: ${pj.launched}\nMax Distance: ${pj.maxDistance.toFixed(2)}m\nReadings: ${pj.readings.length}\n`;
  }
  else if (exp === 'refraction') {
    const rf = store.refraction;
    ctx += `Incident Angle: ${rf.incidentAngle}°\nRefractive Index: ${rf.refractiveIndex}\nBeam Active: ${rf.beamActive}\nReadings: ${rf.readings.length}\n`;
  }
  else if (exp === 'induction') {
    const ind = store.induction;
    ctx += `Magnet Position: ${ind.magnetPos.toFixed(2)}\nMoving: ${ind.moving}\nDeflection: ${ind.deflection.toFixed(2)}\nInduced Current: ${ind.currentMA} mA\nThrust Speed: ${ind.thrustSpeed === 0.5 ? 'Slow' : (ind.thrustSpeed === 2.0 ? 'Fast' : 'Medium')}\nReadings: ${ind.readings.length}\n`;
  }

  return ctx;
}

/**
 * Conversation history maintained per session.
 * Cleared when student exits the lab or starts a new session.
 */
let conversationHistory = [];

/**
 * Clear conversation history (call on lab exit or reset).
 */
export function clearChatHistory() {
  conversationHistory = [];
}

/**
 * Get the current conversation history.
 */
export function getChatHistory() {
  return [...conversationHistory];
}

/**
 * Send a message to the ZEAI AI Lab Mentor via Groq API.
 * @param {string} userMessage - The student's message
 * @param {object} store - The current gameStore state snapshot
 * @returns {Promise<string>} The AI's response text
 */
export async function sendChatMessage(userMessage, store) {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured. Please add VITE_GROQ_API_KEY to your .env file.');
  }

  // Build experiment context
  const experimentContext = buildExperimentContext(store);

  // Construct the contextual user message
  const contextualMessage = `${experimentContext}\n\n[Student's Question/Message]: ${userMessage}`;

  // Add user message to history
  conversationHistory.push({
    role: 'user',
    content: contextualMessage,
  });

  // Keep history manageable (last 20 messages)
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }

  // Build messages array for the API
  const messages = [
    { role: 'system', content: ZEAI_SYSTEM_PROMPT },
    ...conversationHistory,
  ];

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices?.[0]?.message?.content;

  if (!assistantMessage) {
    throw new Error('Empty response from Groq API');
  }

  // Add assistant response to history
  conversationHistory.push({
    role: 'assistant',
    content: assistantMessage,
  });

  return assistantMessage;
}

/**
 * Predefined quick-action prompts for common student needs.
 */
export const QUICK_ACTIONS = [
  {
    id: 'what-next',
    label: '🧭 What Next?',
    prompt: 'What should I do next in this experiment? Show me my current progress and the next immediate step.',
  },
  {
    id: 'explain',
    label: '📚 Explain Concept',
    prompt: 'Explain the key scientific concept behind the experiment I am currently performing. Include the relevant formula and a simple real-life example.',
  },
  {
    id: 'safety',
    label: '⚠️ Safety Check',
    prompt: 'What are the important safety precautions I should follow for this experiment? List all safety rules and potential hazards.',
  },
  {
    id: 'viva',
    label: '🎓 Viva Question',
    prompt: 'Ask me a viva question related to the experiment I am currently performing. Give me a challenging but fair question to test my understanding.',
  },
];
