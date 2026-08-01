import { useEffect, useState } from 'react';
import type { OrcaWallet } from '../lib/orcaWallet';
import { authAxios } from '../api';
import homeStyles from '../styles/home.module.css';
import layoutStyles from '../styles/layout.module.css';

interface TransactionsViewProps {
  wallet: OrcaWallet;
}

interface Transaction {
  tx_hash: string;
  from_address: string;
  to_address: string;
  type: string;
  handle: string;
  status: string;
  created_at: string;
}

export default function TransactionsView({ wallet }: TransactionsViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authAxios(wallet.address).get('/api/transactions')
      .then(res => {
        if (mounted) {
          setTransactions(res.data || []);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load transactions", err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [wallet.address]);

  return (
    <div className={layoutStyles.section} style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className={layoutStyles['section-title']} style={{ margin: 0 }}>Transactions</div>
      </div>

      <div className={homeStyles['activity-list']}>
        {loading ? (
          <div style={{ color: 'var(--fg-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
            Loading...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ color: 'var(--fg-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
            No activity from you yet.
          </div>
        ) : (
          transactions.map(tx => {
            const isOutgoing = tx.from_address?.toLowerCase() === wallet.address.toLowerCase();
            const actionText = tx.type === 'transfer' ? (isOutgoing ? 'Sent' : 'Received') 
                             : tx.type === 'withdraw' ? 'Withdrew' 
                             : tx.type === 'cheque_write' ? 'Wrote Cheque'
                             : 'Claimed Cheque';
            const color = isOutgoing ? 'var(--fg)' : 'var(--accent)';
            const addr = isOutgoing ? tx.to_address : tx.from_address;
            const shortAddr = addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
            return (
              <div key={tx.tx_hash} className={homeStyles['activity-item']}>
                <div className={homeStyles['activity-meta']}>
                  <div style={{ color, fontWeight: 500 }}>{actionText}</div>
                  <div style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>
                    {shortAddr && `${isOutgoing ? 'To' : 'From'} ${shortAddr}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>
                    {new Date(tx.created_at).toLocaleDateString()}
                  </div>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${tx.tx_hash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    View ↗
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
