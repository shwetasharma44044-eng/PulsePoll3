export interface PollQuestion {
  question: string;
  options: string[];
}

export interface PollResults {
  [optionId: number]: number;
}

export interface PollState {
  question: string | null;
  options: string[];
  results: PollResults | null;
  totalVotes: number;
  loading: boolean;
  error: string | null;
}

export type TxStep = 'idle' | 'building' | 'signing' | 'submitting' | 'pending' | 'success' | 'failed';

export interface TxStatus {
  step: TxStep;
  hash?: string;
  error?: string;
}

export interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  walletName: string | null;
  error: string | null;
}
