/**
 * AI Report Generator — OpenRouter LLM Integration
 * Calls a real LLM via OpenRouter API to generate experiment assessments.
 * Falls back to smart local generation if the API call fails.
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-lite-001';

/**
 * Build the prompt for the LLM following the spec's template.
 */
function buildPrompt(domain, finalState) {
  const expType = finalState.experimentType || (domain === 'chemistry' ? 'titration' : 'circuit');

  const goalMap = {
    'titration': 'Perform an acid-base titration to determine the equivalence point by adding titrant to a flask containing an unknown solution with phenolphthalein indicator.',
    'flame-test': 'Hold a metal salt sample over a Bunsen burner flame, observe the characteristic flame color, and correctly identify the metal ion.',
    'ph-test': 'Dip a pH indicator strip into an unknown solution, observe the color change, and determine the pH value using the color chart.',
    'precipitation': 'Mix two clear ionic solutions (AgNO₃ + NaCl) and observe the formation of an insoluble precipitate (AgCl).',
    'iodine-clock': 'Mix reagents for an iodine clock reaction and time the sudden color change from clear to deep blue-black.',
    'salt-prep': 'Neutralize acid with base, evaporate the solution over heat, and collect crystallized salt crystals.',
    'electrolysis': 'Pass electric current through water to split it into Hydrogen and Oxygen gas at the cathode and anode.',
    'distillation': 'Heat a liquid mixture, evaporate the volatile component, condense the vapors in the Liebig condenser, and collect pure distillate.',
    'circuit': 'Build a complete series circuit on a breadboard with a battery, resistor, LED, and switch, then verify it works using Ohm\'s Law.',
    'ohms-law': 'Vary the voltage across a resistor, measure current using an ammeter, and verify Ohm\'s Law (V = IR) by plotting V vs I.',
    'pendulum': 'Release a simple pendulum from a known angle, measure the period of 10 oscillations, and compare to the theoretical formula T = 2π√(L/g).',
    'projectile': 'Launch a projectile at a given angle and initial velocity, tracing its parabolic arc to verify kinematics equations.',
    'refraction': 'Pass a laser ray beam through a glass block at various incident angles to measure the angle of refraction and verify Snell\'s Law (n₁ sin θ₁ = n₂ sin θ₂).',
    'induction': 'Move a bar magnet through a solenoid coil to induce an electromotive force (EMF) and observe galvanometer deflection verifying Faraday\'s Law.',
  };

  const expectedMap = {
    'titration': `Equivalence volume: ${finalState.equivalenceVolume || 25.0} mL. The student should add titrant carefully and mark the endpoint when the indicator changes color (clear → pink).`,
    'flame-test': `Sample: ${finalState.sampleTested}. Expected color: ${finalState.colorObserved}. Student guess: ${finalState.studentGuess}. Correct: ${finalState.correct}.`,
    'ph-test': `Solution: ${finalState.solutionId}. Actual pH: ${finalState.actualPH}. Student guess: ${finalState.studentGuess}. Correct: ${finalState.correct}.`,
    'precipitation': `Reactants: AgNO₃ + NaCl → AgCl (white precipitate) + NaNO₃. Precipitate formed: ${finalState.precipitateFormed}.`,
    'iodine-clock': `Actual reaction time: ${finalState.actualReactionTime}s. Student stopped at: ${finalState.studentStopTime}s. Time difference: ${finalState.deltaSeconds}s.`,
    'salt-prep': `Neutralized acid and base, evaporated water, collected salt crystals: ${finalState.saltCollected}.`,
    'electrolysis': `Decomposed water into H₂ and O₂ gases in 2:1 volume ratio. Electrified: ${finalState.electrolysisActive}.`,
    'distillation': `Distilled liquid mixture into pure distillate fractions. Distillation complete: ${finalState.distillationComplete}.`,
    'circuit': `A closed series circuit: Battery (${finalState.voltage || 9}V) → Wire → Resistor (${finalState.resistance || 220}Ω) → LED → Switch. Expected current: ${((finalState.voltage || 9) / (finalState.resistance || 220) * 1000).toFixed(1)} mA.`,
    'ohms-law': `Target resistance: ${finalState.expectedResistance}Ω. Computed resistance from readings: ${finalState.resistanceComputed}Ω. Accuracy: ${finalState.accuracy}%.`,
    'pendulum': `Length: ${finalState.length}m. Theoretical period: ${finalState.calculatedPeriod}s. Measured period: ${finalState.measuredPeriod}s. Percent error: ${finalState.percentError}%.`,
    'projectile': `Angle: ${finalState.angle}°, Velocity: ${finalState.velocity} m/s. Range: ${finalState.range}m, Max Height: ${finalState.maxHeight}m.`,
    'refraction': `Incident angle: ${finalState.incidentAngle}°. Refracted angle: ${finalState.refractedAngle}°. Refractive index n: ${finalState.n1}.`,
    'induction': `Deflection: ${finalState.deflection}°. Verification: ${finalState.inductionVerified}.`,
  };

  return `You are a lab instructor evaluating a student's virtual experiment.

Domain: ${domain} (${expType})
Experiment goal: ${goalMap[expType] || 'Perform science experiment'}
Final experiment data: ${JSON.stringify(finalState, null, 2)}
Expected/target outcome: ${expectedMap[expType] || 'Successful completion'}

Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO backticks — just raw JSON:
{
  "correct": boolean,
  "score": number (0-100),
  "summary": string (2-3 sentences evaluating the student's performance),
  "strengths": string[] (2-4 specific things the student did well),
  "improvements": string[] (2-4 specific suggestions for improvement),
  "concept_explanation": string (explain the underlying science concept simply in 2-3 sentences),
  "next_suggested_experiment": string (suggest a follow-up experiment)
}`;
}

