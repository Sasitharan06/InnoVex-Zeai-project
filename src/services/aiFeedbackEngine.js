/**
 * AI Feedback & Guidance Engine
 * 
 * Provides rule-based mistake detection, behavioral signal analysis,
 * and structured feedback generation for Chemistry and Physics virtual labs.
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GROK_URL = 'https://api.x.ai/v1/chat/completions';

/**
 * Detect Chemistry Mistakes from final experiment state
 */
export function detectChemistryMistakes(finalState) {
  const mistakes = [];
  const expType = finalState.experimentType || 'titration';

  if (expType === 'titration') {
    const eq = finalState.equivalenceVolume || 25.0;
    const vol = finalState.volumeAdded || 0;
    const tolerance = finalState.tolerance || 0.5;

    if (vol > eq + tolerance) {
      mistakes.push({
        type: 'overshoot',
        detail: `Added ${vol.toFixed(1)} mL, overshot equivalence point (${eq} mL) by ${(vol - eq).toFixed(1)} mL`,
      });
    } else if (vol > 0 && vol < eq - tolerance) {
      mistakes.push({
        type: 'undershoot',
        detail: `Stopped too early at ${vol.toFixed(1)} mL, ${(eq - vol).toFixed(1)} mL short of equivalence point (${eq} mL)`,
      });
    }

    if (!finalState.indicatorAdded || finalState.mixingOrderWrong) {
      mistakes.push({
        type: 'wrong_order',
        detail: 'Indicator was not added to flask before starting titration',
      });
    }
  }

  if (expType === 'precipitation') {
    if (finalState.wrongProportions) {
      mistakes.push({
        type: 'wrong_ratio',
        detail: `Used ${finalState.actualRatio || 'incorrect ratio'} instead of expected ${finalState.expectedRatio || '1:1 ratio'}`,
      });
    }
    if (finalState.wrongOrderAdded) {
      mistakes.push({
        type: 'wrong_order',
        detail: 'Reagents combined in incorrect sequence',
      });
    }
    if (!finalState.precipitateFormed) {
      mistakes.push({
        type: 'incomplete_reaction',
        detail: 'Both reactants were not fully mixed to form precipitate',
      });
    }
  }

  if (expType === 'flame-test') {
    if (finalState.studentGuess && finalState.studentGuess !== finalState.sampleTested) {
      mistakes.push({
        type: 'incorrect_identification',
        detail: `Identified sample as ${finalState.studentGuess}, but characteristic flame color corresponds to ${finalState.sampleTested}`,
      });
    }
    if (!finalState.flameActive) {
      mistakes.push({
        type: 'skipped_procedure',
        detail: 'Sample was not exposed to the burner flame before drawing conclusion',
      });
    }
  }

  if (expType === 'ph-test') {
    if (finalState.studentGuess !== null && Math.abs(finalState.studentGuess - finalState.actualPH) > 1) {
      mistakes.push({
        type: 'reading_error',
        detail: `Recorded pH of ${finalState.studentGuess}, actual pH was ${finalState.actualPH}`,
      });
    }
    if (!finalState.stripDipped) {
      mistakes.push({
        type: 'skipped_procedure',
        detail: 'pH strip was not dipped into solution',
      });
    }
  }

  if (expType === 'iodine-clock') {
    if (finalState.deltaSeconds && Math.abs(finalState.deltaSeconds) > 3) {
      const direction = finalState.deltaSeconds > 0 ? 'late' : 'early';
      mistakes.push({
        type: 'timing_error',
        detail: `Stopped timer ${Math.abs(finalState.deltaSeconds).toFixed(1)}s ${direction} after color transition`,
      });
    }
    if (finalState.reagentsAdded < 2) {
      mistakes.push({
        type: 'incomplete_mixture',
        detail: 'Did not combine both reactant solutions',
      });
    }
  }

  if (expType === 'salt-prep') {
    if (!finalState.heated) {
      mistakes.push({
        type: 'skipped_heating',
        detail: 'Solution was not heated for evaporation',
      });
    }
  }

  if (expType === 'electrolysis') {
    if (!finalState.powerOn) {
      mistakes.push({
        type: 'open_circuit',
        detail: 'DC power supply was not switched on',
      });
    }
  }

  if (expType === 'distillation') {
    if (!finalState.heating) {
      mistakes.push({
        type: 'skipped_heating',
        detail: 'Heat source was not turned on to distill mixture',
      });
    }
  }

  return mistakes;
}

