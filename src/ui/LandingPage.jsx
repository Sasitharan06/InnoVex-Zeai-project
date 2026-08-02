import React, { useEffect, useRef, useState } from 'react';
import useGameStore from '../store/gameStore';
import {
  FlaskConical, Zap, Sparkles, Microscope, School, BarChart3,
  GraduationCap, Beaker, Flame, Droplets, TestTubes, Atom,
  CircuitBoard, Lightbulb, Gauge, ArrowRight, ChevronDown,
  ShieldCheck, Users, Radio, BookOpen, Award, Rocket, Play,
  CheckCircle2, Clock, Eye
} from 'lucide-react';

/* ── Intersection Observer hook for scroll reveal ── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Single experiment card ── */
function ExperimentCard({ icon, title, desc, difficulty, index, image }) {
  const [ref, visible] = useReveal(0.1);
  const diffColors = {
    easy: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#34d399', label: 'Easy' },
    medium: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24', label: 'Medium' },
    hard: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#f87171', label: 'Advanced' },
  };
  const d = diffColors[difficulty];
  return (
    <div
      ref={ref}
      className={`lp-exp-card ${image ? 'lp-exp-card--has-image' : ''}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${index * 80}ms`,
      }}
    >
      {image ? (
        <div className="lp-exp-thumb-wrap">
          <img src={image} className="lp-exp-thumb" alt={title} />
        </div>
      ) : (
        <div className="lp-exp-icon">{icon}</div>
      )}
      <div className="lp-exp-body">
        <h4 className="lp-exp-title">{title}</h4>
        <p className="lp-exp-desc">{desc}</p>
      </div>
      <span className="lp-exp-diff" style={{ background: d.bg, borderColor: d.border, color: d.text }}>
        {d.label}
      </span>
    </div>
  );
}

/* ── Section wrapper with scroll reveal ── */
function RevealSection({ children, className = '', id, style }) {
  const [ref, visible] = useReveal(0.1);
  return (
    <section
      ref={ref}
      id={id}
      className={`lp-section ${className} ${visible ? 'lp-visible' : ''}`}
      style={style}
    >
      {children}
    </section>
  );
}