/**
 * Call OpenRouter API with the structured prompt.
 */
async function callLLM(domain, finalState) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'VirtuLab Virtual Laboratory',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a precise lab instructor AI. Always respond with ONLY valid JSON. No markdown, no code blocks, no explanatory text outside the JSON.',
        },
        {
          role: 'user',
          content: buildPrompt(domain, finalState),
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from LLM');
  }

  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  const report = JSON.parse(jsonStr);

  if (typeof report.score !== 'number' || !report.summary) {
    throw new Error('LLM response missing required fields');
  }

  report.domain = domain;
  return report;
}

/**
 * Main entry point — tries LLM first, falls back to local generation.
 */
export async function generateReport(domain, finalState) {
  if (OPENROUTER_API_KEY) {
    try {
      console.log(`🤖 Calling OpenRouter LLM (${MODEL}) for ${domain} report...`);
      const report = await callLLM(domain, finalState);
      console.log('✅ LLM report generated successfully:', report);
      return report;
    } catch (err) {
      console.warn('⚠️ LLM call failed, falling back to local generation:', err.message);
    }
  } else {
    console.log('ℹ️ No OpenRouter API key found, using local report generation');
  }

  // Fallback to local generation based on experiment type
  const expType = finalState.experimentType;

  if (expType === 'flame-test') return generateFlameTestReportLocal(finalState);
  if (expType === 'ph-test') return generatePHTestReportLocal(finalState);
  if (expType === 'precipitation') return generatePrecipitationReportLocal(finalState);
  if (expType === 'iodine-clock') return generateIodineClockReportLocal(finalState);
  if (expType === 'salt-prep') return generateSaltPrepReportLocal(finalState);
  if (expType === 'electrolysis') return generateElectrolysisReportLocal(finalState);
  if (expType === 'distillation') return generateDistillationReportLocal(finalState);
  if (expType === 'circuit') return generateCircuitReportLocal(finalState);
  if (expType === 'ohms-law') return generateOhmsLawReportLocal(finalState);
  if (expType === 'pendulum') return generatePendulumReportLocal(finalState);
  if (expType === 'projectile') return generateProjectileReportLocal(finalState);
  if (expType === 'refraction') return generateRefractionReportLocal(finalState);
  if (expType === 'induction') return generateInductionReportLocal(finalState);

  if (domain === 'chemistry') {
    return generateChemistryReportLocal(finalState);
  } else if (domain === 'physics') {
    return generatePhysicsReportLocal(finalState);
  }
  throw new Error(`Unknown domain: ${domain}`);
}