/**
 * Detect Physics Mistakes from final experiment state
 */
export function detectPhysicsMistakes(finalState) {
  const mistakes = [];
  const expType = finalState.experimentType || 'circuit';

  if (expType === 'circuit') {
    if (!finalState.circuitComplete && !finalState.circuitClosed) {
      mistakes.push({
        type: 'open_circuit',
        detail: 'Circuit not fully connected — missing switch, wire, or resistor',
      });
    }
    if (finalState.polarityReversed) {
      mistakes.push({
        type: 'wrong_polarity',
        detail: 'Battery connected with reversed polarity',
      });
    }
    if (finalState.circuitType && finalState.expectedType && finalState.circuitType !== finalState.expectedType) {
      mistakes.push({
        type: 'wrong_configuration',
        detail: `Built ${finalState.circuitType} circuit, experiment required ${finalState.expectedType}`,
      });
    }
  }

  if (expType === 'pendulum') {
    const percentError = typeof finalState.percentError === 'number'
      ? finalState.percentError
      : (finalState.measuredPeriod && finalState.calculatedPeriod)
        ? Math.abs(finalState.measuredPeriod - finalState.calculatedPeriod) / finalState.calculatedPeriod * 100
        : 0;

    if (percentError > 10) {
      mistakes.push({
        type: 'measurement_error',
        detail: `Measured period off by ${percentError.toFixed(1)}% — likely miscounted oscillations or timing error`,
      });
    }
    if (!finalState.released) {
      mistakes.push({
        type: 'skipped_release',
        detail: 'Pendulum bob was not released before timing',
      });
    }
  }

  if (expType === 'ohms-law') {
    if (!finalState.circuitBuilt) {
      mistakes.push({
        type: 'open_circuit',
        detail: 'Circuit components (voltmeter/ammeter/resistor) not completely connected',
      });
    }
    if (!finalState.switchClosed) {
      mistakes.push({
        type: 'switch_open',
        detail: 'Switch left open while taking measurements',
      });
    }
    if (finalState.readings && finalState.readings.length < 2) {
      mistakes.push({
        type: 'insufficient_data',
        detail: 'Need at least 2 distinct voltage readings to plot V vs I line',
      });
    }
  }

  if (expType === 'projectile') {
    if (!finalState.launched) {
      mistakes.push({
        type: 'not_launched',
        detail: 'Launcher was not fired to observe trajectory',
      });
    }
  }

  if (expType === 'refraction') {
    if (!finalState.beamActive) {
      mistakes.push({
        type: 'laser_off',
        detail: 'Laser ray box was not turned on',
      });
    }
  }

  if (expType === 'induction') {
    if (!finalState.readings || finalState.readings.length === 0) {
      mistakes.push({
        type: 'no_movement',
        detail: 'Bar magnet was not thrust into or pulled out of solenoid coil',
      });
    }
  }

  return mistakes;
}

/**
 * Track behavioral signals from actionsLog (hesitation, retries, pauses)
 */
export function detectBehavioralSignals(actionsLog = []) {
  const signals = [];
  if (!actionsLog || actionsLog.length === 0) return signals;

  const undoCount = actionsLog.filter(a => a.type === 'undo' || a.type === 'retry' || a.type === 'reset').length;
  
  // Calculate gaps between steps
  let longPauseCount = 0;
  for (let i = 1; i < actionsLog.length; i++) {
    const t1 = actionsLog[i - 1].time || actionsLog[i - 1].timestamp;
    const t2 = actionsLog[i].time || actionsLog[i].timestamp;
    if (t1 && t2 && (t2 - t1) > 15000) {
      longPauseCount++;
    }
  }

  if (undoCount >= 3) {
    signals.push({
      type: 'frequent_retries',
      detail: `Retried or reset ${undoCount} times — may indicate uncertainty about procedure`,
    });
  }

  if (longPauseCount >= 2) {
    signals.push({
      type: 'slow_hesitant',
      detail: 'Long pauses detected between steps — student took time to analyze or was hesitant',
    });
  }

  return signals;
}

import { useLiveTracker } from '../store/liveTrackerStore';

/**
 * Generate Structured AI Feedback
 */
