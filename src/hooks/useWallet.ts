import { useState, useEffect } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { Networks } from '@creit.tech/stellar-wallets-kit';
import type { WalletState } from '../types';

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    publicKey: null,
    isConnected: false,
    walletName: null,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Initialize the wallet kit once on module load
  useEffect(() => {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: defaultModules(),
    });
  }, []);

  const connect = async () => {
    setIsLoading(true);
    setWalletState((s) => ({ ...s, error: null }));

    try {
      const { address } = await StellarWalletsKit.authModal();
      
      // Get the connected module details to display which wallet was connected
      const selectedModule = StellarWalletsKit.selectedModule;
      const walletName = selectedModule ? selectedModule.productName : 'Stellar Wallet';

      setWalletState({
        publicKey: address,
        isConnected: true,
        walletName,
        error: null,
      });
    } catch (err: any) {
      console.error('Connection error:', err);
      let userFriendlyError = 'Failed to connect wallet.';
      const msg = err?.message || err?.toString() || '';

      if (msg.includes('user') || msg.includes('reject') || msg.includes('cancel') || msg.includes('declined') || msg.includes('close')) {
        userFriendlyError = 'Wallet connection request was rejected by the user.';
      } else if (msg.includes('install') || msg.includes('not found') || msg.includes('missing')) {
        userFriendlyError = 'Selected wallet extension not found. Please install the browser extension first.';
      } else {
        userFriendlyError = `Connection failed: ${msg}`;
      }

      setWalletState((s) => ({
        ...s,
        error: userFriendlyError,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (e) {
      console.error('Error during disconnect:', e);
    }
    setWalletState({
      publicKey: null,
      isConnected: false,
      walletName: null,
      error: null,
    });
  };

  const sign = async (txXdr: string): Promise<string> => {
    if (!walletState.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const signed = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: walletState.publicKey,
      });
      return signed.signedTxXdr;
    } catch (err: any) {
      console.error('Signing error:', err);
      const msg = err?.message || err?.toString() || '';
      
      if (msg.includes('user') || msg.includes('reject') || msg.includes('cancel') || msg.includes('declined')) {
        throw new Error('Transaction signing was rejected by the user.');
      } else if (msg.includes('install') || msg.includes('not found') || msg.includes('missing')) {
        throw new Error('Wallet extension not found. Make sure the extension is active.');
      }
      throw new Error(msg || 'Failed to sign transaction.');
    }
  };

  return {
    ...walletState,
    isLoading,
    connect,
    disconnect,
    sign,
  };
};