// ── Local fallback generators ──────────────────────────────

function generateFlameTestReportLocal(state) {
  const { sampleTested, colorObserved, studentGuess, correct } = state;
  const score = correct ? 100 : 40;
  return {
    correct,
    score,
    summary: correct
      ? `The student correctly identified the ${sampleTested} sample based on its characteristic ${colorObserved} flame color.`
      : `The student misidentified the ${sampleTested} sample (observed ${colorObserved} flame) as ${studentGuess}.`,
    strengths: [
      'Successfully performed the flame test procedure',
      'Observed the flame color emission',
    ],
    improvements: correct
      ? ['Try testing potassium (K) or lithium (Li) samples to observe distinct spectral lines']
      : [`Review flame color emission spectra for alkali and alkaline earth metals (Na=yellow, Cu=green, K=lilac)`],
    concept_explanation: 'When metal salts are heated in a flame, thermal energy excites valence electrons to higher energy levels. As electrons return to ground state, they emit light of specific wavelengths characteristic of each element.',
    next_suggested_experiment: 'Perform atomic emission spectroscopy to analyze spectral line wavelengths quantitatively.',
    domain: 'chemistry',
  };
}

function generatePHTestReportLocal(state) {
  const { solutionId, actualPH, studentGuess, correct } = state;
  const score = correct ? 95 : Math.max(20, 100 - Math.abs(studentGuess - actualPH) * 20);
  return {
    correct,
    score,
    summary: correct
      ? `The student accurately measured the pH of ${solutionId} as ${studentGuess} (actual pH: ${actualPH}).`
      : `The student estimated pH ${studentGuess} for ${solutionId}, whereas the actual pH is ${actualPH}.`,
    strengths: ['Dipped indicator strip correctly into solution', 'Compared strip color against the reference chart'],
    improvements: correct
      ? ['Try using a digital pH meter for higher precision']
      : ['Observe subtle hue changes on the universal indicator chart near neutral vs acidic regions'],
    concept_explanation: 'pH measures the hydrogen ion concentration [H⁺] on a logarithmic scale (pH = -log[H⁺]). Universal indicator contains dyes that change color across pH 1 (strongly acidic, red) to 14 (strongly alkaline, purple).',
    next_suggested_experiment: 'Measure pH changes during a neutralization titration using a pH meter.',
    domain: 'chemistry',
  };
}

function generatePrecipitationReportLocal(state) {
  const { precipitateFormed } = state;
  return {
    correct: precipitateFormed,
    score: precipitateFormed ? 100 : 30,
    summary: precipitateFormed
      ? 'The student successfully mixed silver nitrate (AgNO₃) and sodium chloride (NaCl) to form an insoluble white precipitate of silver chloride (AgCl).'
      : 'The precipitation reaction was incomplete or not performed correctly.',
    strengths: ['Mixed both ionic solutions in proper order', 'Observed precipitate formation'],
    improvements: ['Write balanced net ionic equations for the precipitation reaction'],
    concept_explanation: 'A precipitation reaction occurs when two soluble ionic compounds in aqueous solution react to form an insoluble solid (precipitate). Here, Ag⁺(aq) + Cl⁻(aq) → AgCl(s).',
    next_suggested_experiment: 'Filter and weigh the precipitate to perform gravimetric stoichiometry analysis.',
    domain: 'chemistry',
  };
}

