import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { mistToSui, formatSui, suiToVnd, formatVnd } from '../utils/helpers';

export default function WalletBalance() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!currentAccount) {
        setBalance(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const coins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: '0x2::sui::SUI',
        });

        const totalBalance = coins.data.reduce(
          (acc, coin) => acc + parseInt(coin.balance),
          0
        );

        setBalance(mistToSui(totalBalance));
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [currentAccount, suiClient]);

  if (!currentAccount) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-1">Số dư ví</h3>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900">{formatSui(balance)}</p>
          <p className="text-sm text-gray-500">{formatVnd(suiToVnd(balance))}</p>
        </>
      )}
    </div>
  );
}