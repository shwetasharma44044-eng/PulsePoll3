import { useState } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { PollQuestion } from './components/PollQuestion';
import { VoteButton } from './components/VoteButton';
import { ResultsChart } from './components/ResultsChart';
import { TxStatus } from './components/TxStatus';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { Vote, Shield, Info, HelpCircle, Award } from 'lucide-react';

function App() {
  const wallet = useWallet();
  const { pollState, txStatus, recentEvents, voterPoints, castVote, resetTxStatus } = useContract(wallet.publicKey);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleVoteSubmit = async () => {
    if (selectedOption === null || !wallet.publicKey) return;
    await castVote(selectedOption, wallet.sign, wallet.publicKey);
  };

  const isTxProcessing = 
    txStatus.step === 'building' || 
    txStatus.step === 'signing' || 
    txStatus.step === 'submitting';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-900/10 via-indigo-900/5 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 w-full flex-grow flex flex-col gap-8 md:gap-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-600/20 pulsepay-glow text-white">
                <Vote className="w-6 h-6 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-200 to-blue-400 bg-clip-text text-transparent">
                PulsePoll
              </h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium">
                Stellar Soroban Testnet Live Voting dApp
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {wallet.publicKey && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
                <Award className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Your Points: <strong className="text-slate-100 font-bold">{voterPoints} Pts</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-semibold text-slate-400">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Network: <strong className="text-slate-300 font-bold">Stellar Testnet</strong></span>
            </div>
          </div>
        </header>

        {/* Info Banner */}
        <div className="flex gap-3 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-slate-400 leading-relaxed">
            <span className="font-semibold text-indigo-300">PulsePoll</span> runs on decentralized Soroban smart contracts on the Stellar Testnet. 
            All votes are cryptographically signed by your wallet, recorded immutably on-chain, and tallied in real-time. 
            Voting triggers a cross-contract call from <code className="text-slate-300 bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800">poll_contract</code> to <code className="text-slate-300 bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800">registry_contract</code> to award participation points!
          </div>
        </div>

        {/* Dashboard Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Left Column: Wallet & Poll Submission */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            
            {/* Wallet Connector */}
            <WalletConnect
              publicKey={wallet.publicKey}
              isConnected={wallet.isConnected}
              walletName={wallet.walletName}
              error={wallet.error}
              isLoading={wallet.isLoading}
              onConnect={wallet.connect}
              onDisconnect={wallet.disconnect}
            />

            {/* Voting flow interface */}
            {txStatus.step !== 'idle' ? (
              <TxStatus status={txStatus} onReset={resetTxStatus} />
            ) : (
              <div className="flex flex-col gap-4">
                <PollQuestion
                  question={pollState.question}
                  options={pollState.options}
                  selectedOption={selectedOption}
                  onSelectOption={setSelectedOption}
                  disabled={pollState.loading || isTxProcessing}
                />
                
                {pollState.question && (
                  <VoteButton
                    onClick={handleVoteSubmit}
                    disabled={selectedOption === null || pollState.loading}
                    isLoading={isTxProcessing}
                    isConnected={wallet.isConnected}
                    onConnectWallet={wallet.connect}
                    hasOptionSelected={selectedOption !== null}
                  />
                )}
              </div>
            )}

            {pollState.error && (
              <div className="flex gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl shadow-lg">
                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex flex-col gap-0.5 text-xs md:text-sm">
                  <span className="font-bold">Contract Error</span>
                  <span className="text-slate-300">{pollState.error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Visual Charts & Live Sync events */}
          <div className="lg:col-span-5 w-full">
            <ResultsChart
              question={
                pollState.question
                  ? { question: pollState.question, options: pollState.options }
                  : null
              }
              results={pollState.results}
              totalVotes={pollState.totalVotes}
              recentEvents={recentEvents}
            />
          </div>

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-[10px] md:text-xs text-slate-500 flex flex-col gap-1 items-center justify-center">
        <span>© {new Date().getFullYear()} PulsePoll. Built with React + TypeScript + Soroban (Rust).</span>
        <span>Poll Contract: <code className="text-slate-400 font-mono select-all bg-slate-950/60 px-1 py-0.5 rounded border border-slate-900">{import.meta.env.VITE_CONTRACT_ID}</code></span>
        <span>Registry Contract: <code className="text-slate-400 font-mono select-all bg-slate-950/60 px-1 py-0.5 rounded border border-slate-900">{import.meta.env.VITE_REGISTRY_CONTRACT_ID}</code></span>
      </footer>
    </div>
  );
}

export default App;