function generateIodineClockReportLocal(state) {
  const { actualReactionTime, studentStopTime, deltaSeconds } = state;
  const delta = parseFloat(deltaSeconds) || 0;
  const correct = delta <= 1.5;
  const score = Math.round(Math.max(10, 100 - delta * 25));
  return {
    correct,
    score,
    summary: correct
      ? `Outstanding reaction timing! Student stopped timer within ${delta}s of the actual reaction time (${actualReactionTime}s).`
      : `Student stopped timer ${delta}s off from the actual reaction time (${actualReactionTime}s).`,
    strengths: ['Successfully mixed reactants to initiate reaction', 'Observed color change transition'],
    improvements: delta > 1.5 ? ['Focus on the beaker continuously to catch the instant color flip'] : ['Vary temperature or concentration to measure activation energy'],
    concept_explanation: 'In an iodine clock reaction, iodide ions react slowly with persulfate to form iodine, which is immediately consumed by thiosulfate. Once thiosulfate is depleted, free iodine reacts instantly with starch turning deep blue-black.',
    next_suggested_experiment: 'Investigate how concentration and temperature affect the reaction rate (Arrehenius equation).',
    domain: 'chemistry',
  };
}

function generateOhmsLawReportLocal(state) {
  const { resistanceComputed, expectedResistance, accuracy } = state;
  const acc = parseFloat(accuracy) || 100;
  const score = Math.min(100, Math.max(85, Math.round(acc)));
  const count = state.readings?.length || 3;
  return {
    correct: true,
    score,
    summary: `Outstanding V-I plot analysis! The student collected ${count} voltage-current data points, obtaining an experimental resistance of ${resistanceComputed || 100}Ω (target: ${expectedResistance || 100}Ω, accuracy: ${acc.toFixed(1)}%).`,
    strengths: [
      'Plotted V vs I linear relationship verifying V = IR',
      'Calculated slope of V-I graph to determine electrical resistance R',
      'Observed constant ratio of voltage to current across ohmic resistor',
    ],
    improvements: [
      'Compare ohmic resistor behavior with non-ohmic components like filament lamps and diodes',
    ],
    concept_explanation: 'Ohm\'s Law states that current (I) is directly proportional to voltage (V) across an ohmic conductor: V = IR. The slope of the V vs I line represents the resistance R.',
    next_suggested_experiment: 'Plot V vs I for a semiconductor diode to observe non-ohmic I-V characteristics.',
    domain: 'physics',
  };
}

function generatePendulumReportLocal(state) {
  const { length, measuredPeriod, calculatedPeriod, percentError } = state;
  const err = parseFloat(percentError) || 0;
  const correct = err <= 10;
  const score = Math.round(Math.max(10, 100 - err * 3));
  return {
    correct,
    score,
    summary: `The student measured a period of ${measuredPeriod}s for a ${length}m pendulum (theoretical T = ${calculatedPeriod}s, error: ${percentError}%).`,
    strengths: ['Timed 10 full oscillations to reduce timing error', 'Correctly calculated the average period'],
    improvements: err > 10 ? ['Ensure timing begins and ends precisely at maximum displacement amplitude'] : ['Vary pendulum length L to verify T ∝ √L'],
    concept_explanation: 'For small amplitudes, simple pendulum period is T = 2π√(L/g), independent of mass and amplitude. Period depends solely on length L and gravitational acceleration g.',
    next_suggested_experiment: 'Measure pendulum period at different initial release angles to test small-angle approximation boundaries.',
    domain: 'physics',
  };
}

function generateSaltPrepReportLocal(state) {
  const isDone = !!(state.saltCollected || state.heated || state.crystalsFormed);
  return {
    correct: isDone,
    score: isDone ? 100 : 50,
    summary: isDone
      ? 'Outstanding performance! The student successfully neutralized hydrochloric acid with sodium hydroxide, evaporated water over Bunsen heat, and collected pure NaCl salt crystals.'
      : 'The student neutralized the acid-base solution and heated the mixture.',
    strengths: ['Mixed stoichiometric quantities of acid and base', 'Evaporated solvent over Bunsen burner to crystallize solute'],
    improvements: isDone
      ? ['Allow crystals to cool slowly for larger crystal lattice formation']
      : ['Turn ON the Bunsen burner to evaporate liquid and crystallize salt'],
    concept_explanation: 'Neutralization reaction: HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l). Evaporating water leaves pure sodium chloride salt crystals.',
    next_suggested_experiment: 'Perform recrystallization to purify impure copper sulfate salt samples.',
    domain: 'chemistry',
  };
}

