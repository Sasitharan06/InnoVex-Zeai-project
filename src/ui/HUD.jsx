import React from 'react';
import useGameStore from '../store/gameStore';

export default function HUD() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const activeExperiment = useGameStore((s) => s.activeExperiment);
  const heldItem = useGameStore((s) => s.heldItem);
  const interactionPrompt = useGameStore((s) => s.interactionPrompt);
  const chemistry = useGameStore((s) => s.chemistry);
  const physics = useGameStore((s) => s.physics);
  const flameTest = useGameStore((s) => s.flameTest);
  const phTest = useGameStore((s) => s.phTest);
  const precipitation = useGameStore((s) => s.precipitation);
  const iodineClock = useGameStore((s) => s.iodineClock);
  const saltPrep = useGameStore((s) => s.saltPrep);
  const electrolysis = useGameStore((s) => s.electrolysis);
  const distillation = useGameStore((s) => s.distillation);
  const ohmsLaw = useGameStore((s) => s.ohmsLaw);
  const pendulum = useGameStore((s) => s.pendulum);
  const projectile = useGameStore((s) => s.projectile);
  const refraction = useGameStore((s) => s.refraction);
  const induction = useGameStore((s) => s.induction);
  const pointerLocked = useGameStore((s) => s.pointerLocked);

  const setFlameGuess = useGameStore((s) => s.setFlameGuess);
  const setPHGuess = useGameStore((s) => s.setPHGuess);
  const setOhmsVoltage = useGameStore((s) => s.setOhmsVoltage);
  const setPendulumLength = useGameStore((s) => s.setPendulumLength);
  const setPendulumAngle = useGameStore((s) => s.setPendulumAngle);
  const setProjectileAngle = useGameStore((s) => s.setProjectileAngle);
  const setProjectileVelocity = useGameStore((s) => s.setProjectileVelocity);
  const adjustProjectileAngle = useGameStore((s) => s.adjustProjectileAngle);
  const adjustProjectileVelocity = useGameStore((s) => s.adjustProjectileVelocity);
  const launchProjectile = useGameStore((s) => s.launchProjectile);
  const takeProjectileReading = useGameStore((s) => s.takeProjectileReading);
  const setRefractionAngle = useGameStore((s) => s.setRefractionAngle);
  const adjustRefractionAngle = useGameStore((s) => s.adjustRefractionAngle);
  const toggleRefractionBeam = useGameStore((s) => s.toggleRefractionBeam);
  const takeRefractionReading = useGameStore((s) => s.takeRefractionReading);
  const pushInductionMagnet = useGameStore((s) => s.pushInductionMagnet);
  const stopInductionMagnet = useGameStore((s) => s.stopInductionMagnet);
  const setInductionThrustSpeed = useGameStore((s) => s.setInductionThrustSpeed);
  const toggleOhmsDiagram = useGameStore((s) => s.toggleOhmsDiagram);

  const openGuideModal = useGameStore((s) => s.openGuideModal);
  const showReport = useGameStore((s) => s.showReport);
  const showGuideModal = useGameStore((s) => s.showGuideModal);

  // Automatically release pointer lock whenever modal opens so mouse cursor is visible!
  React.useEffect(() => {
    if (ohmsLaw.showOhmsDiagram || showReport || showGuideModal) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }, [ohmsLaw.showOhmsDiagram, showReport, showGuideModal]);

  // Close Ohm's Law diagram on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && ohmsLaw.showOhmsDiagram) {
        toggleOhmsDiagram();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ohmsLaw.showOhmsDiagram, toggleOhmsDiagram]);

  const roomNames = {
    hallway: '🏛️ Hallway',
    chemistry: '🧪 Chemistry Lab',
    physics: '⚡ Physics Lab',
  };

  const expNames = {
    'titration': 'Acid-Base Titration',
    'flame-test': 'Flame Test',
    'ph-test': 'pH Testing',
    'precipitation': 'Precipitation Reaction',
    'iodine-clock': 'Iodine Clock Reaction',
    'salt-prep': 'Salt Preparation',
    'electrolysis': 'Electrolysis of Water',
    'distillation': 'Distillation Setup',
    'circuit': 'Circuit Building',
    'ohms-law': "Ohm's Law Verification",
    'pendulum': 'Simple Pendulum',
    'projectile': 'Projectile Motion',
    'refraction': "Snell's Law Refraction",
    'induction': 'Electromagnetic Induction',
  };

  if (!pointerLocked) return null;

  const currentExp = activeExperiment || (currentRoom === 'chemistry' ? 'titration' : 'circuit');

  // ── Compute Current Live Tutorial Step ──
  const getTutorialStep = () => {
    if (currentExp === 'titration') {
      if (!chemistry.flaskPlaced && heldItem !== 'flask') return 'Step 1: Pick up Conical Flask from bench';
      if (heldItem === 'flask') return 'Step 2: Place Flask under Burette (press E)';
      if (chemistry.flaskPlaced && !chemistry.indicatorAdded) return 'Step 3: Add Phenolphthalein Indicator bottle to flask (press E)';
      if (chemistry.flaskPlaced && chemistry.indicatorAdded && chemistry.volumeAdded === 0) return 'Step 4: Press E on Burette to add titrant (NaOH)';
      if (chemistry.volumeAdded > 0 && !chemistry.endpointMarked) return 'Step 5: Solution turns pink! Click Mark Endpoint ✓ on table';
      return '🎉 Titration Complete!';
    }
    if (currentExp === 'flame-test') {
      if (!flameTest.selectedSample) return 'Step 1: Pick up a metal salt sample dish (Na, Cu, K, Ca, Li)';
      if (flameTest.selectedSample && !flameTest.flameActive) return 'Step 2: Hold sample over Bunsen burner flame (press E)';
      if (flameTest.flameActive && !flameTest.studentGuess) return 'Step 3: Observe flame color & select matching metal ion on HUD';
      if (flameTest.studentGuess && !flameTest.submitted) return 'Step 4: Click Submit Flame Test ✓ on table';
      return '🎉 Flame Test Complete!';
    }
    if (currentExp === 'ph-test') {
      if (!phTest.stripHeld && !phTest.stripDipped) return 'Step 1: Pick up indicator strip from bench (press E)';
      if (phTest.stripHeld && !phTest.stripDipped) return 'Step 2: Dip strip into a test tube (press E)';
      if (phTest.stripDipped && phTest.studentGuess === null) return 'Step 3: Compare strip color with wall chart & select pH guess on HUD';
      if (phTest.studentGuess !== null && !phTest.submitted) return 'Step 4: Click Submit pH Test ✓ on table';
      return '🎉 pH Test Complete!';
    }
    if (currentExp === 'precipitation') {
      if (!precipitation.beakerAAdded) return 'Step 1: Pour Solution A (AgNO₃) into central mixing beaker';
      if (precipitation.beakerAAdded && !precipitation.beakerBAdded) return 'Step 2: Pour Solution B (NaCl) into central mixing beaker';
      if (precipitation.precipitateFormed && !precipitation.submitted) return 'Step 3: White AgCl precipitate formed! Click Submit Result ✓';
      return '🎉 Precipitation Reaction Complete!';
    }
    if (currentExp === 'iodine-clock') {
      if (iodineClock.reagentsAdded === 0) return 'Step 1: Pour Reagent A (KIO₃) into mixing beaker';
      if (iodineClock.reagentsAdded === 1) return 'Step 2: Pour Reagent B (NaHSO₃ + starch) into mixing beaker';
      if (iodineClock.timerStarted && !iodineClock.studentStopTime) return 'Step 3: Watch liquid! Press Stop Timer! the INSTANT color flips';
      if (iodineClock.studentStopTime && !iodineClock.submitted) return 'Step 4: Click Submit Iodine Clock Result ✓ on table';
      return '🎉 Iodine Clock Complete!';
    }
    if (currentExp === 'salt-prep') {
      if (!saltPrep.heated) return 'Step 1: Press E on Bunsen burner to light heating flame';
      if (saltPrep.heated && !saltPrep.crystalsFormed) return 'Step 2: Solution heating... Observe water evaporating';
      if (saltPrep.crystalsFormed && !saltPrep.submitted) return 'Step 3: Salt crystals formed! Click Collect Salt Crystals ✓';
      return '🎉 Salt Preparation Complete!';
    }
    if (currentExp === 'electrolysis') {
      if (!electrolysis.powerOn) return 'Step 1: Aim crosshair at 12V DC Power Supply & press E to turn ON power';
      if (electrolysis.powerOn && !electrolysis.submitted) return 'Step 2: Press E on green table button OR click Analyze Gas Volumes button on right HUD panel ✓';
      return '🎉 Electrolysis Complete!';
    }
    if (currentExp === 'distillation') {
      if (!distillation.heating) return 'Step 1: Turn ON heating mantle under round-bottom flask';
      if (distillation.heating && distillation.distillateVolume < 0.5) return 'Step 2: Vapor travels through Liebig condenser jacket...';
      if (distillation.distillateVolume >= 0.5 && !distillation.submitted) return 'Step 3: Click Collect Purified Distillate ✓ on table';
      return '🎉 Distillation Complete!';
    }
    if (currentExp === 'circuit') {
      if (!physics.circuitComplete) return 'Step 1: Pick up components from tray & snap into all 5 breadboard slots';
      if (physics.circuitComplete && !physics.switchOn) return 'Step 2: Close switch to complete series circuit';
      if (physics.circuitComplete && physics.switchOn) return 'Step 3: LED illuminated! Click Submit Circuit for Assessment ✓';
      return '🎉 Circuit Building Complete!';
    }
    if (currentExp === 'ohms-law') {
      if (ohmsLaw.readings.length < 3) return `Step 1: Adjust Voltage (table knob or HUD slider) & click + Take Reading (${ohmsLaw.readings.length}/3+)`;
      if (ohmsLaw.readings.length >= 3 && !ohmsLaw.submitted) return `Step 2: ${ohmsLaw.readings.length} readings collected! Click Submit V-I Readings ✓ on table or HUD`;
      return "🎉 Ohm's Law Verification Complete!";
    }
    if (currentExp === 'pendulum') {
      if (!pendulum.released) return 'Step 1: Adjust Length & Angle sliders on HUD, then click Release Pendulum';
      if (pendulum.released && !pendulum.timerStop) return 'Step 2: Press E on Start/Stop Timer button to time 10 oscillations';
      if (pendulum.timerStop && !pendulum.submitted) return 'Step 3: Click Submit Pendulum Result ✓ on table';
      return '🎉 Simple Pendulum Complete!';
    }
    if (currentExp === 'projectile') {
      if (!projectile.launched) return 'Step 1: Adjust Launch Angle & Velocity sliders on HUD, then click Launch Projectile';
      if (projectile.launched && !projectile.submitted) return 'Step 2: Parabolic trajectory traced! Click Analyze Trajectory Data ✓';
      return '🎉 Projectile Motion Complete!';
    }
    if (currentExp === 'refraction') {
      if (!refraction.beamActive) return 'Step 1: Adjust Incident Angle slider on HUD & click Turn ON Laser Ray Beam';
      if (refraction.beamActive && !refraction.submitted) return "Step 2: Observe beam bending in glass. Click Verify Snell's Law ✓";
      return "🎉 Snell's Law Refraction Complete!";
    }
    if (currentExp === 'induction') {
      if (induction.deflection === 0) return 'Step 1: Press E on Bar Magnet to push/pull it through solenoid coil';
      if (induction.deflection !== 0 && !induction.submitted) return "Step 2: Galvanometer deflected! Click Verify Faraday's Law ✓";
      return '🎉 EM Induction Complete!';
    }
    return 'Explore the 3D lab environment';
  };

  const tutorialText = getTutorialStep();

  return (
    <div className="hud-overlay" style={{ pointerEvents: 'none' }}>
      {/* Crosshair */}
      <div className="crosshair" />

      {/* Live Tutorial Banner (Top Center) */}
      {currentRoom !== 'hallway' && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 15px rgba(56,189,248,0.2)',
            borderRadius: '30px',
            padding: '8px 20px',
            color: '#f8fafc',
            fontSize: '0.88rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 100,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '1rem' }}>💡</span>
          <span>{tutorialText}</span>
        </div>
      )}

      {/* Room & Experiment Indicator */}
      <div className="hud-room-indicator" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="room-dot" style={{
            background: currentRoom === 'chemistry' ? '#06b6d4' : currentRoom === 'physics' ? '#f97316' : '#6366f1'
          }} />
          <span>{roomNames[currentRoom] || 'Lab'}</span>
          {currentRoom !== 'hallway' && (
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '2px' }}>
              • {expNames[currentExp] || currentExp}
            </span>
          )}
        </div>

        {/* ⚡ View Circuit Schematic Button (for Physics Circuits) */}
        {currentRoom === 'physics' && (currentExp === 'ohms-law' || currentExp === 'circuit') && (
          <button
            onClick={toggleOhmsDiagram}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(139, 92, 246, 0.25)',
              border: '1px solid #8b5cf6',
              color: '#c4b5fd',
              borderRadius: '8px',
              padding: '3px 9px',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ⚡ View Circuit Schematic 📖
          </button>
        )}

        {currentRoom !== 'hallway' && (
          <button
            onClick={() => openGuideModal(currentExp)}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(99,102,241,0.25)',
              border: '1px solid rgba(99,102,241,0.5)',
              color: '#a5b4fc',
              borderRadius: '8px',
              padding: '3px 9px',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            📖 Pre-Lab Guide &amp; Formulas
          </button>
        )}
      </div>

      {/* ── READOUTS FOR CHEMISTRY EXPERIMENTS ── */}

      {/* Titration */}
      {currentRoom === 'chemistry' && currentExp === 'titration' && chemistry.flaskPlaced && (
        <div className="hud-readout">
          <h3>Titration</h3>
          <div>
            <span className="readout-value">{chemistry.volumeAdded.toFixed(1)}</span>
            <span className="readout-unit">mL added</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Target: ~{chemistry.equivalenceVolume.toFixed(1)} mL
          </div>
        </div>
      )}

      {/* Flame Test */}
      {currentRoom === 'chemistry' && currentExp === 'flame-test' && (
        <div className="hud-readout" style={{ pointerEvents: 'auto' }}>
          <h3>Flame Test</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '8px' }}>
            Sample: <strong style={{ color: '#38bdf8' }}>{flameTest.selectedSample || 'None selected'}</strong>
          </div>
          {flameTest.flameActive && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Which metal ion is this?</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['Na', 'Cu', 'K', 'Ca', 'Li'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setFlameGuess(m)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: flameTest.studentGuess === m ? '#06b6d4' : 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* pH Test */}
      {currentRoom === 'chemistry' && currentExp === 'ph-test' && (
        <div className="hud-readout" style={{ pointerEvents: 'auto' }}>
          <h3>pH Testing</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '8px' }}>
            Status: {phTest.stripDipped ? <span style={{ color: phTest.stripColor, fontWeight: 'bold' }}>Strip Dipped!</span> : 'Dip strip in solution'}
          </div>
          {phTest.stripDipped && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Estimate pH Value:</div>
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', maxWidth: '200px' }}>
                {[1, 3, 5, 7, 9, 11, 13].map((ph) => (
                  <button
                    key={ph}
                    onClick={() => setPHGuess(ph)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: phTest.studentGuess === ph ? '#10b981' : 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    pH {ph}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Precipitation */}
      {currentRoom === 'chemistry' && currentExp === 'precipitation' && (
        <div className="hud-readout">
          <h3>Precipitation</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            Solution A: {precipitation.beakerAAdded ? '✅ Added' : '⏳ Pending'}<br />
            Solution B: {precipitation.beakerBAdded ? '✅ Added' : '⏳ Pending'}
          </div>
          {precipitation.precipitateFormed && (
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
              ✨ Precipitate (AgCl) Formed!
            </div>
          )}
        </div>
      )}

      {/* Iodine Clock */}
      {currentRoom === 'chemistry' && currentExp === 'iodine-clock' && (
        <div className="hud-readout">
          <h3>Iodine Clock</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            Reagents: {iodineClock.reagentsAdded} / 2<br />
            State: {iodineClock.colorChanged ? <span style={{ color: '#38bdf8' }}>🔵 Color Flipped!</span> : (iodineClock.timerStarted ? '⏳ Reacting...' : 'Ready')}
          </div>
        </div>
      )}

      {/* Salt Prep */}
      {currentRoom === 'chemistry' && currentExp === 'salt-prep' && (
        <div className="hud-readout">
          <h3>Salt Preparation</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            Heating: {saltPrep.heated ? '🔥 Active' : 'Off (Press E on burner)'}<br />
            Evaporation: <strong>{(saltPrep.heatProgress * 100).toFixed(0)}%</strong>
          </div>
          {saltPrep.crystalsFormed && (
            <div style={{ fontSize: '0.75rem', color: '#eab308', marginTop: '4px' }}>
              💎 Crystals Formed on Evaporating Dish!
            </div>
          )}
        </div>
      )}

      {/* Electrolysis */}
      {currentRoom === 'chemistry' && currentExp === 'electrolysis' && (
        <div className="hud-readout" style={{ pointerEvents: 'auto' }}>
          <h3>Electrolysis of Water</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '6px' }}>
            Power Supply: {electrolysis.powerOn ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>⚡ 12V DC ON</span> : <span style={{ color: '#ef4444' }}>OFF (Press E on DC Supply)</span>}<br />
            Cathode (H₂ Gas): <strong style={{ color: '#38bdf8' }}>{(electrolysis.gasLevel * 20).toFixed(1)} mL</strong><br />
            Anode (O₂ Gas): <strong style={{ color: '#7dd3fc' }}>{(electrolysis.gasLevel * 10).toFixed(1)} mL</strong><br />
            Volume Ratio: <strong style={{ color: '#a7f3d0' }}>2 : 1 (H₂ : O₂)</strong>
          </div>
          {electrolysis.powerOn && !electrolysis.submitted && (
            <button
              onClick={async () => {
                const finalState = {
                  experimentType: 'electrolysis',
                  powerOn: electrolysis.powerOn,
                  hydrogenVolumeRatio: '2',
                  oxygenVolumeRatio: '1',
                  gasCollected: (electrolysis.gasLevel * 100).toFixed(0) + '%',
                };
                try {
                  const report = await generateReport('chemistry', finalState);
                  const saved = await saveExperiment(studentId, 'chemistry', electrolysis.actions, finalState, report.score, report, classroom?.id);
                  addExperiment({ ...saved, domain: 'chemistry', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
                  setReport(report);
                  resetElectrolysis();
                } catch (err) {
                  console.error('Electrolysis report failed:', err);
                }
              }}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #10b981',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
              }}
            >
              Analyze Gas Volumes (H₂ : O₂) ✓
            </button>
          )}
        </div>
      )}

      {/* Distillation */}
      {currentRoom === 'chemistry' && currentExp === 'distillation' && (
        <div className="hud-readout" style={{ pointerEvents: 'auto' }}>
          <h3>Distillation Apparatus</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '6px' }}>
            Mantle Heating: {distillation.heating ? <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔥 Boiling</span> : 'Off (Press E on mantle)'}<br />
            Purified Distillate: <strong style={{ color: '#38bdf8' }}>{(distillation.distillateVolume * 100).toFixed(1)} mL</strong>
          </div>
          {distillation.heating && !distillation.submitted && (
            <button
              onClick={async () => {
                const finalState = {
                  experimentType: 'distillation',
                  heating: distillation.heating,
                  distillateVolume: (distillation.distillateVolume * 100).toFixed(1) + ' mL',
                  distillationComplete: true,
                };
                try {
                  const report = await generateReport('chemistry', finalState);
                  const saved = await saveExperiment(studentId, 'chemistry', distillation.actions, finalState, report.score, report, classroom?.id);
                  addExperiment({ ...saved, domain: 'chemistry', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
                  setReport(report);
                  resetDistillation();
                } catch (err) {
                  console.error('Distillation report failed:', err);
                }
              }}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #10b981',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
              }}
            >
              Collect Purified Distillate ✓
            </button>
          )}
        </div>
      )}

      {/* ── READOUTS FOR PHYSICS EXPERIMENTS ── */}

      {/* Circuit */}
      {currentRoom === 'physics' && currentExp === 'circuit' && (
        <div className="hud-readout">
          <h3>Circuit</h3>
          <div>
            <span className="readout-value">{(physics.current * 1000).toFixed(1)}</span>
            <span className="readout-unit">mA</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {physics.voltage}V / {physics.resistance}Ω
            {physics.circuitComplete ? ' ✅ Complete' : ' ⬜ Incomplete'}
          </div>
        </div>
      )}

      {/* Ohm's Law */}
      {currentRoom === 'physics' && currentExp === 'ohms-law' && (
        <div className="hud-readout" style={{ pointerEvents: 'auto', minWidth: '220px' }}>
          <h3>Ohm's Law (V = IR)</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '6px' }}>
            Voltage: <strong style={{ color: '#38bdf8' }}>{ohmsLaw.voltage} V</strong> &nbsp;|&nbsp;
            Current: <strong style={{ color: '#f472b6' }}>{((ohmsLaw.voltage / ohmsLaw.resistance) * 1000).toFixed(1)} mA</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>DC Voltage:</span>
            <input
              type="range"
              min="2"
              max="12"
              step="2"
              value={ohmsLaw.voltage}
              onChange={(e) => setOhmsVoltage(Number(e.target.value))}
              style={{ width: '100px', cursor: 'pointer' }}
            />
          </div>

          {/* Action Buttons on HUD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
            <button
              onClick={toggleOhmsDiagram}
              style={{
                width: '100%',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #8b5cf6',
                background: 'rgba(139, 92, 246, 0.3)',
                color: '#c4b5fd',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              ⚡ View Circuit Diagram 📖
            </button>
            <button
              onClick={() => takeOhmsReading()}
              style={{
                width: '100%',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #06b6d4',
                background: '#06b6d4',
                color: '#fff',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              + Take V-I Reading #{ohmsLaw.readings.length + 1} ({ohmsLaw.voltage}V, {((ohmsLaw.voltage / ohmsLaw.resistance) * 1000).toFixed(1)}mA)
            </button>

            {ohmsLaw.readings.length >= 3 && !ohmsLaw.submitted && (
              <button
                onClick={async () => {
                  const state = useGameStore.getState().ohmsLaw;
                  const readings = state.readings;
                  let resistanceComputed = state.resistance;
                  if (readings.length >= 2) {
                    const sumVI = readings.reduce((s, r) => s + r.voltage * r.current, 0);
                    const sumI2 = readings.reduce((s, r) => s + r.current * r.current, 0);
                    if (sumI2 > 0) resistanceComputed = sumVI / sumI2;
                  }
                  const accuracy = Math.max(0, 100 - Math.abs(resistanceComputed - state.resistance) / state.resistance * 100);
                  const finalState = {
                    experimentType: 'ohms-law',
                    readings,
                    resistanceComputed: resistanceComputed.toFixed(1),
                    expectedResistance: state.resistance,
                    accuracy: accuracy.toFixed(1),
                  };
                  try {
                    const report = await generateReport('physics', finalState);
                    const saved = await saveExperiment(studentId, 'physics', state.actions, finalState, report.score, report, classroom?.id);
                    addExperiment({ ...saved, domain: 'physics', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
                    setReport(report);
                    resetOhmsLaw();
                  } catch (err) {
                    console.error('Ohms law report failed:', err);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #10b981',
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
                }}
              >
                Submit {ohmsLaw.readings.length} Readings & Plot V-I ✓
              </button>
            )}
          </div>

          {/* Collected Readings Table */}
          {ohmsLaw.readings.length > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: '#94a3b8', marginBottom: '2px', fontWeight: 'bold' }}>Collected Data Points ({ohmsLaw.readings.length}):</div>
              {ohmsLaw.readings.map((r, i) => (
                <div key={i}>
                  #{i + 1}: {r.voltage}V ➔ {(r.current * 1000).toFixed(1)}mA
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pendulum */}
      {currentRoom === 'physics' && currentExp === 'pendulum' && (
        <div className="hud-readout" style={{ pointerEvents: 'auto' }}>
          <h3>Simple Pendulum</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '6px' }}>
            Length: <strong>{pendulum.length.toFixed(1)} m</strong> &nbsp;|&nbsp;
            Angle: <strong>{pendulum.initialAngle}°</strong>
          </div>
          {!pendulum.released && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', width: '45px' }}>Length:</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={pendulum.length}
                  onChange={(e) => setPendulumLength(Number(e.target.value))}
                  style={{ width: '90px', cursor: 'pointer' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', width: '45px' }}>Angle:</span>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={pendulum.initialAngle}
                  onChange={(e) => setPendulumAngle(Number(e.target.value))}
                  style={{ width: '90px', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}
          {pendulum.released && (
            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
              {pendulum.timerRunning ? '⏱️ Stopwatch running...' : (pendulum.timerStop ? '✅ 10 swings timed!' : 'Press E on Stop button after 10 swings')}
            </div>
          )}
        </div>
      )}

      {/* Projectile Motion */}
      {currentRoom === 'physics' && currentExp === 'projectile' && (
        <div className="hud-readout" style={{ pointerEvents: 'auto', minWidth: '240px' }}>
          <h3>Projectile Motion</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '8px' }}>
            Launch Angle: <strong style={{ color: '#38bdf8' }}>{projectile.angle}°</strong> &nbsp;|&nbsp;
            Speed: <strong style={{ color: '#f472b6' }}>{projectile.velocity} m/s</strong>
          </div>

          {/* ── Separate Button Controls for Angle & Speed ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            {/* Angle Step Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Angle (θ):</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => adjustProjectileAngle(-5)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #38bdf8',
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  -5°
                </button>
                <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 'bold', width: '32px', textAlign: 'center' }}>
                  {projectile.angle}°
                </span>
                <button
                  onClick={() => adjustProjectileAngle(5)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #38bdf8',
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  +5°
                </button>
              </div>
            </div>

            {/* Velocity Step Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Velocity (v₀):</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => adjustProjectileVelocity(-2)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #f472b6',
                    background: 'rgba(244, 114, 182, 0.2)',
                    color: '#f472b6',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  -2m/s
                </button>
                <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 'bold', width: '42px', textAlign: 'center' }}>
                  {projectile.velocity}m/s
                </span>
                <button
                  onClick={() => adjustProjectileVelocity(2)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #f472b6',
                    background: 'rgba(244, 114, 182, 0.2)',
                    color: '#f472b6',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  +2m/s
                </button>
              </div>
            </div>
          </div>

          {/* Action Launch & Record Button */}
          <button
            onClick={() => {
              launchProjectile();
              takeProjectileReading();
            }}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #f59e0b',
              background: '#f59e0b',
              color: '#0f172a',
              fontWeight: '800',
              fontSize: '0.78rem',
              cursor: 'pointer',
              marginBottom: '8px',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
            }}
          >
            🚀 Launch Cannon ({projectile.angle}°, {projectile.velocity}m/s)
          </button>

          {/* Submit Action Button */}
          {projectile.launched && !projectile.submitted && (
            <button
              onClick={async () => {
                const state = useGameStore.getState().projectile;
                const rad = (state.angle * Math.PI) / 180;
                const vy = state.velocity * Math.sin(rad);
                const flightTime = (2 * vy) / 9.81;
                const finalState = {
                  experimentType: 'projectile',
                  launchAngle: state.angle + '°',
                  initialVelocity: state.velocity + ' m/s',
                  flightTime: flightTime.toFixed(2) + ' s',
                  rangeDistance: state.maxDistance.toFixed(2) + ' m',
                  readings: state.readings,
                };
                try {
                  const report = await generateReport('physics', finalState);
                  const saved = await saveExperiment(
                    useGameStore.getState().studentId,
                    'physics',
                    state.actions,
                    finalState,
                    report.score,
                    report,
                    useGameStore.getState().classroom?.id
                  );
                  useGameStore.getState().addExperiment({ ...saved, domain: 'physics', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
                  useGameStore.getState().setReport(report);
                  useGameStore.getState().resetProjectile();
                } catch (err) {
                  console.error('Projectile report error:', err);
                }
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #10b981',
                background: '#10b981',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.78rem',
                cursor: 'pointer',
                marginBottom: '8px',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
              }}
            >
              Submit Trajectory Data ✓
            </button>
          )}

          {/* Live Readings Table */}
          {projectile.readings && projectile.readings.length > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: '#94a3b8', marginBottom: '2px', fontWeight: 'bold' }}>Recorded Trajectories ({projectile.readings.length}):</div>
              {projectile.readings.map((r, i) => (
                <div key={i}>
                  #{i + 1}: {r.angle}° @ {r.velocity}m/s ➔ R={r.range}m, H={r.maxHeight}m
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Refraction (Snell's Law) */}
      {currentRoom === 'physics' && currentExp === 'refraction' && (
        <div className="hud-readout" style={{ pointerEvents: 'auto', minWidth: '240px' }}>
          <h3>Snell's Law (Refraction)</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '8px' }}>
            Incident Angle (θ₁): <strong style={{ color: '#38bdf8' }}>{refraction.incidentAngle}°</strong><br />
            Refracted Angle (θ₂): <strong style={{ color: '#10b981' }}>
              {((Math.asin((1.0 * Math.sin((refraction.incidentAngle * Math.PI) / 180)) / 1.5) * 180) / Math.PI).toFixed(1)}°
            </strong>
          </div>

          {/* ── Separate Angle Adjustment Step Buttons ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Incident Angle (θ₁):</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => adjustRefractionAngle(-5)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid #38bdf8',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  fontWeight: '700',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                -5°
              </button>
              <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 'bold', width: '32px', textAlign: 'center' }}>
                {refraction.incidentAngle}°
              </span>
              <button
                onClick={() => adjustRefractionAngle(5)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid #38bdf8',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  fontWeight: '700',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                +5°
              </button>
            </div>
          </div>

          {/* Action Laser Beam Toggle & Record Button */}
          <button
            onClick={() => {
              toggleRefractionBeam();
              takeRefractionReading();
            }}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${refraction.beamActive ? '#ef4444' : '#38bdf8'}`,
              background: refraction.beamActive ? '#ef4444' : '#38bdf8',
              color: '#fff',
              fontWeight: '800',
              fontSize: '0.78rem',
              cursor: 'pointer',
              marginBottom: '8px',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
            }}
          >
            {refraction.beamActive ? '🛑 Turn OFF Laser Beam' : `⚡ Turn ON Laser Ray (${refraction.incidentAngle}°)`}
          </button>

          {/* Submit Action Button */}
          {refraction.beamActive && !refraction.submitted && (
            <button
              onClick={async () => {
                const state = useGameStore.getState().refraction;
                const theta1Rad = (state.incidentAngle * Math.PI) / 180;
                const theta2Rad = Math.asin((1.0 * Math.sin(theta1Rad)) / 1.5);
                const theta2Deg = (theta2Rad * 180) / Math.PI;
                const finalState = {
                  experimentType: 'refraction',
                  incidentAngle: state.incidentAngle + '°',
                  refractedAngleComputed: theta2Deg.toFixed(1) + '°',
                  refractiveIndex: state.refractiveIndex,
                  readings: state.readings,
                  snellsLawVerified: true,
                };
                try {
                  const report = await generateReport('physics', finalState);
                  const saved = await saveExperiment(
                    useGameStore.getState().studentId,
                    'physics',
                    state.actions,
                    finalState,
                    report.score,
                    report,
                    useGameStore.getState().classroom?.id
                  );
                  useGameStore.getState().addExperiment({ ...saved, domain: 'physics', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
                  useGameStore.getState().setReport(report);
                  useGameStore.getState().resetRefraction();
                } catch (err) {
                  console.error('Refraction report error:', err);
                }
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #10b981',
                background: '#10b981',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.78rem',
                cursor: 'pointer',
                marginBottom: '8px',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
              }}
            >
              Submit Snell's Law Data ✓
            </button>
          )}

          {/* Live Readings Table */}
          {refraction.readings && refraction.readings.length > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: '#94a3b8', marginBottom: '2px', fontWeight: 'bold' }}>Recorded Data ({refraction.readings.length}):</div>
              {refraction.readings.map((r, i) => (
                <div key={i}>
                  #{i + 1}: θ₁={r.incidentAngle}° ➔ θ₂={r.refractedAngle}° (sinθ₁/sinθ₂ = {r.ratio})
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EM Induction */}
      {currentRoom === 'physics' && currentExp === 'induction' && (
        <div className="hud-readout" style={{ pointerEvents: 'auto', minWidth: '240px' }}>
          <h3>EM Induction (Faraday's Law)</h3>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '8px' }}>
            Induced Current (I): <strong style={{ color: induction.currentMA > 0 ? '#10b981' : (induction.currentMA < 0 ? '#ef4444' : '#64748b') }}>
              {induction.currentMA > 0 ? `+${induction.currentMA}` : induction.currentMA} mA
            </strong><br />
            Speed: <strong style={{ color: '#8b5cf6' }}>
              {induction.thrustSpeed === 0.5 ? 'Slow' : (induction.thrustSpeed === 2.0 ? 'Fast ⚡' : 'Medium')}
            </strong>
          </div>

          {/* Action Thrust Controls */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <button
              onClick={() => pushInductionMagnet(1)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '6px',
                border: '1px solid #10b981',
                background: '#10b981',
                color: '#fff',
                fontWeight: '700',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ⬅ Plunge IN
            </button>
            <button
              onClick={() => pushInductionMagnet(-1)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '6px',
                border: '1px solid #ef4444',
                background: '#ef4444',
                color: '#fff',
                fontWeight: '700',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ➡ Pull OUT
            </button>
            <button
              onClick={() => {
                const nextSpeed = induction.thrustSpeed === 0.5 ? 1.0 : (induction.thrustSpeed === 1.0 ? 2.0 : 0.5);
                setInductionThrustSpeed(nextSpeed);
              }}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid #8b5cf6',
                background: 'rgba(139, 92, 246, 0.3)',
                color: '#c4b5fd',
                fontWeight: '700',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ⚡ Speed
            </button>
          </div>

          {/* Submit Action Button */}
          {induction.readings && induction.readings.length >= 1 && !induction.submitted && (
            <button
              onClick={async () => {
                const state = useGameStore.getState().induction;
                const finalState = {
                  experimentType: 'induction',
                  faradaysLawVerified: true,
                  readings: state.readings,
                  thrustSpeed: state.thrustSpeed,
                  inducedEMF: 'Proportional to rate of magnetic flux change (-N dΦ/dt)',
                };
                try {
                  const report = await generateReport('physics', finalState);
                  const saved = await saveExperiment(
                    useGameStore.getState().studentId,
                    'physics',
                    state.actions,
                    finalState,
                    report.score,
                    report,
                    useGameStore.getState().classroom?.id
                  );
                  useGameStore.getState().addExperiment({ ...saved, domain: 'physics', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
                  useGameStore.getState().setReport(report);
                  useGameStore.getState().resetInduction();
                } catch (err) {
                  console.error('Induction report error:', err);
                }
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #10b981',
                background: '#10b981',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.78rem',
                cursor: 'pointer',
                marginBottom: '8px',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
              }}
            >
              Submit Faraday's Law Data ✓
            </button>
          )}

          {/* Live Recorded Induction Data Table */}
          {induction.readings && induction.readings.length > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: '#94a3b8', marginBottom: '2px', fontWeight: 'bold' }}>Recorded Flux Readings ({induction.readings.length}):</div>
              {induction.readings.map((r, i) => (
                <div key={i}>
                  #{i + 1}: {r.action} ({r.speed}) ➔ I = {r.currentMA}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ohm's Law Circuit Diagram Modal Overlay */}
      {ohmsLaw.showOhmsDiagram && (
        <div
          onClick={toggleOhmsDiagram}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '540px',
              width: '90%',
              color: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              fontFamily: 'Inter, system-ui, sans-serif',
              cursor: 'default',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📖</span> Ohm's Law Circuit Diagram (V = IR)
              </h2>
              <button
                onClick={toggleOhmsDiagram}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.2rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* SVG Schematic Diagram */}
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155', textAlign: 'center', marginBottom: '16px' }}>
              <svg viewBox="0 0 400 220" style={{ width: '100%', height: 'auto', maxHeight: '200px' }}>
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

            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '16px' }}>
              <strong>Key Circuit Rules for Ohm's Law (V = IR):</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '6px', margin: '4px 0' }}>
                <li><strong style={{ color: '#ef4444' }}>Ammeter (A):</strong> Connected in <em>Series</em> to measure total current I flowing through the circuit.</li>
                <li><strong style={{ color: '#38bdf8' }}>Voltmeter (V):</strong> Connected in <em>Parallel</em> across Resistor R to measure potential difference V.</li>
                <li><strong style={{ color: '#a7f3d0' }}>Switch (K):</strong> Close the switch key to allow current to flow and take V-I readings!</li>
              </ul>
            </div>

            <button
              onClick={toggleOhmsDiagram}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: '#38bdf8',
                color: '#0f172a',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Got It — Build Circuit Now! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Interaction Prompt (Clickable + Press E/Space/Enter) */}
      {interactionPrompt && (
        <div
          className="interaction-prompt"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onClick={() => {
            if (interactionPrompt.action) {
              interactionPrompt.action();
            }
          }}
        >
          <kbd>E</kbd> {interactionPrompt.text}
        </div>
      )}

      {/* Held Item */}
      {heldItem && (
        <div className="hud-held-item">
          <span className="held-icon">📦</span>
          Holding: {heldItem}
        </div>
      )}

      {/* Controls Help */}
      <div className="controls-help">
        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move &nbsp;|&nbsp;
        <kbd>Mouse</kbd> Look &nbsp;|&nbsp;
        <kbd>E</kbd> Interact &nbsp;|&nbsp;
        <kbd>ESC</kbd> Menu
      </div>
    </div>
  );
}
