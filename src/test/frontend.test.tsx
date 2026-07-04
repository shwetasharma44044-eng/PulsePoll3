import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PollQuestion } from '../components/PollQuestion';
import { VoteButton } from '../components/VoteButton';
import { ResultsChart } from '../components/ResultsChart';

describe('PulsePoll Frontend Tests', () => {
  it('renders poll question and options correctly', () => {
    const question = "Which network is better?";
    const options = ["Stellar", "Ethereum"];
    const onSelectOption = vi.fn();

    render(
      <PollQuestion
        question={question}
        options={options}
        selectedOption={null}
        onSelectOption={onSelectOption}
        disabled={false}
      />
    );

    expect(screen.getByText("Which network is better?")).toBeInTheDocument();
    expect(screen.getByText("Stellar")).toBeInTheDocument();
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
    expect(screen.queryByText("Solana")).not.toBeInTheDocument();
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
  });

  it('triggers vote flow on option selection and submit click', () => {
    const onClick = vi.fn();
    const onConnectWallet = vi.fn();

    // 1. Unconnected state
    const { rerender } = render(
      <VoteButton
        onClick={onClick}
        disabled={false}
        isLoading={false}
        isConnected={false}
        onConnectWallet={onConnectWallet}
        hasOptionSelected={true}
      />
    );

    const connectBtn = screen.getByText("Connect Wallet to Vote");
    expect(connectBtn).toBeInTheDocument();
    fireEvent.click(connectBtn);
    expect(onConnectWallet).toHaveBeenCalledTimes(1);

    // 2. Connected state
    rerender(
      <VoteButton
        onClick={onClick}
        disabled={false}
        isLoading={false}
        isConnected={true}
        onConnectWallet={onConnectWallet}
        hasOptionSelected={true}
      />
    );

    const submitBtn = screen.getByText("Submit Vote");
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders ResultsChart and ActivityFeed with vote tallies and points events', () => {
    const question = {
      question: "Which network is better?",
      options: ["Stellar", "Ethereum"],
    };
    const results = {
      0: 5, // Stellar
      1: 3, // Ethereum
    };
    const totalVotes = 8;
    const recentEvents = [
      {
        id: "evt-1",
        type: "vote_cast" as const,
        voter: "GBJ5WPLSZQZ6L55N3XJZDQKHU45W4TA3QUELIPCFKY3ARHF5",
        option: 0,
        ledger: 12345,
        timestamp: Date.now(),
      },
      {
        id: "evt-2",
        type: "participation_recorded" as const,
        voter: "GBJ5WPLSZQZ6L55N3XJZDQKHU45W4TA3QUELIPCFKY3ARHF5",
        points: 10,
        ledger: 12345,
        timestamp: Date.now(),
      }
    ];

    render(
      <ResultsChart
        question={question}
        results={results}
        totalVotes={totalVotes}
        recentEvents={recentEvents}
      />
    );

    // Live Results checks
    expect(screen.getByText("Live Results")).toBeInTheDocument();
    expect(screen.getByText("8 votes total")).toBeInTheDocument();
    expect(screen.getByText("63%")).toBeInTheDocument(); // 5 / 8 = 62.5% -> rounded to 63%
    expect(screen.getByText("38%")).toBeInTheDocument(); // 3 / 8 = 37.5% -> rounded to 38%

    // Activity Feed checks
    expect(screen.getByText("Activity Feed")).toBeInTheDocument();
    expect(screen.getAllByText(/GBJ5WP/i)[0]).toBeInTheDocument();
    expect(screen.getByText("+10 Points")).toBeInTheDocument();
  });
});