function generateElectrolysisReportLocal(state) {
  const isDone = !!(state.powerOn || state.electrolysisActive);
  return {
    correct: isDone,
    score: isDone ? 100 : 50,
    summary: isDone
      ? 'Outstanding performance! The student successfully applied 12V DC potential to water, observing rapid Hydrogen gas evolution at the Cathode (20.0 mL) and Oxygen gas at the Anode (10.0 mL) in a precise 2:1 stoichiometric ratio.'
      : 'The student set up the electrolysis apparatus.',
    strengths: [
      'Correctly connected cathode (-) and anode (+) electrodes to 12V DC power',
      'Verified 2:1 gas volume displacement ratio (2H₂ : 1O₂)',
      'Observed reduction at cathode and oxidation at anode',
    ],
    improvements: isDone
      ? ['Vary voltage supply to test Faraday\'s Laws of Electrolysis quantitatively']
      : ['Turn ON the 12V DC power supply to initiate gas bubble evolution'],
    concept_explanation: 'Electrolysis of water: 2H₂O(l) → 2H₂(g) + O₂(g). Two moles of Hydrogen gas evolve at the cathode for every one mole of Oxygen gas at the anode.',
    next_suggested_experiment: 'Perform electroplating of copper onto a steel key.',
    domain: 'chemistry',
  };
}

function generateDistillationReportLocal(state) {
  const isDone = !!(state.distillationComplete || state.heating || state.distillateVolume);
  return {
    correct: isDone,
    score: isDone ? 100 : 50,
    summary: isDone
      ? 'Outstanding performance! The student successfully heated the liquid mixture, vaporized the lower boiling component, condensed vapors in the Liebig condenser, and collected 50.0 mL of pure distillate.'
      : 'The student initiated the distillation apparatus setup.',
    strengths: ['Monitored vapor boiling point temperature', 'Ensured cooling water flow through Liebig condenser jacket', 'Collected purified liquid distillate in receiving flask'],
    improvements: isDone
      ? ['Add anti-bumping granules to ensure smooth boiling without boiling spurts']
      : ['Turn ON the heating mantle to begin liquid vaporization and condensation'],
    concept_explanation: 'Distillation separates liquid mixtures based on differences in boiling points. The lower boiling component vaporizes first and condenses back to liquid in the condenser.',
    next_suggested_experiment: 'Perform fractional distillation on ethanol-water solution.',
    domain: 'chemistry',
  };
}

function generateProjectileReportLocal(state) {
  const isDone = !!(state.launched || (state.readings && state.readings.length > 0) || state.maxDistance > 0);
  const count = state.readings?.length || 3;
  return {
    correct: isDone,
    score: isDone ? 100 : 50,
    summary: isDone
      ? `Outstanding trajectory analysis! The student collected ${count} projectile trajectory readings across varying angles and velocities, verifying R_max = (v₀² sin 2θ)/g.`
      : 'The student set up the projectile cannon.',
    strengths: [
      'Decomposed initial velocity v₀ into horizontal (v₀ cos θ) and vertical (v₀ sin θ) components',
      'Verified 45° launch angle yields maximum range R_max',
      'Recorded trajectory peak height h_max and flight time t_flight',
    ],
    improvements: isDone
      ? ['Incorporate air drag quadratic resistance to observe trajectory asymmetry']
      : ['Adjust angle and velocity controls and click Launch Cannon to record trajectory readings'],
    concept_explanation: 'Projectile motion under gravity follows a parabolic trajectory: x = (v₀ cos θ)t, y = (v₀ sin θ)t - ½gt². Maximum horizontal range occurs at θ = 45°.',
    next_suggested_experiment: 'Incorporate air drag resistance and analyze non-parabolic trajectories.',
    domain: 'physics',
  };
}

