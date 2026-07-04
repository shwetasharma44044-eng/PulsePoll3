import React from 'react';
import { Send, Vote } from 'lucide-react';

interface VoteButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  isConnected: boolean;
  onConnectWallet: () => void;
  hasOptionSelected: boolean;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  onClick,
  disabled,
  isLoading,
  isConnected,
  onConnectWallet,
  hasOptionSelected,
}) => {
  if (!isConnected) {
    return (
      <button
        onClick={onConnectWallet}
        className="w-full flex items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl font-bold text-base cursor-pointer shadow-lg transition-all duration-300 active:scale-[0.98]"
      >
        <Vote className="w-5 h-5" />
        <span>Connect Wallet to Vote</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-bold text-base cursor-pointer shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
        !hasOptionSelected
          ? 'bg-slate-800 border border-slate-700 text-slate-400'
          : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 border border-indigo-500/20 shadow-indigo-500/10'
      }`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing Vote...
        </span>
      ) : (
        <>
          <Send className="w-5 h-5" />
          <span>{hasOptionSelected ? 'Submit Vote' : 'Select an Option above'}</span>
        </>
      )}
    </button>
  );
};
