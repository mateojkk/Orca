import { useEffect, useRef, useState } from 'react';
import styles from '../styles/landing.module.css';

interface LandingPageProps {
  onOpenAuth: () => void;
}

const FEATURES = [
  {
    icon: '⬡',
    tag: 'PRIVACY',
    title: 'Complete Anonymity',
    body: 'Your balance and transfer amounts are completely hidden. Nobody on the internet can see what you hold or where you send it.',
  },
  {
    icon: '◈',
    tag: 'FREE',
    title: 'Zero Gas Fees',
    body: "We cover all the network fees for you. You'll never need to worry about holding extra ETH just to make a simple transfer.",
  },
  {
    icon: '⌘',
    tag: 'EASY',
    title: 'Talk to Transact',
    body: 'Send and receive money using plain English. Just type "send 50 to Alice" and it\'s done. No complicated forms or pop-ups.',
  },
  {
    icon: '⊕',
    tag: 'ACCESS',
    title: 'Simple Login',
    body: 'Sign in securely with just your email. There are no complicated seed phrases to write down and no browser extensions to install.',
  },
  {
    icon: '⬡',
    tag: 'PAYMENTS',
    title: 'Digital Cash',
    body: 'Create a digital cheque and send the link to anyone. It works just like cash, but settles instantly over the internet.',
  },
  {
    icon: '◈',
    tag: 'SECURITY',
    title: 'Bank-Grade Security',
    body: 'Built on enterprise-grade hardware security. Your funds are protected by the same secure technology used by major financial institutions.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Connect',
    body: 'Sign in securely with just an email. No seed phrases or browser extensions required.',
  },
  {
    n: '02',
    title: 'Deposit',
    body: 'Fund your account. Your public USDC is instantly wrapped into a private, encrypted balance.',
  },
  {
    n: '03',
    title: 'Transact',
    body: 'Send, receive, and withdraw using natural language commands. The relayer handles the rest silently.',
  },
];

export default function LandingPage({ onOpenAuth }: LandingPageProps) {
  const [timeStr, setTimeStr] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef<HTMLElement>(null);
  const howRef = useRef<HTMLElement>(null);
  const archRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.container} ref={containerRef}>

      {/* ── STICKY HEADER ── */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.brand}>ORCA</div>
        <nav className={styles.nav}>
          <button className={styles.navItem} onClick={() => scrollTo(featuresRef)}>Features</button>
          <button className={styles.navItem} onClick={() => scrollTo(howRef)}>Process</button>
          <button className={styles.navItem} onClick={() => scrollTo(archRef)}>Architecture</button>
        </nav>
        <button className={styles.launchBtn} onClick={onOpenAuth}>Launch Chat →</button>
      </header>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <img src="/landing-hero.jpg" alt="" className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>
            The Confidential<br />
            <span className={styles.heroAccent}>Chat Wallet.</span>
          </h1>
          <p className={styles.heroSub}>
            Send, receive, and manage your assets through secure natural language commands.
            All transactions are hardware-encrypted and completely hidden from the public ledger.
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.ctaPrimary} onClick={onOpenAuth}>
              Launch Chat
            </button>
            <button className={styles.ctaSecondary} onClick={() => scrollTo(featuresRef)}>
              Learn More ↓
            </button>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>$0</span>
              <span className={styles.heroStatLabel}>Gas Fees</span>
            </div>
            <div className={styles.heroStatDiv} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>100%</span>
              <span className={styles.heroStatLabel}>Private Balances</span>
            </div>
            <div className={styles.heroStatDiv} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>Zero</span>
              <span className={styles.heroStatLabel}>Wallet Setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.section} ref={featuresRef} id="features">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>// CORE FEATURES</div>
          <h2 className={styles.sectionTitle}>Everything you need, none of the complexity.</h2>
          <p className={styles.sectionSub}>
            ORCA is designed to be the easiest, most private way to manage your digital assets.
          </p>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureTag}>{f.tag}</div>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className={`${styles.section} ${styles.sectionDark}`} ref={howRef} id="how">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>// OPERATIONAL PROCESS</div>
          <h2 className={styles.sectionTitle}>Execution Sequence</h2>
          <div className={styles.stepsRow}>
            {STEPS.map((s, i) => (
              <div key={s.n} className={styles.step}>
                <div className={styles.stepNum}>{s.n}</div>
                {i < STEPS.length - 1 && <div className={styles.stepLine} />}
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepBody}>{s.body}</p>
              </div>
            ))}
          </div>
          <div className={styles.howCta}>
            <button className={styles.ctaPrimary} onClick={onOpenAuth}>
              Begin Sequence
            </button>
          </div>
        </div>
      </section>

      {/* ── SECURITY GUARANTEES ── */}
      <section className={styles.section} ref={archRef} id="architecture">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>// SECURITY</div>
          <h2 className={styles.sectionTitle}>Built on cryptography</h2>
          <p className={styles.sectionSub}>
            ORCA runs inside secure hardware enclaves to ensure that nobody—not even the relayer—can access your funds.
          </p>
          <div className={styles.archGrid}>
            <div className={styles.archCard}>
              <div className={styles.archCardLabel}>Compute</div>
              <div className={styles.archCardTitle}>Hardware Privacy</div>
              <p className={styles.archCardBody}>Transactions are processed inside secure, isolated environments. Nobody—not even the host machine—can read your data.</p>
            </div>
            <div className={styles.archCard}>
              <div className={styles.archCardLabel}>Storage</div>
              <div className={styles.archCardTitle}>Encrypted State</div>
              <p className={styles.archCardBody}>Balances and transfer amounts are cryptographically hidden on-chain. Only you know what you hold.</p>
            </div>
            <div className={styles.archCard}>
              <div className={styles.archCardLabel}>Access</div>
              <div className={styles.archCardTitle}>Non-Custodial</div>
              <p className={styles.archCardBody}>Your account is secured by a distributed network. You retain full sovereign control over your assets at all times.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.sectionInner}>
          <h2 className={styles.ctaSectionTitle}>Establish Connection</h2>
          <p className={styles.ctaSectionSub}>Access the confidential execution environment.</p>
          <button className={styles.ctaPrimaryLg} onClick={onOpenAuth}>
            Launch Chat
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerBrand}>ORCA</span>
          <span className={styles.footerSep}>·</span>
          <span>Confidential State on Ethereum</span>
        </div>
        <div className={styles.footerMid}>
          <span>PRIVATE</span>
          <span>SECURE</span>
          <span>FAST</span>
        </div>
        <div className={styles.footerTime}>{timeStr || '00:00:00'} [UTC]</div>
      </footer>
    </div>
  );
}
