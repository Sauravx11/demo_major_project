/**
 * LandingPage.jsx
 * Full-featured public landing page: Navbar, Hero, Features, How It Works, Footer.
 * No sidebar. Renders outside AppLayout wrapper.
 * Routing: App.jsx maps "/" → LandingPage for unauthenticated users.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* ─── Data ─────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
];

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Powered Predictions',
    desc: 'Random Forest & Gradient Boosting models analyse attendance, study habits, and subject scores to predict final exam outcomes with high precision.',
    accent: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
  },
  {
    icon: '🚨',
    title: 'At-Risk Identification',
    desc: 'Instantly surface students with low attendance or accumulated backlogs so teachers can intervene before it is too late.',
    accent: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
  },
  {
    icon: '📊',
    title: 'Teacher Dashboard',
    desc: 'Interactive charts — scatter plots, bar graphs, and pie distributions — give a full-class performance overview at a glance.',
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
  },
  {
    icon: '💡',
    title: 'Smart Recommendations',
    desc: 'Each student receives personalised, actionable feedback on attendance, study hours, assignments, and backlogs.',
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
  },
  {
    icon: '🎯',
    title: 'Career Guidance',
    desc: 'Stream-aware career suggestions (Engineering, Medical, Finance, Humanities) derived from each student\'s academic trajectory.',
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
  },
  {
    icon: '📁',
    title: 'CSV Bulk Upload',
    desc: 'Import entire class rosters from a CSV file. The ML service auto-retrains on the new dataset instantly.',
    accent: '#06b6d4',
    bg: 'rgba(6,182,212,0.08)',
  },
];

const STEPS = [
  {
    num: '01',
    icon: '📋',
    title: 'Data Collection',
    desc: 'Teachers upload class data via CSV or students self-submit attendance, scores, and activity details.',
  },
  {
    num: '02',
    icon: '🔬',
    title: 'ML Analysis',
    desc: 'Our trained models process the data and predict each student\'s final marks and performance grade.',
  },
  {
    num: '03',
    icon: '📈',
    title: 'Insights Delivered',
    desc: 'Teachers see dashboard analytics; students receive recommendations and career guidance tailored to them.',
  },
  {
    num: '04',
    icon: '🎯',
    title: 'Continuous Improvement',
    desc: 'As more data is submitted, models are retrained automatically, improving accuracy over time.',
  },
];

const STATS = [
  { value: '95%+', label: 'Model Accuracy' },
  { value: 'Real-time', label: 'Predictions' },
  { value: '3 Streams', label: 'Science · Commerce · Arts' },
  { value: 'Multi-role', label: 'Teacher & Student Portals' },
];

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* Shrink navbar on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Smooth-scroll to section on nav-link click */
  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      setMenuOpen(false);
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="lp-root">
      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav__inner">
          {/* Logo */}
          <Link to="/" className="lp-nav__logo" id="lp-logo">
            <div className="lp-nav__logo-icon">🎓</div>
            <span>EduPredict <strong>AI</strong></span>
          </Link>

          {/* Desktop nav links */}
          <nav className="lp-nav__links" aria-label="Main navigation">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="lp-nav__link"
                onClick={(e) => handleNavClick(e, l.href)}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="lp-nav__actions">
            <Link to="/login"  className="btn btn-secondary lp-nav__btn" id="lp-nav-login">Sign In</Link>
            <Link to="/signup" className="btn btn-primary  lp-nav__btn" id="lp-nav-signup">Sign Up</Link>
          </div>

          {/* Hamburger (mobile) */}
          <button
            className={`lp-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile menu drawer */}
        {menuOpen && (
          <div className="lp-mobile-menu fade-in">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="lp-mobile-link"
                onClick={(e) => handleNavClick(e, l.href)}>
                {l.label}
              </a>
            ))}
            <div className="lp-mobile-actions">
              <Link to="/login"  className="btn btn-secondary" id="lp-mob-login"  onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/signup" className="btn btn-primary"   id="lp-mob-signup" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="lp-hero">
        {/* Animated background orbs */}
        <div className="lp-orb lp-orb--1" aria-hidden="true" />
        <div className="lp-orb lp-orb--2" aria-hidden="true" />
        <div className="lp-orb lp-orb--3" aria-hidden="true" />

        <div className="lp-hero__content fade-in">
          <div className="lp-hero__badge">🚀 Powered by Machine Learning</div>

          <h1 className="lp-hero__title">
            Predict Student Performance<br />
            <span className="lp-hero__title-accent">with Artificial Intelligence</span>
          </h1>

          <p className="lp-hero__subtitle">
            An intelligent academic analytics platform that helps teachers identify
            at-risk students early, delivers personalised improvement recommendations,
            and guides every student toward the right career path.
          </p>

          <div className="lp-hero__cta">
            <Link to="/signup" className="btn btn-primary  lp-hero__btn lp-hero__btn--primary" id="lp-hero-signup">
              🚀 Get Started — It's Free
            </Link>
            <Link to="/login"  className="btn btn-secondary lp-hero__btn" id="lp-hero-login">
              🔑 Sign In
            </Link>
          </div>

          {/* Trust badges */}
          <div className="lp-hero__tags">
            {['No credit card needed', 'AI-Powered', 'Multi-role Access', 'Real-time Insights'].map((t) => (
              <span key={t} className="lp-hero__tag">✓ {t}</span>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="lp-stats fade-in">
          {STATS.map((s) => (
            <div key={s.label} className="lp-stats__item">
              <div className="lp-stats__value">{s.value}</div>
              <div className="lp-stats__label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" className="lp-section lp-features">
        <div className="lp-section__inner">
          <div className="lp-section__header">
            <div className="lp-section__label">Platform Features</div>
            <h2 className="lp-section__title">Everything Your Institution Needs</h2>
            <p className="lp-section__subtitle">
              From bulk data ingestion to personalised career guidance — all in one unified platform.
            </p>
          </div>

          <div className="lp-features__grid">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="lp-feature-card"
                style={{ '--card-accent': f.accent, '--card-bg': f.bg }}
              >
                <div className="lp-feature-card__icon" aria-hidden="true">{f.icon}</div>
                <h3 className="lp-feature-card__title">{f.title}</h3>
                <p className="lp-feature-card__desc">{f.desc}</p>
                <div className="lp-feature-card__bar" aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section id="how-it-works" className="lp-section lp-how">
        <div className="lp-section__inner">
          <div className="lp-section__header">
            <div className="lp-section__label">Simple Workflow</div>
            <h2 className="lp-section__title">How It Works</h2>
            <p className="lp-section__subtitle">
              Four straightforward steps from raw data to actionable predictions.
            </p>
          </div>

          <div className="lp-how__grid">
            {STEPS.map((s, idx) => (
              <div key={s.num} className="lp-step">
                {/* Connector line (not on last) */}
                {idx < STEPS.length - 1 && <div className="lp-step__connector" aria-hidden="true" />}
                <div className="lp-step__num">{s.num}</div>
                <div className="lp-step__icon" aria-hidden="true">{s.icon}</div>
                <h3 className="lp-step__title">{s.title}</h3>
                <p className="lp-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ABOUT / CTA BAND
      ══════════════════════════════════════════ */}
      <section id="about" className="lp-section lp-cta-band">
        <div className="lp-cta-band__inner">
          <div className="lp-cta-band__orb lp-cta-band__orb--l" aria-hidden="true" />
          <div className="lp-cta-band__orb lp-cta-band__orb--r" aria-hidden="true" />
          <div className="lp-section__label" style={{ textAlign: 'center' }}>Ready to Begin?</div>
          <h2 className="lp-cta-band__title">
            Empower Every Student.<br />Equip Every Teacher.
          </h2>
          <p className="lp-cta-band__desc">
            Student Performance Prediction System combines machine learning, analytics, and
            personalised guidance into a single, easy-to-use platform — built for educators
            who care about measurable outcomes.
          </p>
          <div className="lp-cta-band__actions">
            <Link to="/signup" className="btn btn-primary  lp-hero__btn lp-hero__btn--primary" id="lp-cta-signup">
              🎓 Create Free Account
            </Link>
            <Link to="/login"  className="btn btn-secondary lp-hero__btn" id="lp-cta-login">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          {/* Brand */}
          <div className="lp-footer__brand">
            <div className="lp-footer__logo">
              <span className="lp-footer__logo-icon">🎓</span>
              <span className="lp-footer__logo-name">EduPredict <strong>AI</strong></span>
            </div>
            <p className="lp-footer__tagline">
              Intelligent academic analytics for modern educators and students.
            </p>
          </div>

          {/* Quick links */}
          <div className="lp-footer__col">
            <div className="lp-footer__col-title">Platform</div>
            <a href="#features"    className="lp-footer__link" onClick={(e) => handleNavClick(e, '#features')}>Features</a>
            <a href="#how-it-works" className="lp-footer__link" onClick={(e) => handleNavClick(e, '#how-it-works')}>How It Works</a>
            <a href="#about"       className="lp-footer__link" onClick={(e) => handleNavClick(e, '#about')}>About</a>
          </div>

          {/* Access */}
          <div className="lp-footer__col">
            <div className="lp-footer__col-title">Access</div>
            <Link to="/login"  className="lp-footer__link">Sign In</Link>
            <Link to="/signup" className="lp-footer__link">Sign Up</Link>
          </div>
        </div>

        <div className="lp-footer__bottom">
          <span>© {new Date().getFullYear()} Student Performance Prediction System. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
