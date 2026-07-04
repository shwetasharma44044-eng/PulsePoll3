import React from 'react';
import { BarChart3, Activity, User, Award } from 'lucide-react';
import type { PollResults, PollQuestion } from '../types';
import type { PollEvent } from '../services/eventService';

interface ResultsChartProps {
  question: PollQuestion | null;
  results: PollResults | null;
  totalVotes: number;
  recentEvents: PollEvent[];
}

export const ResultsChart: React.FC<ResultsChartProps> = ({
  question,
  results,
  totalVotes,
  recentEvents,
}) => {
  if (!question || !results) {
    return (
      <div className="w-full flex flex-col gap-4 bg-slate-900/40 border border-slate-800 p-8 rounded-2xl animate-pulse">
        <div className="h-6 bg-slate-800 rounded-md w-1/3"></div>
        <div className="h-10 bg-slate-800 rounded-xl w-full"></div>
        <div className="h-10 bg-slate-800 rounded-xl w-full"></div>
      </div>
    );
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Vote Tallies Card */}
      <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400 border border-purple-500/10">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200 text-base">Live Results</h3>
              <p className="text-xs text-slate-400">Real-time counts from Testnet</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs font-semibold">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} total
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {question.options.map((option, idx) => {
            const votes = results[idx] || 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            
            // Alternating gradients for different options to look sleek
            const barGradient = idx === 0 
              ? 'from-purple-600 to-indigo-600 shadow-purple-500/10'
              : 'from-blue-600 to-indigo-600 shadow-blue-500/10';

            return (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-300">{option}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-purple-400 font-bold">{percentage}%</span>
                    <span className="text-slate-500 text-xs">({votes})</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
                  <div
                    className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Transaction Feed Card */}
      <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400 border border-emerald-500/10">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200 text-base">Activity Feed</h3>
              <p className="text-xs text-slate-400">Live contract events subscription</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span>Syncing</span>
          </div>
        </div>

        <div className="flex flex-col max-h-[300px] overflow-y-auto gap-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-1 text-center">
              <User className="w-8 h-8 opacity-30 mb-1" />
              <span className="text-xs font-semibold">No recent events detected yet</span>
              <span className="text-[10px] text-slate-600">Cast a vote or wait for events on Testnet</span>
            </div>
          ) : (
            recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between bg-slate-950/40 border border-slate-800/40 p-3 rounded-xl hover:border-slate-800 transition-all duration-300 animate-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center gap-2">
                  {evt.type === 'vote_cast' ? (
                    <div className="w-7 h-7 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 text-xs flex-shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-xs flex-shrink-0">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-mono text-slate-300 truncate">{formatAddress(evt.voter)}</span>
                    <span className="text-[10px] text-slate-500">Ledger: {evt.ledger}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {evt.type === 'vote_cast' ? (
                    <>
                      <span className="text-[10px] font-semibold text-slate-400">Voted</span>
                      <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs font-bold">
                        {evt.option !== undefined && question.options[evt.option]
                          ? question.options[evt.option]
                          : `Option ${evt.option}`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold text-slate-400">Earned</span>
                      <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
                        +10 Points
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