function generateRefractionReportLocal(state) {
  const { incidentAngle, refractedAngleComputed, refractiveIndex } = state;
  const count = state.readings?.length || 3;
  return {
    correct: true,
    score: 100,
    summary: `Outstanding optical experiment! The student directed laser beams at multiple incident angles (θ₁=${incidentAngle}), verifying Snell's Law (n₁ sin θ₁ = n₂ sin θ₂) with refractive index n = ${refractiveIndex || 1.5}.`,
    strengths: [
      'Verified Snell\'s Law: n₁ sin θ₁ = n₂ sin θ₂ across multiple incident angles',
      'Observed light bending towards normal when entering denser medium (glass n=1.5)',
      'Observed partial reflection beam at boundary interface and emergent ray exiting glass',
    ],
    improvements: ['Increase incident angle beyond critical angle to observe Total Internal Reflection (TIR)'],
    concept_explanation: 'Refraction occurs because light speed changes when passing between media of different optical densities: n₁ sin θ₁ = n₂ sin θ₂. At boundaries, partial reflection also occurs.',
    next_suggested_experiment: 'Determine the critical angle θc = arcsin(1/n) for total internal reflection in acrylic glass.',
    domain: 'physics',
  };
}

function generateInductionReportLocal(state) {
  const isDone = !!(state.faradaysLawVerified || state.deflection !== 0 || (state.readings && state.readings.length > 0));
  const count = state.readings?.length || 3;
  return {
    correct: isDone,
    score: isDone ? 100 : 50,
    summary: isDone
      ? `Outstanding electromagnetic analysis! The student collected ${count} induction readings, verifying Faraday's Law (ε = -N dΦ/dt) and Lenz's Law across varying magnet thrust speeds.`
      : 'The student moved a bar magnet relative to a solenoid coil.',
    strengths: [
      'Verified Faraday\'s Law of Electromagnetic Induction: induced EMF ε ∝ dΦ/dt',
      'Observed polarity reversal of induced current when plunging IN vs pulling OUT (Lenz\'s Law)',
      'Recorded live galvanometer current readouts across slow, medium, and fast thrust speeds',
    ],
    improvements: isDone
      ? ['Vary coil turns count N to quantitatively test ε = -N (dΦ/dt)']
      : ['Push or pull the bar magnet through the solenoid coil to induce electric current'],
    concept_explanation: 'Faraday\'s Law states that induced EMF is directly proportional to the rate of change of magnetic flux: ε = -N (dΦ/dt). Lenz\'s Law dictates that induced current flows in a direction opposing the flux change.',
    next_suggested_experiment: 'Test coils with varying numbers of turns N to verify ε ∝ N.',
    domain: 'physics',
  };
}

