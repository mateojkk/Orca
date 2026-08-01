import { useEffect, useRef, useState } from 'react';
import styles from '../styles/landing.module.css';

interface LandingPageProps {
  onOpenAuth: () => void;
}

const FEATURES = [
  {
    icon: '⬡',
    tag: 'ENCRYPTION',
    title: 'Zero-Knowledge Balances',
    body: 'Your balance and transaction amounts are hidden behind ZK proofs inside a Trusted Execution Environment. Nobody on-chain sees what you hold or send — not even the relayer.',
  },
  {
    icon: '◈',
    tag: 'GASLESS',
    title: 'Relayer-Paid Transactions',
    body: "ORCA's backend relayer covers every gas fee. Sign once with your embedded wallet and the transaction is broadcast silently — no ETH required, no MetaMask pop-ups.",
  },
  {
    icon: '⌘',
    tag: 'UX',
    title: 'Chat-Native Interface',
    body: 'Send, receive, deposit and withdraw through plain English commands. Type "send 50 to alice" and it\'s done. No forms, no confirmations, no friction.',
  },
  {
    icon: '⊕',
    tag: 'CUSTODY',
    title: 'Self-Sovereign Wallets',
    body: 'Login with just your email. Privy creates an MPC embedded wallet you fully control. No seed phrases to store, no browser extension to install.',
  },
  {
    icon: '⬡',
    tag: 'PROTOCOL',
    title: 'Private Cheques',
    body: 'Issue a bearer cheque to any address. The recipient claims it on-chain — amounts stay encrypted throughout. Works like cash, settles like crypto.',
  },
  {
    icon: '◈',
    tag: 'NETWORK',
    title: 'iExec TEE Protocol',
    body: 'Built on the iExec Nox protocol and ERC-7984. Confidential state is enforced at the protocol level via hardware-attested Trusted Execution Environments.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Initialization',
    body: 'Authenticate to provision a distributed MPC wallet. The system generates key material without requiring external extensions.',
  },
  {
    n: '02',
    title: 'State Transition',
    body: 'Deposit assets into the confidential contract. The protocol encrypts the value, removing it from the public ledger view.',
  },
  {
    n: '03',
    title: 'Execution',
    body: 'Issue instructions via the interface. The relayer structures, signs, and broadcasts the operation for immediate settlement.',
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
        <button className={styles.launchBtn} onClick={onOpenAuth}>Initialize Interface →</button>
      </header>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <img src="/landing-hero.jpg" alt="" className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroPill}>SEPOLIA TESTNET · V1.0</div>
          <h1 className={styles.heroHeadline}>
            Confidential<br />
            <span className={styles.heroAccent}>State Execution.</span>
          </h1>
          <p className={styles.heroSub}>
            We develop and execute confidential transactions and private state for Ethereum Sepolia.
            From early encryption to final TEE delivery, we keep the process controlled - clear intent,{' '}
            <em>precise</em> decisions, and a focus on what is essential.
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.ctaPrimary} onClick={onOpenAuth}>
              Initialize Interface
            </button>
            <button className={styles.ctaSecondary} onClick={() => scrollTo(featuresRef)}>
              Review Specifications ↓
            </button>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>ZK-TEE</span>
              <span className={styles.heroStatLabel}>Hardware Privacy</span>
            </div>
            <div className={styles.heroStatDiv} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>7984</span>
              <span className={styles.heroStatLabel}>ERC Standard</span>
            </div>
            <div className={styles.heroStatDiv} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>MPC</span>
              <span className={styles.heroStatLabel}>Key Infrastructure</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.section} ref={featuresRef} id="features">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>// SYSTEM SPECIFICATIONS</div>
          <h2 className={styles.sectionTitle}>Technical Implementation</h2>
          <p className={styles.sectionSub}>
            ORCA is structured to enforce data minimisation and execution privacy at the protocol level.
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

      {/* ── ARCHITECTURE ── */}
      <section className={styles.section} ref={archRef} id="architecture">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>// ARCHITECTURE</div>
          <h2 className={styles.sectionTitle}>Protocol Stack</h2>
          <p className={styles.sectionSub}>
            The system relies on open, auditable cryptographic protocols. Privacy is enforced programmatically by the infrastructure, ensuring a trustless execution environment.
          </p>
          <div className={styles.archGrid}>
            <div className={styles.archCard}>
              <div className={styles.archCardLabel}>Compute Layer</div>
              <div className={styles.archCardTitle}>iExec TEE</div>
              <p className={styles.archCardBody}>Intel SGX hardware-attested Trusted Execution Environments process and encrypt your state. The host machine cannot read the underlying data during execution.</p>
            </div>
            <div className={styles.archCard}>
              <div className={styles.archCardLabel}>Token Layer</div>
              <div className={styles.archCardTitle}>ERC-7984 / Nox</div>
              <p className={styles.archCardBody}>A confidential ERC-20 extension where balances are ZK-encrypted on-chain. Transfer amounts are validated via zero-knowledge proofs without exposing their values.</p>
            </div>
            <div className={styles.archCard}>
              <div className={styles.archCardLabel}>Key Management</div>
              <div className={styles.archCardTitle}>Privy MPC</div>
              <p className={styles.archCardBody}>Cryptographic keys are fragmented across a Multi-Party Computation network. The architecture facilitates seamless authentication while maintaining non-custodial guarantees.</p>
            </div>
          </div>
          <div className={styles.archTags}>
            {['Sepolia Testnet', 'iExec Nox Protocol', 'ERC-7984', 'Privy MPC', 'Viem / Wagmi', 'FastAPI Relayer'].map(t => (
              <span key={t} className={styles.archTag}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.sectionInner}>
          <h2 className={styles.ctaSectionTitle}>Establish Connection</h2>
          <p className={styles.ctaSectionSub}>Access the confidential execution environment.</p>
          <button className={styles.ctaPrimaryLg} onClick={onOpenAuth}>
            Initialize Interface
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
          <span>SEPOLIA</span>
          <span>iEXEC TEE</span>
          <span>ERC-7984</span>
        </div>
        <div className={styles.footerTime}>{timeStr || '00:00:00'} [UTC]</div>
      </footer>
    </div>
  );
}
