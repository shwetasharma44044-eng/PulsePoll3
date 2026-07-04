import { rpc, scValToNative } from '@stellar/stellar-sdk';

const POLL_CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID;
const REGISTRY_CONTRACT_ID = import.meta.env.VITE_REGISTRY_CONTRACT_ID;
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL;

export const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

export interface PollEvent {
  id: string;
  type: 'vote_cast' | 'participation_recorded';
  voter: string;
  option?: number;
  points?: number;
  ledger: number;
  timestamp: number;
}

export const getLatestLedgerSequence = async (): Promise<number> => {
  const ledger = await rpcServer.getLatestLedger();
  return ledger.sequence;
};

export const fetchAllEvents = async (startLedger: number): Promise<PollEvent[]> => {
  try {
    const response = await rpcServer.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [POLL_CONTRACT_ID, REGISTRY_CONTRACT_ID],
        },
      ],
      limit: 50,
    });

    const parsedEvents: PollEvent[] = [];

    if (response.events) {
      for (const event of response.events) {
        const topics = event.topic.map((t) => scValToNative(t));
        const eventId = event.id;
        
        // 1. Check for vote_cast event from Poll contract
        if (event.contractId === POLL_CONTRACT_ID && topics[0] === 'vote_cast') {
          const voter = topics[1]?.toString() || 'Unknown';
          const val = scValToNative(event.value);
          let option = 0;
          if (Array.isArray(val)) {
            option = Number(val[0]);
          } else if (val && typeof val === 'object' && '0' in val) {
            option = Number((val as any)['0']);
          }
          parsedEvents.push({
            id: eventId,
            type: 'vote_cast',
            voter,
            option,
            ledger: event.ledger,
            timestamp: Date.now(),
          });
        }
        // 2. Check for part_rec (participation_recorded) event from Registry contract
        else if (event.contractId === REGISTRY_CONTRACT_ID && topics[0] === 'part_rec') {
          const voter = topics[1]?.toString() || 'Unknown';
          const points = Number(scValToNative(event.value));
          parsedEvents.push({
            id: eventId,
            type: 'participation_recorded',
            voter,
            points,
            ledger: event.ledger,
            timestamp: Date.now(),
          });
        }
      }
    }

    return parsedEvents;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
};