/* ── Stat counter ── */
function StatCounter({ icon, value, label, delay = 0 }) {
  const [ref, visible] = useReveal(0.2);
  return (
    <div
      ref={ref}
      className="lp-stat"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="lp-stat-icon">{icon}</div>
      <div className="lp-stat-value">{value}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

/* ── Feature card (with its own hook instance) ── */
function FeatureCard({ icon, title, desc, index }) {
  const [ref, visible] = useReveal(0.1);
  return (
    <div
      ref={ref}
      className="lp-feature-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="lp-feature-icon">{icon}</div>
      <h3 className="lp-feature-title">{title}</h3>
      <p className="lp-feature-desc">{desc}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const el = document.getElementById('lp-scroll');
    if (!el) return;
    const handle = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', handle, { passive: true });
    return () => el.removeEventListener('scroll', handle);
  }, []);

  const chemExperiments = [
    { icon: <Beaker size={22} />, title: 'Acid-Base Titration', desc: 'Burette + indicator color change at equivalence point.', difficulty: 'easy', image: '/exp_titration.png' },
    { icon: <Flame size={22} />, title: 'Flame Test', desc: 'Hold sample near Bunsen burner — flame changes color per metal ion.', difficulty: 'easy', image: '/exp_flame.png' },
    { icon: <Droplets size={22} />, title: 'pH Testing (Litmus)', desc: 'Dip strip in solution, color changes based on pH value.', difficulty: 'easy', image: '/exp_litmus.png' },
    { icon: <TestTubes size={22} />, title: 'Precipitation Reaction', desc: 'Mix two clear solutions — resulting liquid turns cloudy.', difficulty: 'easy', image: '/exp_precipitation.png' },
    { icon: <FlaskConical size={22} />, title: 'Salt Preparation', desc: 'Acid + base neutralization → crystallization on evaporating dish.', difficulty: 'medium', image: '/exp_saltprep.png' },
    { icon: <Zap size={22} />, title: 'Electrolysis of Water', desc: 'Electrodes in water — bubbles form, gas tubes fill over time.', difficulty: 'medium', image: '/exp_electrolysis.png' },
    { icon: <Clock size={22} />, title: 'Iodine Clock Reaction', desc: 'Mix reagents — solution stays clear then suddenly turns blue-black.', difficulty: 'medium', image: '/exp_iodine.png' },
    { icon: <Atom size={22} />, title: 'Distillation Setup', desc: 'Liquid heats → vapor rises → condenses in a separate flask.', difficulty: 'hard', image: '/exp_distillation.png' },
  ];

  const physExperiments = [
    { icon: <CircuitBoard size={22} />, title: 'Simple Circuit Building', desc: 'Battery, resistor, LED, switch — assemble on a breadboard.', difficulty: 'easy', image: '/exp_simple_circuit.png' },
    { icon: <Lightbulb size={22} />, title: 'Series vs Parallel', desc: 'Arrange components differently — bulb brightness changes.', difficulty: 'easy', image: '/exp_series_parallel.png' },
    { icon: <Gauge size={22} />, title: "Ohm's Law Verification", desc: 'Adjust voltage/resistance sliders — ammeter updates, plots V vs I.', difficulty: 'easy', image: '/exp_ohms_law.png' },
    { icon: <Radio size={22} />, title: 'Simple Pendulum', desc: 'Change length/mass — measure time period with real physics.', difficulty: 'easy', image: '/exp_pendulum.png' },
    { icon: <BarChart3 size={22} />, title: 'Ohmic vs Non-Ohmic', desc: 'Swap resistor type — graph curve changes shape.', difficulty: 'medium', image: '/exp_ohmic.png' },
    { icon: <Rocket size={22} />, title: 'Projectile Motion', desc: 'Set launch angle/velocity — ball launches, trajectory traced.', difficulty: 'medium', image: '/exp_projectile.png' },
    { icon: <Eye size={22} />, title: "Snell's Law (Refraction)", desc: 'Light ray hits glass block at angle — bends through medium.', difficulty: 'medium', image: '/exp_snells_law.png' },
    { icon: <Sparkles size={22} />, title: 'Electromagnetic Induction', desc: 'Magnet moves through coil — galvanometer needle deflects.', difficulty: 'hard', image: '/exp_induction.png' },
  ];

  const features = [
    { icon: <Microscope size={28} />, title: 'Immersive 3D Labs', desc: 'Walk through a fully rendered virtual laboratory in your browser.' },
    { icon: <Sparkles size={28} />, title: 'AI-Powered Assessment', desc: 'Get instant AI reports grading your experiment technique & accuracy.' },
    { icon: <School size={28} />, title: 'Google Classroom Style', desc: 'Teachers create classrooms, students join with a code — live roster.' },
    { icon: <BarChart3 size={28} />, title: 'Analytics Dashboard', desc: 'Real-time performance charts, score distributions & AI insights.' },
    { icon: <BookOpen size={28} />, title: 'Multi-Domain Experiments', desc: 'Chemistry titrations, physics circuits, and many more planned.' },
    { icon: <ShieldCheck size={28} />, title: 'Safe & Accessible', desc: 'No chemicals, no equipment — every student gets unlimited lab access.' },
  ];

  return (
    <div className="lp-root" id="lp-scroll">

      {/* ═══ HERO ═══ */}
      <section className="lp-hero" ref={heroRef}>
        {/* Parallax BG elements */}
        <div className="lp-hero-orb lp-orb-1" style={{ transform: `translateY(${scrollY * 0.3}px)` }} />
        <div className="lp-hero-orb lp-orb-2" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
        <div className="lp-hero-grid" />

        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            🏆 AI-POWERED IMMERSIVE STEM EDUCATION PLATFORM
          </div>
          <h1 className="lp-hero-title">
            <span className="lp-hero-gradient">VirtuLab</span>
            <br />
            <span className="lp-hero-sub">Reimagining Science Education Through AI & Interactive 3D Laboratories</span>
          </h1>
          <p className="lp-hero-desc">
            VirtuLab is a next-generation AI-powered virtual laboratory that transforms STEM education through immersive 3D simulations. Perform realistic chemistry and physics experiments, receive intelligent AI guidance, generate instant lab reports, and develop practical skills in a safe, browser-based environment—anytime, anywhere.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn lp-btn-primary" onClick={() => setScreen('start')}>
              🚀 Launch VirtuLab
            </button>
            <a href="#experiments" className="lp-btn lp-btn-ghost">
              🧪 Explore Experiments
            </a>
          </div>

          <div className="lp-hero-stats">
            <StatCounter value="16+" label="Interactive STEM Experiments" delay={100} />
            <StatCounter value="2" label="Immersive 3D Laboratory Environments" delay={200} />
            <StatCounter value="AI" label="Smart AI Lab Mentor" delay={300} />
            <StatCounter value="24/7" label="Learn Anytime, Anywhere" delay={400} />
          </div>
        </div>

        <div className="lp-hero-visual">
          <img
            src="/hero_3d_lab.png"
            alt="VirtuLab 3D Virtual Lab"
            className="lp-hero-img"
            style={{ transform: `translateY(${scrollY * -0.08}px)` }}
          />
        </div>

        <a href="#features" className="lp-scroll-cue">
          <span>Scroll to explore</span>
          <ChevronDown size={20} className="lp-bounce" />
        </a>
      </section>

      {/* ═══ FEATURES ═══ */}
      <RevealSection id="features" className="lp-features-section">
        <div className="lp-section-header">
          <span className="lp-section-chip"><Sparkles size={14} /> Platform Features</span>
          <h2 className="lp-section-title">Everything you need for virtual science education</h2>
          <p className="lp-section-desc">A complete virtual lab environment built for students, teachers, and institutions.</p>
        </div>
        <div className="lp-features-grid">
          {features.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} index={i} />
          ))}
        </div>
      </RevealSection>

      {/* ═══ SHOWCASE IMAGES ═══ */}
      <RevealSection className="lp-showcase-section">
        <div className="lp-showcase-grid">
          <div className="lp-showcase-card">
            <img src="/chemistry_3d_card.png" alt="Chemistry Lab" />
            <div className="lp-showcase-overlay">
              <FlaskConical size={24} />
              <span>Chemistry Titration Lab</span>
            </div>
          </div>
          <div className="lp-showcase-card">
            <img src="/physics_3d_card.png" alt="Physics Lab" />
            <div className="lp-showcase-overlay">
              <Zap size={24} />
              <span>Physics Circuit Lab</span>
            </div>
          </div>
          <div className="lp-showcase-card">
            <img src="/teacher_3d_card.png" alt="Teacher Analytics" />
            <div className="lp-showcase-overlay">
              <BarChart3 size={24} />
              <span>AI Analytics Portal</span>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ CHEMISTRY EXPERIMENTS ═══ */}
      <RevealSection id="experiments" className="lp-experiments-section">
        <div className="lp-section-header">
          <span className="lp-section-chip" style={{ background: 'rgba(6,182,212,0.12)', borderColor: 'rgba(6,182,212,0.3)', color: '#22d3ee' }}>
            <FlaskConical size={14} /> Chemistry
          </span>
          <h2 className="lp-section-title">Chemistry Experiments</h2>
          <p className="lp-section-desc">From titrations to electrolysis — perform real chemistry safely in the browser.</p>
        </div>
        <div className="lp-exp-grid">
          {chemExperiments.map((exp, i) => (
            <ExperimentCard key={i} {...exp} index={i} />
          ))}
        </div>
      </RevealSection>

      {/* ═══ PHYSICS EXPERIMENTS ═══ */}
      <RevealSection className="lp-experiments-section">
        <div className="lp-section-header">
          <span className="lp-section-chip" style={{ background: 'rgba(249,115,22,0.12)', borderColor: 'rgba(249,115,22,0.3)', color: '#fb923c' }}>
            <Zap size={14} /> Physics
          </span>
          <h2 className="lp-section-title">Physics Experiments</h2>
          <p className="lp-section-desc">Build circuits, launch projectiles, and explore optics — real physics engine powered.</p>
        </div>
        <div className="lp-exp-grid">
          {physExperiments.map((exp, i) => (
            <ExperimentCard key={i} {...exp} index={i} />
          ))}
        </div>
      </RevealSection>

      {/* ═══ CTA ═══ */}
      <RevealSection className="lp-cta-section">
        <div className="lp-cta-inner">
          <div className="lp-cta-orb" />
          <Sparkles size={32} className="lp-cta-sparkle" />
          <h2 className="lp-cta-title">Ready to enter the virtual lab?</h2>
          <p className="lp-cta-desc">
            Create your free student or teacher account and start experimenting in minutes.
          </p>
          <button className="lp-btn lp-btn-cta lp-btn-lg" onClick={() => setScreen('start')}>
            <Rocket size={22} /> Launch VirtuLab
          </button>
          <div className="lp-cta-meta">
            <span><ShieldCheck size={14} /> Secure</span>
            <span><Users size={14} /> Free Access</span>
            <span><GraduationCap size={14} /> #MadeInIndia</span>
          </div>
        </div>
      </RevealSection>

      {/* ═══ FOOTER ═══ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <FlaskConical size={20} style={{ color: '#8b5cf6' }} />
            <span>VirtuLab</span>
          </div>
          <span className="lp-footer-copy">© 2026 VirtuLab — Virtual Laboratory Simulator · #MadeInIndia</span>
        </div>
      </footer>
    </div>
  );
}
