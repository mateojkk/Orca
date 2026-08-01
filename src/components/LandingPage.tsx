import { useEffect, useState } from 'react';
import styles from '../styles/landing.module.css';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export default function LandingPage({ onOpenAuth }: LandingPageProps) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${mins}:${secs}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles['landing-container']}>
      {/* Hero Background Image */}
      <img
        src="/landing-hero.jpg"
        alt="ORCA Hero Structure"
        className={styles['hero-image-bg']}
      />
      <div className={styles['hero-overlay']} />

      {/* Top Editorial Navigation */}
      <header className={styles['landing-header']}>
        <div className={styles['brand-title']} style={{ color: 'white' }}>ORCA</div>

        <nav className={styles['nav-links']}>
          <button className={styles['nav-item']} onClick={onOpenAuth}>
            FEATURES,
          </button>
          <button className={styles['nav-item']} onClick={onOpenAuth}>
            CONFIDENTIALITY,
          </button>
          <button className={styles['nav-item']} onClick={onOpenAuth}>
            ARCHITECTURE,
          </button>
        </nav>

        <button className={styles['launch-btn']} onClick={onOpenAuth}>
          [LAUNCH CHAT]
        </button>
      </header>

      {/* Editorial Main Copy Block */}
      <main className={styles['landing-body']}>
        <div className={styles['editorial-copy']}>
          <p>
            We develop and execute <em>confidential</em> transactions and private state for Ethereum Sepolia.
            From early encryption to final TEE delivery, we keep the process controlled - clear intent,{' '}
            <em>precise</em> decisions, and a focus on what is essential. Our approach is calm and{' '}
            <em>crafted</em>. We avoid effects for the sake of style, and build state through composition, cryptography,
            light, and detail, so privacy feels <em>assumed</em> rather than demonstrated.
          </p>
        </div>
      </main>

      {/* Bottom Status Metadata Bar */}
      <footer className={styles['landing-footer']}>
        <div className={styles['footer-tags']}>
          <span>SEPOLIA</span>
          <span>iEXEC TEE</span>
          <span>ERC-7984</span>
        </div>
        <div className={styles['footer-time']}>
          {timeStr || '10:41:17'} [SEPOLIA]
        </div>
      </footer>
    </div>
  );
}
