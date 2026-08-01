import { baseApi } from '../api';

export async function getUserPreferences(walletAddress: string): Promise<{ balance_visible: boolean }> {
  const resp = await baseApi.get('/api/preferences', {
    headers: {
      'X-Wallet-Address': walletAddress,
    },
  });
  return resp.data;
}

export async function updateUserPreferences(walletAddress: string, balanceVisible: boolean): Promise<{ balance_visible: boolean }> {
  const resp = await baseApi.post(
    '/api/preferences',
    { balance_visible: balanceVisible },
    {
      headers: {
        'X-Wallet-Address': walletAddress,
      },
    }
  );
  return resp.data;
}