function generateChemistryReportLocal(state) {
  const volumeAdded = state.volumeAdded ?? 25;
  const equivalenceVolume = state.equivalenceVolume ?? 25;
  const startTime = state.startTime || Date.now();
  const overshoot = state.overshoot || false;
  const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
  const accuracy = Math.max(0, 100 - Math.abs(volumeAdded - equivalenceVolume) * 8);
  const score = Math.round(Math.min(100, accuracy));
  const diff = Math.abs(volumeAdded - equivalenceVolume);
  const correct = diff <= 2.0;

  const strengths = [];
  const improvements = [];

  if (diff <= 1.0) strengths.push('Excellent precision in identifying the equivalence point');
  if (diff <= 2.0) strengths.push('Titrant was added in controlled increments');
  if (timeTaken > 30) strengths.push('Took adequate time to observe color changes carefully');
  if (!overshoot) strengths.push('Avoided overshooting the endpoint');

  if (diff > 2.0) improvements.push(`Endpoint was ${diff.toFixed(1)} mL off from the equivalence volume — practice observing subtle color transitions`);
  if (diff > 5.0) improvements.push('Consider adding titrant in smaller increments near the expected endpoint');
  if (timeTaken < 15) improvements.push('Experiment was completed very quickly — take more time to observe indicator color changes');
  if (overshoot) improvements.push('The equivalence point was overshot — add titrant dropwise near the endpoint');

  if (strengths.length === 0) strengths.push('Completed the experiment procedure');
  if (improvements.length === 0) improvements.push('Try varying the acid concentration and predict the new equivalence volume');

  const summary = correct
    ? `The student successfully identified the equivalence point within acceptable error (${diff.toFixed(1)} mL deviation). The experiment was completed in ${timeTaken} seconds.`
    : `The student's endpoint (${volumeAdded.toFixed(1)} mL) deviated ${diff.toFixed(1)} mL from the actual equivalence volume (${equivalenceVolume.toFixed(1)} mL). The experiment was completed in ${timeTaken} seconds.`;

  return {
    correct,
    score,
    summary,
    strengths,
    improvements,
    concept_explanation: 'Acid-base titration determines the concentration of an unknown solution by reacting it with a solution of known concentration (the titrant). The equivalence point is reached when moles of acid equal moles of base. An indicator such as phenolphthalein changes color at this point, signaling neutralization is complete.',
    next_suggested_experiment: 'Try a strong acid–weak base titration using methyl orange indicator and observe how the pH curve differs.',
    domain: 'chemistry',
  };
}

function generatePhysicsReportLocal(state) {
  const { componentsPlaced, circuitClosed, current, voltage, resistance, switchOn } = state;
  const allPlaced = componentsPlaced && componentsPlaced.length >= 4;
  const correct = circuitClosed && current > 0;

  let score = 0;
  if (allPlaced) score += 40;
  if (circuitClosed) score += 30;
  if (correct) score += 20;
  if (switchOn) score += 10;
  score = Math.min(100, score);

  const strengths = [];
  const improvements = [];

  if (allPlaced) strengths.push('All required components were placed on the breadboard');
  if (circuitClosed) strengths.push('Circuit was correctly completed forming a closed loop');
  if (correct) strengths.push(`Successfully calculated current: I = V/R = ${voltage}/${resistance} = ${(current * 1000).toFixed(1)} mA`);

  if (!allPlaced) improvements.push('Not all components were placed — ensure battery, resistor, LED, and switch are all on the breadboard');
  if (!circuitClosed) improvements.push('The circuit was not closed — check that all components are connected in series');
  if (!switchOn) improvements.push('Remember to close the switch to complete the circuit');

  if (strengths.length === 0) strengths.push('Attempted the circuit building exercise');
  if (improvements.length === 0) improvements.push('Try adding a second resistor in parallel and predict how the total current changes');

  const summary = correct
    ? `The student successfully built a series circuit with a ${voltage}V battery, ${resistance}Ω resistor, and LED. The circuit drew ${(current * 1000).toFixed(1)} mA when the switch was closed, correctly illuminating the LED.`
    : `The student attempted to build a series circuit but ${!allPlaced ? 'did not place all components' : 'the circuit was not properly closed'}. Review the connection sequence: battery → wire → resistor → LED → switch → battery.`;

  return {
    correct,
    score,
    summary,
    strengths,
    improvements,
    concept_explanation: `Ohm's Law states V = IR, where V is voltage (in volts), I is current (in amperes), and R is resistance (in ohms). In a series circuit, the same current flows through every component. With a ${voltage}V battery and ${resistance}Ω resistor, the current is ${(voltage / resistance * 1000).toFixed(1)} mA.`,
    next_suggested_experiment: 'Build a parallel circuit with two LEDs and observe how brightness changes compared to the series configuration.',
    domain: 'physics',
  };
}
