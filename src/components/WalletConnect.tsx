import React from 'react';
// Integration point for PulsePay2 Stellar Multi-Wallet connector
import { Wallet, LogOut, AlertCircle, ShieldCheck } from 'lucide-react';

interface WalletConnectProps {
  publicKey: string | null;
  isConnected: boolean;
  walletName: string | null;
  error: string | null;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  publicKey,
  isConnected,
  walletName,
  error,
  isLoading,
  onConnect,
  onDisconnect,
}) => {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 text-purple-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 text-sm md:text-base">Wallet Connection</h3>
            <p className="text-xs text-slate-400">
              {isConnected ? `Connected via ${walletName}` : 'Stellar Testnet wallet required'}
            </p>
          </div>
        </div>

        {isConnected && publicKey ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{formatAddress(publicKey)}</span>
            </div>
            <button
              onClick={onDisconnect}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={isLoading}
            className="relative overflow-hidden flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-indigo-600/30 border border-indigo-500/30 transition-all duration-300 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </span>
            ) : (
              <span>Connect Wallet</span>
            )}
          </button>
        )}
      </div>

      {isConnected && publicKey && (
        <div className="sm:hidden flex items-center justify-center gap-1.5 py-1 px-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-mono w-full text-center">
          <ShieldCheck className="w-3.5 h-3.5 inline" />
          <span>{formatAddress(publicKey)}</span>
        </div>
      )}

      {error && (
        <div className="flex gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl shadow-lg transition-all duration-300 animate-in fade-in-50 slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold uppercase tracking-wider">Connection Issue</span>
            <span className="text-sm font-medium text-slate-300">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};