export async function generateExperimentFeedback(domain, finalState, actionsLog = []) {
  const mistakes = domain === 'chemistry'
    ? detectChemistryMistakes(finalState)
    : detectPhysicsMistakes(finalState);
    
  const behavioralSignals = detectBehavioralSignals(actionsLog);
  const liveTrackingSummary = useLiveTracker.getState().getSummary();

  const apiKey = OPENROUTER_API_KEY || GROK_API_KEY;
  const expName = finalState.experimentName || finalState.experimentType || domain;

  if (apiKey) {
    try {
      const url = GROK_API_KEY ? GROK_URL : OPENROUTER_URL;
      const model = GROK_API_KEY ? 'grok-beta' : 'google/gemini-2.5-flash';
      
      const prompt = `You are a supportive, encouraging lab instructor giving feedback to a student after a virtual experiment.

Experiment: ${expName} (${domain})
Detected issues: ${JSON.stringify(mistakes)}
Behavioral signals: ${JSON.stringify(behavioralSignals)}
Final result data: ${JSON.stringify(finalState)}

Additionally, here is real-time behavioral data collected silently during the experiment:
- Total steps taken: ${liveTrackingSummary.totalSteps}
- Total time spent: ${liveTrackingSummary.totalTimeMs}ms
- Number of retries/undos: ${liveTrackingSummary.retryCount}
- Number of hesitation pauses (long gaps between actions): ${liveTrackingSummary.hesitationCount}
- Incorrect readings recorded during experiment: ${JSON.stringify(liveTrackingSummary.wrongReadings)}
- Incorrect mixing/ordering attempts: ${JSON.stringify(liveTrackingSummary.wrongMixes)}
- Overall behavioral flag — student seemed unsure: ${liveTrackingSummary.seemsUnsure}

Using BOTH the final result and this live behavioral tracking data, include:
- feedback: array of specific observations — reference the actual wrong readings/mixes/retries by value, not generic statements.
- improvement_suggestions: array of concrete, actionable next steps (e.g. "Practice reading the meniscus at eye level", not "be more careful").
- confidence_note: one supportive line addressing whether the student seemed unsure (only include if seemsUnsure is true — otherwise return null).

Return ONLY valid JSON with no markdown syntax wrapping:
{
  "score": number (0-100),
  "summary": "string (2-3 sentences, encouraging tone)",
  "what_went_wrong": [{ "issue": "string", "why_it_happened": "string", "how_to_fix": "string" }],
  "what_went_right": ["string"],
  "recommendation": "string",
  "encouragement": "string",
  "feedback": ["string"],
  "improvement_suggestions": ["string"],
  "confidence_note": "string | null"
}`;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      if (OPENROUTER_API_KEY && !GROK_API_KEY) {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'StepIn';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a supportive lab instructor AI. Respond only in strict JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 750,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '';
        const parsed = safeJsonParse(content);
        if (parsed) {
          useLiveTracker.getState().reset();
          return {
            ...parsed,
            domain,
            mistakes,
            behavioralSignals,
            liveTrackingSummary,
          };
        }
      }
    } catch (err) {
      console.warn('AI Feedback API call notice, using rule-based engine fallback');
    }
  }

  const result = generateLocalFeedback(domain, finalState, mistakes, behavioralSignals, liveTrackingSummary);
  useLiveTracker.getState().reset();
  return result;
}

function safeJsonParse(text) {
  if (!text) return null;
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
  const raw = match ? match[1] : text;
  try {
    return JSON.parse(raw);
  } catch (e1) {
    try {
      // Escape raw unescaped newlines inside string literals
      const cleaned = raw.replace(/\n/g, '\\n').replace(/\r/g, '');
      return JSON.parse(cleaned);
    } catch (e2) {
      return null;
    }
  }
}

/**
 * Generate Local Feedback (Deterministic Fallback)
 */
