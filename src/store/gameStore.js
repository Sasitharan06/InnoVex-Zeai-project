import { create } from 'zustand';

const routeToScreenMap = {
  '/': 'landing',
  '/login': 'start',
  '/signup': 'start',
  '/student-dashboard': 'dashboard',
  '/dashboard': 'dashboard',
  '/teacher-dashboard': 'faculty-dashboard',
  '/faculty-dashboard': 'faculty-dashboard',
  '/lab': 'lab',
  '/lab/chemistry': 'lab',
  '/lab/physics': 'lab',
};

const screenToRouteMap = {
  'landing': '/',
  'start': '/login',
  'dashboard': '/student-dashboard',
  'faculty-dashboard': '/teacher-dashboard',
  'lab': '/lab',
};

function getInitialScreen() {
  if (typeof window === 'undefined') return 'landing';
  const path = window.location.pathname.toLowerCase();
  return routeToScreenMap[path] || 'landing';
}

const useGameStore = create((set, get) => ({
  // ── App State with HTML5 Route Sync ──
  screen: getInitialScreen(),
  setScreen: (screen, customPath) => {
    set({ screen });
    if (typeof window !== 'undefined') {
      const targetPath = customPath || screenToRouteMap[screen] || '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ screen }, '', targetPath);
      }
    }
  },
  
  // ── Auth / Role ──
  role: null, // 'student' | 'faculty'
  setRole: (role) => set({ role }),
  
  // ── Student ──
  studentName: '',
  studentId: null,
  setStudent: (name, id) => set({ studentName: name, studentId: id }),

  // ── Classroom ──
  classroom: null, // { id, name, code, faculty_name, faculty_id }
  setClassroom: (classroom) => set({ classroom }),

  // ── Player State ──
  currentRoom: 'hallway', // 'hallway' | 'chemistry' | 'physics'
  setCurrentRoom: (room) => set({ currentRoom: room }),
  heldItem: null, // null | 'flask' | 'battery' | 'resistor' | 'led' | 'wire' | 'switch'
  setHeldItem: (item) => set({ heldItem: item }),
  
  // ── Interaction ──
  interactionPrompt: null, // null | { text, action }
  setInteractionPrompt: (prompt) => set({ interactionPrompt: prompt }),
  pointerLocked: false,
  setPointerLocked: (locked) => set({ pointerLocked: locked }),

  // ── Chemistry Experiment ──
  chemistry: {
    flaskPlaced: false,
    indicatorAdded: false,
    volumeAdded: 0,
    equivalenceVolume: 25.0,
    endpointMarked: false,
    startTime: null,
    actions: [],
  },
  
  placeFlask: () => set((state) => ({
    chemistry: { ...state.chemistry, flaskPlaced: true },
    heldItem: null,
  })),
  
  addIndicator: () => set((state) => ({
    chemistry: {
      ...state.chemistry,
      indicatorAdded: true,
      actions: [...state.chemistry.actions, { type: 'add_indicator', time: Date.now() }],
    },
    heldItem: null,
  })),
  
  startTitration: () => set((state) => ({
    chemistry: {
      ...state.chemistry,
      startTime: Date.now(),
      actions: [...state.chemistry.actions, { type: 'start_titration', time: Date.now() }],
    },
  })),
  
  addTitrant: (amount = 0.5) => set((state) => {
    const newVolume = Math.min(state.chemistry.volumeAdded + amount, 50);
    return {
      chemistry: {
        ...state.chemistry,
        volumeAdded: newVolume,
        startTime: state.chemistry.startTime || Date.now(),
        actions: [...state.chemistry.actions, { type: 'add_titrant', volume: newVolume, time: Date.now() }],
      },
    };
  }),
  
  markEndpoint: () => set((state) => ({
    chemistry: {
      ...state.chemistry,
      endpointMarked: true,
      actions: [...state.chemistry.actions, { type: 'mark_endpoint', volume: state.chemistry.volumeAdded, time: Date.now() }],
    },
  })),
  
  resetChemistry: () => set({
    chemistry: {
      flaskPlaced: false,
      indicatorAdded: false,
      volumeAdded: 0,
      equivalenceVolume: 25.0,
      endpointMarked: false,
      startTime: null,
      actions: [],
    },
  }),

  // ── Physics Experiment ──
  physics: {
    slots: {
      slot1: null,
      slot2: null,
      slot3: null,
      slot4: null,
      slot5: null,
    },
    switchOn: false,
    circuitComplete: false,
    ledOn: false,
    voltage: 9,
    resistance: 220,
    current: 0,
    actions: [],
  },
  
  placeComponent: (slotId, component) => set((state) => {
    const newSlots = { ...state.physics.slots, [slotId]: component };
    const placedComponents = Object.values(newSlots).filter(Boolean);
    const hasAll = ['battery', 'resistor', 'led', 'switch'].every(
      c => placedComponents.includes(c)
    );
    const circuitComplete = hasAll;
    const current = circuitComplete && state.physics.switchOn 
      ? state.physics.voltage / state.physics.resistance 
      : 0;
    const ledOn = circuitComplete && state.physics.switchOn && current > 0;
    
    return {
      physics: {
        ...state.physics,
        slots: newSlots,
        circuitComplete,
        current,
        ledOn,
        actions: [...state.physics.actions, { type: 'place_component', slot: slotId, component, time: Date.now() }],
      },
      heldItem: null,
    };
  }),
  
  toggleSwitch: () => set((state) => {
    const newSwitchOn = !state.physics.switchOn;
    const current = state.physics.circuitComplete && newSwitchOn
      ? state.physics.voltage / state.physics.resistance
      : 0;
    const ledOn = state.physics.circuitComplete && newSwitchOn && current > 0;
    
    return {
      physics: {
        ...state.physics,
        switchOn: newSwitchOn,
        current,
        ledOn,
        actions: [...state.physics.actions, { type: 'toggle_switch', switchOn: newSwitchOn, time: Date.now() }],
      },
    };
  }),
  
  resetPhysics: () => set({
    physics: {
      slots: { slot1: null, slot2: null, slot3: null, slot4: null, slot5: null },
      switchOn: false,
      circuitComplete: false,
      ledOn: false,
      voltage: 9,
      resistance: 220,
      current: 0,
      actions: [],
    },
  }),

  // ── Active Experiment Selector & Pre-Lab Guide ──
  activeExperiment: null, // which experiment is currently active in the room
  setActiveExperiment: (exp) => set({ activeExperiment: exp }),
  showGuideModal: false,
  guideExperiment: null,
  openGuideModal: (exp) => set({ showGuideModal: true, guideExperiment: exp }),
  closeGuideModal: () => set({ showGuideModal: false, guideExperiment: null }),

  // ── Flame Test Experiment ──
  flameTest: {
    selectedSample: null,
    sampleHeld: false,
    flameActive: false,
    flameColor: '#ff8800',
    observedColor: null,
    studentGuess: null,
    submitted: false,
    actions: [],
  },
  pickSample: (sample) => set((state) => ({
    flameTest: {
      ...state.flameTest,
      selectedSample: sample,
      sampleHeld: true,
      actions: [...state.flameTest.actions, { type: 'pick_sample', sample, time: Date.now() }],
    },
    heldItem: `sample-${sample}`,
  })),
  activateFlame: () => set((state) => {
    const colorMap = { Na: '#ffcc00', Cu: '#00cc66', K: '#cc88ff', Ca: '#ff4400', Li: '#ff0044' };
    const color = colorMap[state.flameTest.selectedSample] || '#ff8800';
    return {
      flameTest: {
        ...state.flameTest,
        flameActive: true,
        flameColor: color,
        observedColor: color,
        actions: [...state.flameTest.actions, { type: 'flame_test', sample: state.flameTest.selectedSample, color, time: Date.now() }],
      },
      heldItem: null,
    };
  }),
  setFlameGuess: (guess) => set((state) => ({
    flameTest: { ...state.flameTest, studentGuess: guess },
  })),
  submitFlameTest: () => set((state) => ({
    flameTest: { ...state.flameTest, submitted: true },
  })),
  resetFlameTest: () => set({
    flameTest: {
      selectedSample: null, sampleHeld: false, flameActive: false,
      flameColor: '#ff8800', observedColor: null, studentGuess: null,
      submitted: false, actions: [],
    },
  }),

  // ── pH Test Experiment ──
  phTest: {
    selectedSolution: null,
    stripHeld: false,
    stripDipped: false,
    stripColor: '#cccccc',
    actualPH: null,
    studentGuess: null,
    submitted: false,
    actions: [],
  },
  pickStrip: () => set((state) => ({
    phTest: { ...state.phTest, stripHeld: true, actions: [...state.phTest.actions, { type: 'pick_strip', time: Date.now() }] },
    heldItem: 'ph-strip',
  })),
  dipStrip: (solutionId, actualPH, color) => set((state) => ({
    phTest: {
      ...state.phTest,
      selectedSolution: solutionId,
      stripDipped: true,
      stripColor: color,
      actualPH,
      actions: [...state.phTest.actions, { type: 'dip_strip', solutionId, actualPH, time: Date.now() }],
    },
    heldItem: null,
  })),
  setPHGuess: (guess) => set((state) => ({
    phTest: { ...state.phTest, studentGuess: guess },
  })),
  submitPHTest: () => set((state) => ({
    phTest: { ...state.phTest, submitted: true },
  })),
  resetPHTest: () => set({
    phTest: {
      selectedSolution: null, stripHeld: false, stripDipped: false,
      stripColor: '#cccccc', actualPH: null, studentGuess: null,
      submitted: false, actions: [],
    },
  }),

  // ── Precipitation Experiment ──
  precipitation: {
    beakerAAdded: false,
    beakerBAdded: false,
    precipitateFormed: false,
    mixProgress: 0,
    colorResult: '#ffffff',
    submitted: false,
    actions: [],
  },
  pourBeaker: (beaker) => set((state) => {
    const isA = beaker === 'A';
    const newState = {
      ...state.precipitation,
      beakerAAdded: isA ? true : state.precipitation.beakerAAdded,
      beakerBAdded: !isA ? true : state.precipitation.beakerBAdded,
      actions: [...state.precipitation.actions, { type: 'pour_beaker', beaker, time: Date.now() }],
    };
    if (newState.beakerAAdded && newState.beakerBAdded) {
      newState.precipitateFormed = true;
      newState.colorResult = '#e8e0d0';
    }
    return { precipitation: newState };
  }),
  setPrecipitationProgress: (progress) => set((state) => ({
    precipitation: { ...state.precipitation, mixProgress: progress },
  })),
  submitPrecipitation: () => set((state) => ({
    precipitation: { ...state.precipitation, submitted: true },
  })),
  resetPrecipitation: () => set({
    precipitation: {
      beakerAAdded: false, beakerBAdded: false, precipitateFormed: false,
      mixProgress: 0, colorResult: '#ffffff', submitted: false, actions: [],
    },
  }),

  // ── Iodine Clock Experiment ──
  iodineClock: {
    reagentsAdded: 0,
    timerStarted: null,
    reactionTime: null,
    studentStopTime: null,
    colorChanged: false,
    submitted: false,
    actions: [],
  },
  addIodineReagent: () => set((state) => {
    const count = state.iodineClock.reagentsAdded + 1;
    const updates = {
      ...state.iodineClock,
      reagentsAdded: count,
      actions: [...state.iodineClock.actions, { type: 'add_reagent', count, time: Date.now() }],
    };
    if (count >= 2) {
      updates.timerStarted = Date.now();
      updates.reactionTime = 8000 + Math.random() * 7000; // 8-15 seconds
    }
    return { iodineClock: updates };
  }),
  triggerIodineColor: () => set((state) => ({
    iodineClock: { ...state.iodineClock, colorChanged: true },
  })),
  stopIodineClock: () => set((state) => ({
    iodineClock: {
      ...state.iodineClock,
      studentStopTime: Date.now(),
      actions: [...state.iodineClock.actions, { type: 'stop_timer', time: Date.now() }],
    },
  })),
  submitIodineClock: () => set((state) => ({
    iodineClock: { ...state.iodineClock, submitted: true },
  })),
  resetIodineClock: () => set({
    iodineClock: {
      reagentsAdded: 0, timerStarted: null, reactionTime: null,
      studentStopTime: null, colorChanged: false, submitted: false, actions: [],
    },
  }),

  // ── Ohm's Law Experiment ──
  ohmsLaw: {
    voltage: 2,
    resistance: 100,
    readings: [],
    submitted: false,
    showOhmsDiagram: false,
    placedComponents: [], // ['battery', 'resistor', 'voltmeter', 'ammeter', 'switch']
    circuitBuilt: false,
    switchClosed: false,
    actions: [],
  },
  setOhmsVoltage: (v) => set((state) => ({
    ohmsLaw: { ...state.ohmsLaw, voltage: v },
  })),
  toggleOhmsDiagram: () => set((state) => ({
    ohmsLaw: { ...state.ohmsLaw, showOhmsDiagram: !state.ohmsLaw.showOhmsDiagram },
  })),
  placeOhmsComponent: (comp) => set((state) => {
    if (state.ohmsLaw.placedComponents.includes(comp)) return state;
    const placed = [...state.ohmsLaw.placedComponents, comp];
    const built = placed.length >= 5;
    return {
      ohmsLaw: {
        ...state.ohmsLaw,
        placedComponents: placed,
        circuitBuilt: built,
        actions: [...state.ohmsLaw.actions, { type: 'place_component', comp, time: Date.now() }],
      },
    };
  }),
  toggleOhmsSwitch: () => set((state) => ({
    ohmsLaw: { ...state.ohmsLaw, switchClosed: !state.ohmsLaw.switchClosed },
  })),
  takeOhmsReading: () => set((state) => {
    const { voltage, resistance } = state.ohmsLaw;
    const current = voltage / resistance;
    return {
      ohmsLaw: {
        ...state.ohmsLaw,
        readings: [...state.ohmsLaw.readings, { voltage, current }],
        actions: [...state.ohmsLaw.actions, { type: 'take_reading', voltage, current, time: Date.now() }],
      },
    };
  }),
  submitOhmsLaw: () => set((state) => ({
    ohmsLaw: { ...state.ohmsLaw, submitted: true },
  })),
  resetOhmsLaw: () => set({
    ohmsLaw: {
      voltage: 2, resistance: 100, readings: [], submitted: false,
      showOhmsDiagram: false, placedComponents: [], circuitBuilt: false, switchClosed: false, actions: [],
    },
  }),

  // ── Pendulum Experiment ──
  pendulum: {
    length: 1.0,
    initialAngle: 30,
    released: false,
    releaseTime: null,
    timerRunning: false,
    timerStart: null,
    timerStop: null,
    oscillationCount: 0,
    submitted: false,
    actions: [],
  },
  setPendulumLength: (l) => set((state) => ({
    pendulum: { ...state.pendulum, length: l },
  })),
  setPendulumAngle: (a) => set((state) => ({
    pendulum: { ...state.pendulum, initialAngle: a },
  })),
  releasePendulum: () => set((state) => ({
    pendulum: {
      ...state.pendulum,
      released: true,
      releaseTime: Date.now(),
      actions: [...state.pendulum.actions, { type: 'release', angle: state.pendulum.initialAngle, length: state.pendulum.length, time: Date.now() }],
    },
  })),
  togglePendulumTimer: () => set((state) => {
    if (!state.pendulum.timerRunning) {
      return { pendulum: { ...state.pendulum, timerRunning: true, timerStart: Date.now() } };
    } else {
      return {
        pendulum: {
          ...state.pendulum,
          timerRunning: false,
          timerStop: Date.now(),
          actions: [...state.pendulum.actions, { type: 'timer_stop', time: Date.now() }],
        },
      };
    }
  }),
  submitPendulum: () => set((state) => ({
    pendulum: { ...state.pendulum, submitted: true },
  })),
  resetPendulum: () => set({
    pendulum: {
      length: 1.0, initialAngle: 30, released: false, releaseTime: null,
      timerRunning: false, timerStart: null, timerStop: null,
      oscillationCount: 0, submitted: false, actions: [],
    },
  }),

  // ── Salt Prep Experiment ──
  saltPrep: { heated: false, heatProgress: 0, crystalsFormed: false, submitted: false, actions: [] },
  startSaltHeating: () => set((state) => ({
    saltPrep: { ...state.saltPrep, heated: true, actions: [...state.saltPrep.actions, { type: 'start_heating', time: Date.now() }] },
  })),
  setSaltProgress: (p) => set((state) => ({
    saltPrep: { ...state.saltPrep, heatProgress: p, crystalsFormed: p >= 1 },
  })),
  resetSaltPrep: () => set({ saltPrep: { heated: false, heatProgress: 0, crystalsFormed: false, submitted: false, actions: [] } }),

  // ── Electrolysis Experiment ──
  electrolysis: { powerOn: false, gasLevel: 0, submitted: false, actions: [] },
  toggleElectrolysisPower: () => set((state) => ({
    electrolysis: { ...state.electrolysis, powerOn: !state.electrolysis.powerOn, actions: [...state.electrolysis.actions, { type: 'toggle_power', time: Date.now() }] },
  })),
  setElectrolysisGas: (g) => set((state) => ({
    electrolysis: { ...state.electrolysis, gasLevel: g },
  })),
  resetElectrolysis: () => set({ electrolysis: { powerOn: false, gasLevel: 0, submitted: false, actions: [] } }),

  // ── Distillation Experiment ──
  distillation: { heating: false, distillateVolume: 0, submitted: false, actions: [] },
  startDistillation: () => set((state) => ({
    distillation: { ...state.distillation, heating: true, actions: [...state.distillation.actions, { type: 'start_distillation', time: Date.now() }] },
  })),
  setDistillateVolume: (v) => set((state) => ({
    distillation: { ...state.distillation, distillateVolume: v },
  })),
  resetDistillation: () => set({ distillation: { heating: false, distillateVolume: 0, submitted: false, actions: [] } }),

  // ── Projectile Motion Experiment ──
  projectile: {
    angle: 45,
    velocity: 15,
    launched: false,
    launchTime: null,
    maxDistance: 0,
    readings: [],
    submitted: false,
    actions: [],
  },
  setProjectileAngle: (a) => set((state) => ({ projectile: { ...state.projectile, angle: a } })),
  setProjectileVelocity: (v) => set((state) => ({ projectile: { ...state.projectile, velocity: v } })),
  adjustProjectileAngle: (delta) => set((state) => ({
    projectile: { ...state.projectile, angle: Math.max(15, Math.min(75, state.projectile.angle + delta)) },
  })),
  adjustProjectileVelocity: (delta) => set((state) => ({
    projectile: { ...state.projectile, velocity: Math.max(5, Math.min(25, state.projectile.velocity + delta)) },
  })),
  launchProjectile: () => set((state) => {
    const rad = (state.projectile.angle * Math.PI) / 180;
    const dist = (Math.pow(state.projectile.velocity, 2) * Math.sin(2 * rad)) / 9.81;
    return {
      projectile: {
        ...state.projectile,
        launched: true,
        launchTime: Date.now(),
        maxDistance: dist,
        actions: [...state.projectile.actions, { type: 'launch', angle: state.projectile.angle, velocity: state.projectile.velocity, time: Date.now() }],
      },
    };
  }),
  takeProjectileReading: () => set((state) => {
    const { angle, velocity, maxDistance } = state.projectile;
    const rad = (angle * Math.PI) / 180;
    const range = (Math.pow(velocity, 2) * Math.sin(2 * rad)) / 9.81;
    const maxHeight = (Math.pow(velocity * Math.sin(rad), 2)) / (2 * 9.81);
    const flightTime = (2 * velocity * Math.sin(rad)) / 9.81;
    return {
      projectile: {
        ...state.projectile,
        readings: [...state.projectile.readings, { angle, velocity, range: range.toFixed(1), maxHeight: maxHeight.toFixed(1), flightTime: flightTime.toFixed(1) }],
        actions: [...state.projectile.actions, { type: 'take_reading', angle, velocity, range, maxHeight, time: Date.now() }],
      },
    };
  }),
  submitProjectile: () => set((state) => ({
    projectile: { ...state.projectile, submitted: true },
  })),
  resetProjectile: () => set({
    projectile: { angle: 45, velocity: 15, launched: false, launchTime: null, maxDistance: 0, readings: [], submitted: false, actions: [] },
  }),

  // ── Refraction (Snell's Law) Experiment ──
  refraction: {
    incidentAngle: 30,
    refractiveIndex: 1.5,
    beamActive: false,
    readings: [],
    submitted: false,
    actions: [],
  },
  setRefractionAngle: (a) => set((state) => ({ refraction: { ...state.refraction, incidentAngle: a } })),
  adjustRefractionAngle: (delta) => set((state) => ({
    refraction: { ...state.refraction, incidentAngle: Math.max(0, Math.min(75, state.refraction.incidentAngle + delta)) },
  })),
  toggleRefractionBeam: () => set((state) => ({ refraction: { ...state.refraction, beamActive: !state.refraction.beamActive } })),
  takeRefractionReading: () => set((state) => {
    const { incidentAngle, refractiveIndex } = state.refraction;
    const n1 = 1.0;
    const n2 = refractiveIndex;
    const theta1Rad = (incidentAngle * Math.PI) / 180;
    const theta2Rad = Math.asin((n1 * Math.sin(theta1Rad)) / n2);
    const theta2Deg = (theta2Rad * 180) / Math.PI;
    const ratio = Math.sin(theta1Rad) / (Math.sin(theta2Rad) || 1);
    return {
      refraction: {
        ...state.refraction,
        readings: [...state.refraction.readings, { incidentAngle, refractedAngle: theta2Deg.toFixed(1), ratio: ratio.toFixed(2) }],
        actions: [...state.refraction.actions, { type: 'take_reading', incidentAngle, refractedAngle: theta2Deg, time: Date.now() }],
      },
    };
  }),
  submitRefraction: () => set((state) => ({
    refraction: { ...state.refraction, submitted: true },
  })),
  resetRefraction: () => set({
    refraction: { incidentAngle: 30, refractiveIndex: 1.5, beamActive: false, readings: [], submitted: false, actions: [] },
  }),

  // ── Electromagnetic Induction Experiment ──
  induction: {
    magnetPos: 0,
    moving: false,
    deflection: 0,
    currentMA: 0,
    thrustSpeed: 1.0, // 0.5: Slow, 1.0: Medium, 2.0: Fast
    readings: [],
    submitted: false,
    actions: [],
  },
  setInductionMagnetPos: (pos) => set((state) => {
    const deltaPos = Math.abs(pos - state.induction.magnetPos);
    const defl = deltaPos > 0.01 ? (pos > state.induction.magnetPos ? 1 : -1) * Math.min(deltaPos * 10 * state.induction.thrustSpeed, 1) : 0;
    const currentMA = defl * 80 * state.induction.thrustSpeed;
    return {
      induction: {
        ...state.induction,
        magnetPos: pos,
        moving: deltaPos > 0.01,
        deflection: defl,
        currentMA: parseFloat(currentMA.toFixed(1)),
        actions: [...state.induction.actions, { type: 'move_magnet', pos, time: Date.now() }],
      },
    };
  }),
  pushInductionMagnet: (dir) => set((state) => {
    const nextPos = Math.max(0, Math.min(1, state.induction.magnetPos + dir * 0.4));
    const defl = dir * Math.min(state.induction.thrustSpeed, 1.0);
    const currentMA = dir * 75 * state.induction.thrustSpeed;
    return {
      induction: {
        ...state.induction,
        magnetPos: nextPos,
        moving: true,
        deflection: defl,
        currentMA: parseFloat(currentMA.toFixed(1)),
        readings: [...state.induction.readings, {
          action: dir > 0 ? 'Plunge IN (N Pole)' : 'Pull OUT (N Pole)',
          speed: state.induction.thrustSpeed === 0.5 ? 'Slow' : (state.induction.thrustSpeed === 2.0 ? 'Fast ⚡' : 'Medium'),
          currentMA: (dir * 75 * state.induction.thrustSpeed).toFixed(1) + ' mA',
        }],
        actions: [...state.induction.actions, { type: 'push_magnet', dir, speed: state.induction.thrustSpeed, time: Date.now() }],
      },
    };
  }),
  stopInductionMagnet: () => set((state) => ({
    induction: { ...state.induction, moving: false, deflection: 0, currentMA: 0 },
  })),
  setInductionThrustSpeed: (speed) => set((state) => ({
    induction: { ...state.induction, thrustSpeed: speed },
  })),
  submitInduction: () => set((state) => ({
    induction: { ...state.induction, submitted: true },
  })),
  resetInduction: () => set({
    induction: { magnetPos: 0, moving: false, deflection: 0, currentMA: 0, thrustSpeed: 1.0, readings: [], submitted: false, actions: [] },
  }),

  // ── Report ──
  showReport: false,
  currentReport: null,
  setReport: (report) => set({ showReport: true, currentReport: report }),
  closeReport: () => set({ showReport: false, currentReport: null }),
  
  // ── Experiments History ──
  experiments: [],
  addExperiment: (exp) => set((state) => ({ experiments: [...state.experiments, exp] })),
  setExperiments: (experiments) => set({ experiments }),

  // ── Classroom Students (for faculty view) ──
  classroomStudents: [], // [{ id, name, experiments: [...] }]
  setClassroomStudents: (students) => set({ classroomStudents: students }),
}));

export default useGameStore;
