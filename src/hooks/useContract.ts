import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchPollQuestion,
  fetchPollResults,
  prepareVoteTransaction,
  submitTransaction,
} from '../services/pollContractService';
import { fetchVoterPoints } from '../services/registryContractService';
import { fetchAllEvents, getLatestLedgerSequence } from '../services/eventService';
import type { PollEvent } from '../services/eventService';
import type { PollState, TxStatus } from '../types';

export const useContract = (voterPublicKey: string | null) => {
  const [pollState, setPollState] = useState<PollState>({
    question: null,
    options: [],
    results: null,
    totalVotes: 0,
    loading: true,
    error: null,
  });

  const [txStatus, setTxStatus] = useState<TxStatus>({
    step: 'idle',
  });

  const [recentEvents, setRecentEvents] = useState<PollEvent[]>([]);
  const [voterPoints, setVoterPoints] = useState<number>(0);
  
  const startLedgerRef = useRef<number>(0);
  const pollingIntervalRef = useRef<any>(null);

  // Fetch points from registry
  const loadPoints = useCallback(async () => {
    if (!voterPublicKey) {
      setVoterPoints(0);
      return;
    }
    try {
      const pts = await fetchVoterPoints(voterPublicKey);
      setVoterPoints(pts);
    } catch (err) {
      console.error('Failed to fetch voter points:', err);
    }
  }, [voterPublicKey]);

  // Load the initial question, options, and results
  const loadPoll = useCallback(async () => {
    setPollState((s) => ({ ...s, loading: true, error: null }));
    try {
      const questionData = await fetchPollQuestion();
      const resultsData = await fetchPollResults();

      // Calculate total votes
      let total = 0;
      Object.values(resultsData).forEach((votes) => {
        total += votes;
      });

      setPollState({
        question: questionData.question,
        options: questionData.options,
        results: resultsData,
        totalVotes: total,
        loading: false,
        error: null,
      });

      // Get latest ledger and set event lookback
      const currentLedger = await getLatestLedgerSequence();
      startLedgerRef.current = Math.max(1, currentLedger - 15);
      
      // Load points if wallet is connected
      if (voterPublicKey) {
        await loadPoints();
      }
    } catch (err: any) {
      console.error('Error loading poll:', err);
      setPollState((s) => ({
        ...s,
        loading: false,
        error: err?.message || 'Failed to load poll data from contract.',
      }));
    }
  }, [voterPublicKey, loadPoints]);

  // Poll for results and events in the background
  const syncPollData = useCallback(async () => {
    try {
      const resultsData = await fetchPollResults();
      let total = 0;
      Object.values(resultsData).forEach((votes) => {
        total += votes;
      });

      setPollState((s) => ({
        ...s,
        results: resultsData,
        totalVotes: total,
      }));

      // Fetch user points periodically if connected
      if (voterPublicKey) {
        const pts = await fetchVoterPoints(voterPublicKey);
        setVoterPoints(pts);
      }

      if (startLedgerRef.current > 0) {
        const events = await fetchAllEvents(startLedgerRef.current);
        if (events.length > 0) {
          const maxLedger = Math.max(...events.map((e) => e.ledger));
          startLedgerRef.current = maxLedger + 1;

          setRecentEvents((prev) => {
            const newEvents = events.filter(
              (e) => !prev.some((p) => p.id === e.id)
            );
            return [...newEvents, ...prev].slice(0, 15);
          });
        }
      }
    } catch (err) {
      console.error('Error syncing poll results/events:', err);
    }
  }, [voterPublicKey]);

  // Handle wallet connection/disconnection
  useEffect(() => {
    if (voterPublicKey) {
      loadPoints();
    } else {
      setVoterPoints(0);
    }
  }, [voterPublicKey, loadPoints]);

  // Setup background event/results syncing
  useEffect(() => {
    loadPoll();

    pollingIntervalRef.current = setInterval(() => {
      syncPollData();
    }, 4000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loadPoll, syncPollData]);

  // Cast a vote function
  const castVote = async (
    optionId: number,
    signFn: (xdr: string) => Promise<string>,
    pubKey: string
  ) => {
    setTxStatus({ step: 'building' });

    try {
      const preparedTx = await prepareVoteTransaction(pubKey, optionId);
      
      setTxStatus({ step: 'signing' });
      const txXdr = preparedTx.toXDR();
      const signedXdr = await signFn(txXdr);

      setTxStatus({ step: 'submitting' });
      const txHash = await submitTransaction(signedXdr);

      setTxStatus({
        step: 'success',
        hash: txHash,
      });

      // Instantly trigger sync and points update
      await syncPollData();
      await loadPoints();
    } catch (err: any) {
      console.error('Voting process failed:', err);
      setTxStatus({
        step: 'failed',
        error: err?.message || 'An unexpected error occurred while casting your vote.',
      });
    }
  };

  const resetTxStatus = () => {
    setTxStatus({ step: 'idle' });
  };

  return {
    pollState,
    txStatus,
    recentEvents,
    voterPoints,
    castVote,
    resetTxStatus,
    reloadPoll: loadPoll,
  };
};