function generateLocalFeedback(domain, finalState, mistakes, behavioralSignals, liveTrackingSummary = {}) {
  const expType = finalState.experimentType || domain;
  const isCorrect = mistakes.length === 0;
  
  let score = 100 - (mistakes.length * 25);
  if (behavioralSignals.length > 0 && score > 60) {
    score -= 5;
  }
  score = Math.max(20, Math.min(100, score));

  const what_went_wrong = mistakes.map(m => {
    let why = 'Procedure step was deviated from during the simulation.';
    let fix = 'Review the pre-lab experiment guide before attempting again.';

    if (m.type === 'overshoot') {
      why = 'Titrant solution was added too quickly near the equivalence point.';
      fix = 'Add titrant drop-by-drop as color begins to linger in the solution.';
    } else if (m.type === 'undershoot') {
      why = 'Titration stopped before complete neutralization of acid.';
      fix = 'Continue adding titrant until permanent faint pink color persists.';
    } else if (m.type === 'wrong_order') {
      why = 'Indicator dye was omitted before adding titrant.';
      fix = 'Add 2-3 drops of Phenolphthalein indicator to flask BEFORE titrating.';
    } else if (m.type === 'open_circuit') {
      why = 'Electrical path is broken by a missing wire or open switch.';
      fix = 'Ensure all components form a continuous loop back to the power supply.';
    } else if (m.type === 'wrong_polarity') {
      why = 'Direct current components require correct positive to negative alignment.';
      fix = 'Flip battery connections so current flows anode to cathode.';
    } else if (m.type === 'measurement_error') {
      why = 'Timer was started or stopped out of sync with pendulum oscillations.';
      fix = 'Count 10 complete back-and-forth swings before stopping stopwatch.';
    }

    return {
      issue: m.detail,
      why_it_happened: why,
      how_to_fix: fix,
    };
  });

  const what_went_right = [];
  if (isCorrect) {
    what_went_right.push(`Successfully completed the ${expType} procedure with accurate readings.`);
    what_went_right.push('Followed lab safety and equipment protocol.');
  } else {
    if (finalState.flaskPlaced || finalState.circuitBuilt || finalState.released) {
      what_went_right.push('Correctly set up initial apparatus and equipment on workbench.');
    }
    what_went_right.push('Actively engaged with measurement tools in the 3D lab environment.');
  }

  let summary = isCorrect
    ? `Excellent work! You completed the ${expType} experiment accurately with high precision and proper procedural flow.`
    : `You completed the ${expType} experiment and collected observations. A few procedural adjustments will help achieve optimal results.`;

  if (behavioralSignals.some(s => s.type === 'slow_hesitant')) {
    summary += ' Great job taking your time to analyze each step carefully!';
  }

  const recommendation = isCorrect
    ? 'Proceed to the next advanced laboratory experiment or challenge yourself in viva mode.'
    : 'Review the identified step details above and try one more trial run.';

  const encouragement = isCorrect
    ? 'Outstanding scientific precision — keep up the great work!'
    : 'Mistakes are an essential part of discovery. Practice makes perfect in the lab!';

  // Live tracking grounded observations
  const feedback = [];
  if (liveTrackingSummary.wrongReadings && liveTrackingSummary.wrongReadings.length > 0) {
    liveTrackingSummary.wrongReadings.forEach((r) => {
      feedback.push(`Recorded ${r.entered} for ${r.label} (expected ${r.correct}).`);
    });
  }
  if (liveTrackingSummary.wrongMixes && liveTrackingSummary.wrongMixes.length > 0) {
    liveTrackingSummary.wrongMixes.forEach((m) => {
      feedback.push(`Order attempt: ${m.entered || 'incorrect sequence'} (expected: ${m.expected}).`);
    });
  }
  if (liveTrackingSummary.retryCount > 0) {
    feedback.push(`Retried or reset procedure steps ${liveTrackingSummary.retryCount} time(s).`);
  }
  if (feedback.length === 0) {
    feedback.push(`Executed all ${liveTrackingSummary.totalSteps || 'procedural'} steps smoothly without incorrect entries.`);
  }

  // Actionable Improvement Suggestions
  const improvement_suggestions = [];
  if (mistakes.some(m => m.type === 'overshoot')) {
    improvement_suggestions.push('Add titrant drop-by-drop as color begins lingering to pinpoint the exact equivalence point.');
  }
  if (mistakes.some(m => m.type === 'wrong_order')) {
    improvement_suggestions.push('Verify indicator dye is added to the unknown solution before opening the burette stopcock.');
  }
  if (mistakes.some(m => m.type === 'measurement_error')) {
    improvement_suggestions.push('Count at least 10-20 oscillations and divide total time by the swing count for accurate period timing.');
  }
  if (improvement_suggestions.length === 0) {
    improvement_suggestions.push('Challenge yourself by trying another advanced virtual lab module or conducting a trial run in Viva mode.');
  }

  const confidence_note = liveTrackingSummary.seemsUnsure
    ? 'We noticed you paused or retried a few steps — taking your time to verify steps is a great habit in physics and chemistry labs!'
    : null;

  return {
    score,
    summary,
    what_went_wrong,
    what_went_right,
    recommendation,
    encouragement,
    feedback,
    improvement_suggestions,
    confidence_note,
    domain,
    mistakes,
    behavioralSignals,
    liveTrackingSummary,
  };
}
