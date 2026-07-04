import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface PollQuestionProps {
  question: string | null;
  options: string[];
  selectedOption: number | null;
  onSelectOption: (optionId: number) => void;
  disabled: boolean;
}

export const PollQuestion: React.FC<PollQuestionProps> = ({
  question,
  options,
  selectedOption,
  onSelectOption,
  disabled,
}) => {
  if (!question) {
    return (
      <div className="w-full flex flex-col gap-4 bg-slate-900/40 border border-slate-800 p-8 rounded-2xl animate-pulse">
        <div className="h-6 bg-slate-800 rounded-md w-3/4"></div>
        <div className="flex flex-col gap-3">
          <div className="h-12 bg-slate-800 rounded-xl w-full"></div>
          <div className="h-12 bg-slate-800 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl">
      <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-6 flex flex-col gap-1">
        <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400">Current Question</span>
        <span>{question}</span>
      </h2>

      <div className="flex flex-col gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onSelectOption(idx)}
              className={`group flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-purple-600/10 border-purple-500 text-purple-200 shadow-md shadow-purple-500/5'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? 'border-purple-400 bg-purple-500'
                      : 'border-slate-600 group-hover:border-slate-500'
                  }`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white animate-scale-up" />}
                </div>
                <span className="font-semibold text-sm md:text-base">{option}</span>
              </div>
              {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 animate-scale-up" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
