import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './wagmi';
import { sepolia } from './lib/sepoliaChain';
import './index.css';
import App from './App';

const queryClient = new QueryClient();
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID || 'clw1234567890123456789012';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['email'],
        defaultChain: sepolia,
        supportedChains: [sepolia],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
          // Suppress Privy's signing confirmation modal globally.
          // The MPC security model is unchanged (keys never exposed) — this only
          // hides the UI prompt so Nox SDK encryptInput() calls sign silently.
          showWalletUIs: false,
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
    </BrowserRouter>
  </StrictMode>
);
