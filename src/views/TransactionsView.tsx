import type { OrcaWallet } from '../lib/orcaWallet';

import homeStyles from '../styles/home.module.css';
import layoutStyles from '../styles/layout.module.css';

interface TransactionsViewProps {
  wallet: OrcaWallet;
}

export default function TransactionsView({ wallet: _wallet }: TransactionsViewProps) {
  return (
    <div className={layoutStyles.section} style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className={layoutStyles['section-title']} style={{ margin: 0 }}>Transactions</div>
      </div>

      <div className={homeStyles['activity-list']}>
        <div style={{ color: 'var(--fg-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          No activity from you yet.
        </div>
      </div>
    </div>
  );
}
