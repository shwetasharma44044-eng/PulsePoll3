import React from 'react';
import { CheckCircle2, XCircle, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import type { TxStatus as TxStatusType, TxStep } from '../types';

interface TxStatusProps {
  status: TxStatusType;
  onReset: () => void;
}

export const TxStatus: React.FC<TxStatusProps> = ({ status, onReset }) => {
  const { step, hash, error } = status;

  if (step === 'idle') return null;

  // Define steps
  const stepsList: { label: string; stepKey: TxStep }[] = [
    { label: 'Building', stepKey: 'building' },
    { label: 'Signing', stepKey: 'signing' },
    { label: 'Submitting', stepKey: 'submitting' },
    { label: 'Complete', stepKey: 'success' },
  ];

  // Helper to determine the status of each step in the pipeline
  const getStepStatus = (index: number) => {
    if (step === 'success') {
      return 'success';
    }

    const currentStepIndex = stepsList.findIndex((s) => s.stepKey === step);
    
    if (step === 'failed' && index === currentStepIndex) {
      return 'failed';
    }
    if (step === 'failed' && index > currentStepIndex) {
      return 'upcoming';
    }
    if (currentStepIndex === -1) {
      // success state
      return 'success';
    }
    if (index < currentStepIndex) {
      return 'success';
    }
    if (index === currentStepIndex) {
      return 'active';
    }
    return 'upcoming';
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
      <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider mb-4 flex items-center justify-between">
        <span>Transaction Progress</span>
        {step === 'success' && (
          <span className="text-emerald-400 font-bold flex items-center gap-1 normal-case text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </span>
        )}
        {step === 'failed' && (
          <span className="text-rose-400 font-bold flex items-center gap-1 normal-case text-xs">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        )}
      </h3>

      {/* Stepper Pipeline */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
        {stepsList.map((s, idx) => {
          const stepStatus = getStepStatus(idx);
          
          return (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-all duration-300 ${
                    stepStatus === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : stepStatus === 'active'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-400 animate-pulse'
                      : stepStatus === 'failed'
                      ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                >
                  {stepStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : stepStatus === 'failed' ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-xs font-bold ${
                      stepStatus === 'success'
                        ? 'text-emerald-400'
                        : stepStatus === 'active'
                        ? 'text-purple-400'
                        : stepStatus === 'failed'
                        ? 'text-rose-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {stepStatus === 'active' && 'Processing...'}
                    {stepStatus === 'success' && 'Completed'}
                    {stepStatus === 'failed' && 'Error'}
                    {stepStatus === 'upcoming' && 'Waiting'}
                  </span>
                </div>
              </div>
              {idx < stepsList.length - 1 && (
                <ArrowRight className="hidden sm:block w-4 h-4 text-slate-700" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Dynamic Details */}
      <div className="flex flex-col gap-4">
        {step === 'success' && hash && (
          <div className="flex flex-col gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400">Transaction Hash</span>
            <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
              <span className="truncate pr-4">{hash}</span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0 cursor-pointer"
              >
                <span>View Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <button
              onClick={onReset}
              className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition-all duration-300"
            >
              Back to Poll
            </button>
          </div>
        )}

        {step === 'failed' && (
          <div className="flex flex-col gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
            <span className="text-xs font-semibold text-rose-400">Error Encountered</span>
            <p className="text-xs text-slate-300 leading-relaxed font-mono bg-rose-950/10 border border-rose-950/30 p-3 rounded-lg">
              {error}
            </p>
            <button
              onClick={onReset}
              className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        )}

        {(step === 'building' || step === 'signing' || step === 'submitting') && (
          <div className="flex items-center gap-3 bg-purple-500/5 border border-purple-500/10 p-4 rounded-xl">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {step === 'building' && 'Simulating transaction'}
                {step === 'signing' && 'Awaiting wallet signature'}
                {step === 'submitting' && 'Submitting to testnet'}
              </span>
              <p className="text-xs text-slate-400">
                {step === 'building' && 'Generating and simulating the Soroban transaction fee and footprints...'}
                {step === 'signing' && 'Please approve the signing request in your connected wallet popup...'}
                {step === 'submitting' && 'Broadcasting signed transaction to Soroban RPC. Polling for confirmation...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
