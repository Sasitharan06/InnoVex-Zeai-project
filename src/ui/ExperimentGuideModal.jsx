import React, { useState } from 'react';
import useGameStore from '../store/gameStore';
import {
  BookOpen, Calculator, ShieldCheck, Play, X, Sparkles,
  FlaskConical, Zap, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';

const GUIDE_DATA = {
  'titration': {
    title: 'Acid-Base Titration',
    domain: 'Chemistry',
    color: '#06b6d4',
    icon: '🧪',
    overview: 'Determine the unknown concentration of an acid (HCl) by titrating with a standard base (NaOH) of known concentration using phenolphthalein indicator.',
    steps: [
      'Pick up the conical flask from the bench.',
      'Place the flask directly under the burette outlet.',
      'Add phenolphthalein indicator bottle to the flask (solution remains clear).',
      'Press E on the burette to add titrant (NaOH) in 0.5 mL increments.',
      'Observe the flask liquid color change from clear to persistent light pink.',
      'Click "Mark Endpoint ✓" to record volume and generate AI analysis.',
    ],
    formulaTitle: 'Neutralization & Molarity Equations',
    formulas: [
      { label: 'Moles Neutralization', eq: 'M_a \\times V_a = M_b \\times V_b' },
      { label: 'Unknown Concentration', eq: 'M_a = \\frac{M_b \\times V_b}{V_a}' },
      { label: 'Titrant Volume Used', eq: 'V_{\\text{titrant}} = V_{\\text{final}} - V_{\\text{initial}}' },
    ],
    calculationExample: 'If 25.0 mL of 0.1 M NaOH neutralizes 25.0 mL of HCl, then M_HCl = (0.1 × 25.0) / 25.0 = 0.1 M.',
    concept: 'At the equivalence point, moles of H⁺ ions equal moles of OH⁻ ions. Phenolphthalein turns pink at pH ~8.2–10.',
    safety: 'Wear protective goggles & gloves. Handle NaOH and HCl with care to prevent chemical burns.',
  },

  'flame-test': {
    title: 'Flame Test',
    domain: 'Chemistry',
    color: '#f97316',
    icon: '🔥',
    overview: 'Identify metal cations (Na, Cu, K, Ca, Li) by observing the characteristic colors emitted when their salt samples are heated in a Bunsen burner flame.',
    steps: [
      'Pick up a metal salt sample dish from the tray (Na, Cu, K, Ca, Li).',
      'Approach the Bunsen burner with the sample loop.',
      'Press E to hold the sample over the flame.',
      'Observe the flame color change (Sodium=Yellow, Copper=Green, Potassium=Lilac, Calcium=Orange-Red, Lithium=Crimson).',
      'Select your metal identification guess on the HUD buttons.',
      'Click "Submit Flame Test ✓" for AI evaluation.',
    ],
    formulaTitle: 'Atomic Emission & Photon Energy',
    formulas: [
      { label: 'Photon Energy', eq: 'E = h \\cdot \\nu = \\frac{h \\cdot c}{\\lambda}' },
      { label: 'Rydberg Energy Shift', eq: '\\Delta E = E_{\\text{excited}} - E_{\\text{ground}}' },
    ],
    calculationExample: 'Sodium emits light at λ = 589 nm (yellow). Photon energy E = (6.626×10⁻³⁴ × 3×10⁸) / (589×10⁻⁹) = 3.37 × 10⁻¹⁹ J.',
    concept: 'Thermal energy excites valence electrons to higher energy levels. When returning to ground state, characteristic photons are emitted.',
    safety: 'Keep flammable materials away from Bunsen burner. Tie back long hair and use nichrome wire loops.',
  },

  'ph-test': {
    title: 'pH Testing with Universal Indicator',
    domain: 'Chemistry',
    color: '#10b981',
    icon: '💧',
    overview: 'Measure the hydrogen ion concentration [H⁺] of various laboratory solutions using universal indicator strips and compare against the color chart.',
    steps: [
      'Pick up a universal indicator paper strip from the bench.',
      'Approach one of the color-coded test tubes (HCl, Vinegar, Water, NaOH).',
      'Press E to dip the strip into the test tube.',
      'Watch the paper change color based on solution acidity/alkalinity.',
      'Compare the strip color against the 14-point pH reference chart on the wall.',
      'Select your estimated pH value on the HUD and click Submit.',
    ],
    formulaTitle: 'Logarithmic pH Equations',
    formulas: [
      { label: 'pH Definition', eq: '\\text{pH} = -\\log_{10}[\\text{H}^+]' },
      { label: 'Hydrogen Ion Concentration', eq: '[\\text{H}^+] = 10^{-\\text{pH}} \\text{ M}' },
      { label: 'Water Dissociation Constant', eq: '\\text{pH} + \\text{pOH} = 14' },
    ],
    calculationExample: 'For 0.1 M HCl, [H⁺] = 10⁻¹ M ⟹ pH = -log₁₀(0.1) = 1.0 (strongly acidic, red color).',
    concept: 'Universal indicator is a mixture of dyes (thymol blue, methyl red, bromothymol blue) displaying a continuous spectrum from pH 1 to 14.',
    safety: 'Do not touch indicator strips directly with bare hands after dipping. Neutralize strong acids/bases before disposal.',
  },

  'precipitation': {
    title: 'Precipitation Reaction',
    domain: 'Chemistry',
    color: '#8b5cf6',
    icon: '⚗️',
    overview: 'Mix two soluble ionic solutions (Silver Nitrate AgNO₃ + Sodium Chloride NaCl) to form an insoluble solid precipitate (Silver Chloride AgCl).',
    steps: [
      'Pick up Beaker A containing clear AgNO₃ solution and pour into the mixing beaker.',
      'Pick up Beaker B containing clear NaCl solution and pour into the mixing beaker.',
      'Watch the liquid transform into a cloudy white suspension as AgCl precipitate forms.',
      'Observe settling of insoluble solid particles at the bottom of the beaker.',
      'Click "Submit Precipitation Result ✓" for AI technique verification.',
    ],
    formulaTitle: 'Double Displacement & Net Ionic Equations',
    formulas: [
      { label: 'Molecular Equation', eq: '\\text{AgNO}_3(aq) + \\text{NaCl}(aq) \\rightarrow \\text{AgCl}(s)\\downarrow + \\text{NaNO}_3(aq)' },
      { label: 'Net Ionic Equation', eq: '\\text{Ag}^+(aq) + \\text{Cl}^-(aq) \\rightarrow \\text{AgCl}(s)\\downarrow' },
      { label: 'Solubility Product', eq: 'K_{sp} = [\\text{Ag}^+][\\text{Cl}^-] = 1.77 \\times 10^{-10}' },
    ],
    calculationExample: 'When [Ag⁺][Cl⁻] > K_sp, precipitation occurs immediately, producing white AgCl crystals.',
    concept: 'Precipitation occurs when ionic concentration product exceeds the solubility product K_sp of the compound in water.',
    safety: 'Silver nitrate stains skin and clothing black upon light exposure. Wash hands thoroughly if contact occurs.',
  },

  'iodine-clock': {
    title: 'Iodine Clock Reaction',
    domain: 'Chemistry',
    color: '#ec4899',
    icon: '⏱️',
    overview: 'Investigate chemical reaction kinetics by mixing potassium iodate and sodium bisulfite with starch, measuring the precise time until an instant blue-black color flip occurs.',
    steps: [
      'Pour Reagent A (KIO₃ solution) into the central reaction beaker.',
      'Pour Reagent B (NaHSO₃ + starch solution) into the beaker — timer starts automatically.',
      'Keep your gaze focused on the liquid while the solution remains completely clear.',
      'At a random reaction time (8–15s), the liquid instantly flips to deep blue-black.',
      'Press "Stop Timer!" immediately the moment you see the color flip.',
      'Click Submit to evaluate your reaction timing accuracy (Δt).',
    ],
    formulaTitle: 'Reaction Kinetics & Initial Rate Equations',
    formulas: [
      { label: 'Primary Redox Step', eq: '\\text{IO}_3^- + 3\\text{HSO}_3^- \\rightarrow \\text{I}^- + 3\\text{HSO}_4^-' },
      { label: 'Starch Complex Formation', eq: '2\\text{I}^- + \\text{IO}_3^- + 6\\text{H}^+ + \\text{Starch} \\rightarrow \\text{Blue-Black Complex}' },
      { label: 'Rate Law', eq: '\\text{Rate} = k [\\text{IO}_3^-]^m [\\text{HSO}_3^-]^n' },
    ],
    calculationExample: 'Reaction time Δt = t_flip - t_mix. Accuracy is graded on how fast you stop the timer relative to exact color change moment.',
    concept: 'Thiosulfate consumes free iodine as fast as it forms. Once thiosulfate is depleted, triiodide instantly binds to starch producing dark blue-black color.',
    safety: 'Handle bisulfite solutions in well-ventilated area to prevent sulfur dioxide gas inhalation.',
  },

  'salt-prep': {
    title: 'Salt Preparation via Evaporation',
    domain: 'Chemistry',
    color: '#eab308',
    icon: '💎',
    overview: 'Prepare pure salt crystals from a neutralization reaction solution by heating on a tripod and evaporating the water solvent.',
    steps: [
      'Light the Bunsen burner beneath the tripod and wire gauze.',
      'Observe the aqueous salt solution in the porcelain evaporating dish heating up.',
      'Watch water vapor escape as the solution becomes saturated.',
      'Observe white sodium chloride crystals forming and growing on the dish surface.',
      'Click "Collect Salt Crystals ✓" once evaporation reaches 100%.',
    ],
    formulaTitle: 'Neutralization & Crystallization',
    formulas: [
      { label: 'Salt Formation', eq: '\\text{HCl}(aq) + \\text{NaOH}(aq) \\rightarrow \\text{NaCl}(aq) + \\text{H}_2\\text{O}(l)' },
      { label: 'Evaporative Crystallization', eq: '\\text{NaCl}(aq) \\xrightarrow{\\Delta} \\text{NaCl}(s) + \\text{H}_2\\text{O}(g)\\uparrow' },
    ],
    calculationExample: 'Evaporating 50 mL of 1.0 M NaCl solution yields m = M × V × MW = 1.0 × 0.050 × 58.44 = 2.92 g of pure NaCl crystals.',
    concept: 'Evaporation removes solvent molecules, forcing solute concentration above solubility limit to precipitate crystalline solid lattices.',
    safety: 'Do not heat to complete dryness forcefully to prevent dangerous spitting of hot salt crystals. Use crucible tongs.',
  },

  'electrolysis': {
    title: 'Electrolysis of Water',
    domain: 'Chemistry',
    color: '#3b82f6',
    icon: '⚡',
    overview: 'Decompose water molecules into hydrogen and oxygen gases using a 12V DC electric current and carbon electrodes in a Hofmann voltameter cell.',
    steps: [
      'Turn ON the 12V DC Power Supply switch on the right bench.',
      'Observe stream of gas bubbles rising from both carbon electrodes.',
      'Notice that gas accumulates at twice the rate over the Cathode (-) compared to Anode (+).',
      'Verify the 2:1 volume ratio between Hydrogen gas (Cathode) and Oxygen gas (Anode).',
      'Click "Analyze Gas Volumes (H₂ : O₂) ✓" to submit your observations.',
    ],
    formulaTitle: 'Electrochemical Cell Half-Reactions',
    formulas: [
      { label: 'Cathode Reduction (-)', eq: '4\\text{H}_2\\text{O} + 4e^- \\rightarrow 2\\text{H}_2(g)\\uparrow + 4\\text{OH}^-' },
      { label: 'Anode Oxidation (+)', eq: '2\\text{H}_2\\text{O} \\rightarrow \\text{O}_2(g)\\uparrow + 4\\text{H}^+ + 4e^-' },
      { label: 'Overall Electrolysis', eq: '2\\text{H}_2\\text{O}(l) \\xrightarrow{\\text{Electricity}} 2\\text{H}_2(g) + \\text{O}_2(g)' },
    ],
    calculationExample: '2 moles of H₂ gas are produced for every 1 mole of O₂ gas, proving the molecular formula H₂O contains a 2:1 hydrogen-to-oxygen atomic ratio.',
    concept: 'Electrical energy drives non-spontaneous redox breakdown of water. Electrolyte (dilute H₂SO₄) increases ion conductivity.',
    safety: 'Hydrogen gas is highly flammable. Keep open flames away from collection tubes.',
  },

  'distillation': {
    title: 'Fractional Distillation Setup',
    domain: 'Chemistry',
    color: '#14b8a6',
    icon: '🧪',
    overview: 'Separate a liquid mixture based on boiling point differences using a round-bottom boiling flask, heating mantle, and water-cooled Liebig condenser.',
    steps: [
      'Turn ON the heating mantle under the round-bottom flask.',
      'Observe the liquid mixture boiling and steam vapor rising up the flask neck.',
      'Watch vapor enter the angled Liebig condenser jacket where cold water cools it.',
      'Observe condensed purified liquid drops dripping into the receiving Erlenmeyer flask.',
      'Click "Collect Purified Distillate ✓" when distillation completes.',
    ],
    formulaTitle: 'Vapor Pressure & Raoult\'s Law',
    formulas: [
      { label: 'Raoult\'s Law Partial Pressure', eq: 'P_A = P_A^\\circ \\times X_A' },
      { label: 'Total Vapor Pressure', eq: 'P_{\\text{total}} = P_A^\\circ X_A + P_B^\\circ X_B' },
      { label: 'Separation Efficiency', eq: '\\text{Efficiency} = \\frac{V_{\\text{distillate}}}{V_{\\text{initial}}} \\times 100\\%' },
    ],
    calculationExample: 'Component with lower boiling point (higher vapor pressure P°) vaporizes first, condensing as >98% pure distillate in receiving flask.',
    concept: 'Vapor above a boiling liquid mixture is richer in the more volatile component. Condensing this vapor isolates pure fraction.',
    safety: 'Ensure water cooling jacket is running before heating. Add boiling chips to prevent erratic superheating bumping.',
  },

  'circuit': {
    title: 'Series/Parallel Circuit Building',
    domain: 'Physics',
    color: '#f97316',
    icon: '🔌',
    overview: 'Assemble a functional electronic circuit on a breadboard using a 9V battery, resistor, LED bulb, switch, and connecting wires.',
    steps: [
      'Pick up components from the tray (Battery, Wire, Resistor, LED, Switch).',
      'Approach the breadboard and press E on highlighted slots to snap components into place.',
      'Ensure all 5 slots are filled to establish a closed series loop.',
      'Press E on the switch to close the circuit.',
      'Observe the LED light up brightly as current flows.',
      'Click "Submit Circuit for Assessment ✓".',
    ],
    formulaTitle: 'Ohm\'s Law & Series Resistance',
    formulas: [
      { label: 'Ohm\'s Law', eq: 'V = I \\times R \\implies I = \\frac{V}{R}' },
      { label: 'Series Resistance Sum', eq: 'R_{\\text{total}} = R_{\\text{resistor}} + R_{\\text{LED}}' },
      { label: 'Power Dissipation', eq: 'P = I^2 R = V \\times I' },
    ],
    calculationExample: 'With 9V battery and 220Ω resistor: I = 9V / 220Ω = 0.0409 A = 40.9 mA (sufficient to power standard LED).',
    concept: 'Current requires a continuous closed conductive loop. Series components share identical current, while voltage drops add up across each load.',
    safety: 'Never short-circuit battery terminals directly without a current-limiting resistor to avoid overheating.',
  },

  'ohms-law': {
    title: 'Ohm\'s Law Verification',
    domain: 'Physics',
    color: '#06b6d4',
    icon: '📊',
    overview: 'Systematically vary voltage across a known resistor, measure corresponding current with an ammeter, and plot a V vs. I linear graph.',
    steps: [
      'Adjust the Voltage Slider on the HUD from 1V to 12V.',
      'Observe the dual meters: Voltmeter measures V, Ammeter needle rotates to indicate I.',
      'Click "Take Reading" to record data point (V, I) in the experiment log.',
      'Collect at least 5 readings across different voltage levels.',
      'Examine the resulting linear slope representing experimental resistance R.',
      'Click "Submit readings ✓" for AI linear regression grading.',
    ],
    formulaTitle: 'Linear Circuit Equations & Slope Analysis',
    formulas: [
      { label: 'Linear Relation', eq: 'V = I \\cdot R' },
      { label: 'Experimental Slope Resistance', eq: 'R_{\\text{exp}} = \\frac{\\sum V_i I_i}{\\sum I_i^2}' },
      { label: 'Percent Error Accuracy', eq: '\\text{Accuracy} = 100\\% - \\left| \\frac{R_{\\text{exp}} - R_{\\text{actual}}}{R_{\\text{actual}}} \\right| \\times 100\\%' },
    ],
    calculationExample: 'For V = [2, 4, 6, 8, 10]V and I = [20, 40, 60, 80, 100]mA: slope R = ΔV / ΔI = 2V / 0.02A = 100 Ω (100% linear).',
    concept: 'Ohmic conductors maintain constant resistance regardless of voltage, producing a straight line passing through origin on V-I plot.',
    safety: 'Do not exceed component power rating P = V²/R to prevent resistor thermal damage.',
  },

  'pendulum': {
    title: 'Simple Pendulum Period',
    domain: 'Physics',
    color: '#10b981',
    icon: '⏳',
    overview: 'Investigate simple harmonic motion by adjusting pendulum string length and release angle, measuring oscillation period T with a precision stopwatch.',
    steps: [
      'Set string length L (0.5m – 2.0m) and initial angle θ (10° – 60°) using HUD sliders.',
      'Press E on "Release Pendulum" button to initiate swinging motion.',
      'Press E on "Start Timer" as bob passes bottom equilibrium point.',
      'Count 10 complete back-and-forth oscillations.',
      'Press E on "Stop Timer" after the 10th swing finishes.',
      'Click "Submit Pendulum Result ✓" to compare measured T vs. theoretical formula T = 2π√(L/g).',
    ],
    formulaTitle: 'Simple Harmonic Motion Equations',
    formulas: [
      { label: 'Theoretical Period', eq: 'T = 2\\pi \\sqrt{\\frac{L}{g}}' },
      { label: 'Gravitational Acceleration', eq: 'g = \\frac{4\\pi^2 L}{T^2} \\approx 9.81 \\text{ m/s}^2' },
      { label: 'Oscillation Period Measurement', eq: 'T_{\\text{measured}} = \\frac{t_{\\text{10 swings}}}{10}' },
    ],
    calculationExample: 'For L = 1.0 m: T = 2π √(1.0 / 9.81) = 2.006 seconds. 10 swings should take ~20.06 s.',
    concept: 'For small angles (θ < 15°), period depends solely on length L and gravity g, completely independent of bob mass or amplitude.',
    safety: 'Ensure mount is rigid so energy is not lost to support structure vibrations.',
  },

  'projectile': {
    title: 'Projectile Motion Launcher',
    domain: 'Physics',
    color: '#ef4444',
    icon: '🚀',
    overview: 'Launch a projectile ball at specified angle θ and initial velocity v₀, tracing its parabolic 2D trajectory arc to hit a target pad.',
    steps: [
      'Adjust Launch Angle θ (15° – 75°) and Initial Velocity v₀ (5 – 25 m/s) via HUD sliders.',
      'Press "Launch Projectile" to fire ball from cannon.',
      'Watch yellow parabolic trajectory curve rendered in real-time 3D.',
      'Observe the ball land on the target pad on the lab floor.',
      'Click "Analyze Trajectory Data ✓" to record flight time and maximum range.',
    ],
    formulaTitle: 'Kinematic Trajectory Equations',
    formulas: [
      { label: 'Horizontal Range', eq: 'R = \\frac{v_0^2 \\sin(2\\theta)}{g}' },
      { label: 'Total Flight Time', eq: 't_{\\text{flight}} = \\frac{2 v_0 \\sin\\theta}{g}' },
      { label: 'Maximum Height', eq: 'H = \\frac{v_0^2 \\sin^2\\theta}{2g}' },
    ],
    calculationExample: 'For v₀ = 15 m/s, θ = 45°: Max Range R = (15² × sin 90°) / 9.81 = 225 / 9.81 = 22.94 m (maximum range occurs at 45°).',
    concept: 'Horizontal velocity remains constant (a_x = 0) while vertical motion experiences constant downward acceleration due to gravity (a_y = -g).',
    safety: 'Clear landing area downrange before firing. Verify recoil dampening on launcher mount.',
  },

  'refraction': {
    title: 'Snell\'s Law Refraction',
    domain: 'Physics',
    color: '#8b5cf6',
    icon: '👁️',
    overview: 'Direct a red laser beam at an acrylic glass block on a protractor scale, measuring incident angle θ₁ and refracted angle θ₂ to verify Snell\'s Law.',
    steps: [
      'Adjust Incident Angle θ₁ (0° – 70°) using the HUD slider.',
      'Press "Turn ON Laser Ray Beam" to fire red laser at glass boundary.',
      'Observe the incident beam bend sharply as it enters the denser glass medium.',
      'Read the refracted angle θ₂ inside glass on the protractor scale.',
      'Click "Verify Snell\'s Law (n₁ sinθ₁ = n₂ sinθ₂) ✓" for AI calculation validation.',
    ],
    formulaTitle: 'Refraction Index & Optics Equations',
    formulas: [
      { label: 'Snell\'s Law', eq: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2' },
      { label: 'Refracted Angle Formula', eq: '\\theta_2 = \\arcsin\\left( \\frac{n_1}{n_2} \\sin\\theta_1 \\right)' },
      { label: 'Refractive Index', eq: 'n = \\frac{c}{v_{\\text{medium}}}' },
    ],
    calculationExample: 'Air n₁=1.0, Glass n₂=1.5. For θ₁ = 30°: sin θ₂ = (1.0 × sin 30°) / 1.5 = 0.5 / 1.5 = 0.333 ⟹ θ₂ = 19.47°.',
    concept: 'Light slows down when entering an optically denser medium (n_glass > n_air), causing wave fronts to bend towards the normal line.',
    safety: 'Never look directly into laser diode aperture. Avoid reflective glares off metallic surfaces.',
  },

  'induction': {
    title: 'Electromagnetic Induction',
    domain: 'Physics',
    color: '#f59e0b',
    icon: '🧲',
    overview: 'Demonstrate Faraday\'s Law of Induction by pushing and pulling a bar magnet through a copper solenoid coil, observing induced current on a Galvanometer.',
    steps: [
      'Press "Push Magnet into Coil" to slide N/S pole bar magnet into copper solenoid.',
      'Watch Galvanometer needle deflect sharply to the right (positive current).',
      'Hold magnet stationary inside coil — notice Galvanometer needle returns to 0.',
      'Press "Pull Magnet out of Coil" — watch needle deflect to left (negative current).',
      'Click "Verify Faraday\'s Law of Induction ✓" for AI evaluation.',
    ],
    formulaTitle: 'Faraday\'s & Lenz\'s Law Equations',
    formulas: [
      { label: 'Faraday\'s Induced EMF', eq: '\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}' },
      { label: 'Magnetic Flux', eq: '\\Phi_B = B \\cdot A \\cos\\theta' },
      { label: 'Lenz\'s Law Direction', eq: '\\text{Induced current opposes the change in magnetic flux}' },
    ],
    calculationExample: 'Moving magnet faster increases rate of flux change dΦ/dt, producing larger voltage pulse and bigger Galvanometer needle deflection.',
    concept: 'A changing magnetic field induces an electromotive force (EMF) in a conductor. Moving magnet faster yields proportional current surge.',
    safety: 'Keep strong neodymium magnets away from credit cards, pacemakers, and magnetic storage media.',
  },
};

export default function ExperimentGuideModal() {
  const showGuideModal = useGameStore((s) => s.showGuideModal);
  const guideExperiment = useGameStore((s) => s.guideExperiment);
  const closeGuideModal = useGameStore((s) => s.closeGuideModal);
  const setActiveExperiment = useGameStore((s) => s.setActiveExperiment);
  const [activeTab, setActiveTab] = useState('overview');

  if (!showGuideModal || !guideExperiment) return null;

  const data = GUIDE_DATA[guideExperiment] || {
    title: guideExperiment,
    domain: 'Lab',
    color: '#6366f1',
    icon: '🔬',
    overview: 'Interactive 3D Virtual Laboratory Experiment.',
    steps: ['Follow on-screen 3D prompts (E key) to conduct experiment.'],
    formulas: [],
    concept: 'Explore practical science principles in an immersive 3D simulation.',
    safety: 'Follow standard lab protocols.',
  };

  const handleStart = () => {
    setActiveExperiment(guideExperiment);
    closeGuideModal();
  };

  return (
    <div className="guide-modal-overlay">
      <div className="guide-modal-card" style={{ borderColor: data.color }}>
        {/* Header */}
        <div className="guide-modal-header" style={{ background: `linear-gradient(135deg, ${data.color}22 0%, rgba(15,23,42,0.8) 100%)` }}>
          <div className="guide-header-left">
            <span className="guide-icon-badge" style={{ background: `${data.color}33`, borderColor: data.color }}>
              {data.icon}
            </span>
            <div>
              <div className="guide-domain-chip" style={{ background: `${data.color}25`, color: data.color }}>
                {data.domain} Lab Manual
              </div>
              <h2 className="guide-title">{data.title}</h2>
            </div>
          </div>
          <button className="guide-close-btn" onClick={closeGuideModal}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="guide-tab-bar">
          <button
            className={`guide-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BookOpen size={16} /> Procedure Guide
          </button>
          <button
            className={`guide-tab ${activeTab === 'formulas' ? 'active' : ''}`}
            onClick={() => setActiveTab('formulas')}
          >
            <Calculator size={16} /> Formulas &amp; Math
          </button>
          {(guideExperiment === 'ohms-law' || guideExperiment === 'circuit') && (
            <button
              className={`guide-tab ${activeTab === 'circuit' ? 'active' : ''}`}
              onClick={() => setActiveTab('circuit')}
            >
              <Zap size={16} /> Circuit Diagram
            </button>
          )}
          <button
            className={`guide-tab ${activeTab === 'safety' ? 'active' : ''}`}
            onClick={() => setActiveTab('safety')}
          >
            <ShieldCheck size={16} /> Theory &amp; Safety
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="guide-modal-body">
          {/* TAB 1: PROCEDURE GUIDE */}
          {activeTab === 'overview' && (
            <div className="guide-tab-content">
              <div className="guide-overview-box">
                <Sparkles size={18} style={{ color: data.color, flexShrink: 0, marginTop: '2px' }} />
                <p>{data.overview}</p>
              </div>

              <h4 className="guide-section-subtitle">
                <ChevronRight size={16} style={{ color: data.color }} /> Step-by-Step 3D Procedure
              </h4>
              <ol className="guide-steps-list">
                {data.steps.map((step, i) => (
                  <li key={i} className="guide-step-item">
                    <span className="guide-step-num" style={{ background: `${data.color}33`, color: data.color }}>
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* TAB 2: FORMULAS & MATH */}
          {activeTab === 'formulas' && (
            <div className="guide-tab-content">
              <h4 className="guide-section-subtitle">
                <Calculator size={16} style={{ color: data.color }} /> {data.formulaTitle}
              </h4>
              <div className="guide-formulas-grid">
                {data.formulas.map((f, i) => (
                  <div key={i} className="guide-formula-card">
                    <span className="guide-formula-label">{f.label}</span>
                    <code className="guide-formula-eq">{f.eq}</code>
                  </div>
                ))}
              </div>

              {data.calculationExample && (
                <div className="guide-example-box">
                  <strong>💡 Sample Calculation:</strong>
                  <p>{data.calculationExample}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CIRCUIT DIAGRAM SCHEMATIC */}
          {activeTab === 'circuit' && (
            <div className="guide-tab-content">
              <h4 className="guide-section-subtitle" style={{ color: '#38bdf8' }}>
                <Zap size={16} style={{ color: '#38bdf8' }} /> Ohm's Law Circuit Schematic (V = IR)
              </h4>
              <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155', textAlign: 'center', marginBottom: '14px' }}>
                <svg viewBox="0 0 400 220" style={{ width: '100%', height: 'auto', maxHeight: '190px' }}>
                  {/* Main Loop Wires */}
                  <rect x="50" y="40" width="300" height="140" fill="none" stroke="#ef4444" strokeWidth="3" rx="8" />
                  
                  {/* DC Battery (Left) */}
                  <g transform="translate(50, 110)">
                    <line x1="0" y1="-25" x2="0" y2="25" stroke="#000" strokeWidth="12" />
                    <line x1="-15" y1="-15" x2="-15" y2="15" stroke="#ef4444" strokeWidth="6" />
                    <line x1="15" y1="-25" x2="15" y2="25" stroke="#38bdf8" strokeWidth="6" />
                    <text x="-35" y="5" fill="#ef4444" fontSize="14" fontWeight="bold">+ 12V DC -</text>
                  </g>

                  {/* Switch Key (Top) */}
                  <g transform="translate(140, 40)">
                    <rect x="-20" y="-12" width="40" height="24" fill="#1e293b" />
                    <circle cx="-15" cy="0" r="4" fill="#38bdf8" />
                    <circle cx="15" cy="0" r="4" fill="#38bdf8" />
                    <line x1="-15" y1="0" x2="10" y2="-12" stroke="#10b981" strokeWidth="3" />
                    <text x="-15" y="-18" fill="#a7f3d0" fontSize="11">Switch K</text>
                  </g>

                  {/* Ammeter A (Series Top Right) */}
                  <g transform="translate(260, 40)">
                    <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#dc2626" strokeWidth="3" />
                    <text x="-5" y="5" fill="#ffffff" fontSize="14" fontWeight="bold">A</text>
                    <text x="-25" y="-20" fill="#f87171" fontSize="11">Ammeter (Series)</text>
                  </g>

                  {/* Resistor R (Bottom) */}
                  <g transform="translate(200, 180)">
                    <rect x="-35" y="-12" width="70" height="24" fill="#1e293b" stroke="#eab308" strokeWidth="3" />
                    <text x="-20" y="5" fill="#fef08a" fontSize="13" fontWeight="bold">R (100Ω)</text>
                  </g>

                  {/* Voltmeter V (Parallel under Resistor) */}
                  <g transform="translate(200, 210)">
                    <line x1="-50" y1="-30" x2="-50" y2="0" stroke="#0284c7" strokeWidth="2" strokeDasharray="4" />
                    <line x1="50" y1="-30" x2="50" y2="0" stroke="#0284c7" strokeWidth="2" strokeDasharray="4" />
                    <line x1="-50" y1="0" x2="50" y2="0" stroke="#0284c7" strokeWidth="2" />
                    <circle cx="0" cy="0" r="14" fill="#1e293b" stroke="#0284c7" strokeWidth="3" />
                    <text x="-5" y="5" fill="#ffffff" fontSize="14" fontWeight="bold">V</text>
                    <text x="-55" y="16" fill="#38bdf8" fontSize="10">Voltmeter (Parallel)</text>
                  </g>
                </svg>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                <strong>Key Connection Guidelines:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li><strong style={{ color: '#ef4444' }}>Ammeter (A):</strong> Connect in Series in the main current loop.</li>
                  <li><strong style={{ color: '#38bdf8' }}>Voltmeter (V):</strong> Connect in Parallel directly across Resistor R.</li>
                  <li><strong style={{ color: '#a7f3d0' }}>Switch (K):</strong> Close key to start current flow and take V-I readings!</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: THEORY & SAFETY */}
          {activeTab === 'safety' && (
            <div className="guide-tab-content">
              <div className="guide-theory-card">
                <h4><Sparkles size={16} style={{ color: data.color }} /> Core Science Principle</h4>
                <p>{data.concept}</p>
              </div>

              <div className="guide-safety-card">
                <h4><ShieldCheck size={16} style={{ color: '#f59e0b' }} /> Safety Guidelines</h4>
                <p>{data.safety}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="guide-modal-footer">
          <button className="guide-cancel-btn" onClick={closeGuideModal}>
            Close Manual
          </button>
          <button className="guide-start-btn" style={{ background: `linear-gradient(135deg, ${data.color}, #6366f1)` }} onClick={handleStart}>
            <Play size={18} /> Enter 3D Experiment
          </button>
        </div>
      </div>
    </div>
  );
}
