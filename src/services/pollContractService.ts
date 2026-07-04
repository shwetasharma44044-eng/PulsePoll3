import { rpc, Contract, Account, TransactionBuilder, scValToNative, Address, xdr } from '@stellar/stellar-sdk';
import type { PollQuestion, PollResults } from '../types';

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID;
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL;
const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE;

export const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

// Helper to get dummy account for simulation
function getDummyAccount() {
  return new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
}

export const fetchPollQuestion = async (): Promise<PollQuestion> => {
  const contract = new Contract(CONTRACT_ID);
  const tx = new TransactionBuilder(getDummyAccount(), {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('get_question'))
    .setTimeout(30)
    .build();

  const response = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(response)) {
    const resultVal = response.result?.retval;
    if (!resultVal) throw new Error('No return value from get_question simulation');
    const native = scValToNative(resultVal);
    
    let question = '';
    let options: string[] = [];

    if (native && typeof native === 'object') {
      if ('question' in native) {
        question = native.question.toString();
      }
      if ('options' in native && Array.isArray(native.options)) {
        options = native.options.map((o: any) => o.toString());
      }
    }
    return { question, options };
  } else {
    throw new Error('Simulation failed for get_question');
  }
};

export const fetchPollResults = async (): Promise<PollResults> => {
  const contract = new Contract(CONTRACT_ID);
  const tx = new TransactionBuilder(getDummyAccount(), {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('get_results'))
    .setTimeout(30)
    .build();

  const response = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(response)) {
    const resultVal = response.result?.retval;
    if (!resultVal) throw new Error('No return value from get_results simulation');
    const native = scValToNative(resultVal);
    
    const results: PollResults = {};
    if (native instanceof Map) {
      native.forEach((val, key) => {
        results[Number(key)] = Number(val);
      });
    } else if (native && typeof native === 'object') {
      Object.entries(native).forEach(([key, val]) => {
        results[Number(key)] = Number(val);
      });
    }
    return results;
  } else {
    throw new Error('Simulation failed for get_results');
  }
};

export const prepareVoteTransaction = async (voterPublicKey: string, optionId: number) => {
  const contract = new Contract(CONTRACT_ID);
  
  // 1. Get current sequence number of the voter account
  let sequence: string;
  try {
    const accountResponse = await rpcServer.getAccount(voterPublicKey);
    sequence = accountResponse.sequenceNumber();
  } catch (error: any) {
    if (error?.message?.includes('404') || error?.response?.status === 404 || error?.code === -32600) {
      throw new Error('Account not funded. Please fund your account on the Stellar Testnet using Friendbot first.');
    }
    throw new Error('Failed to load voter account from Soroban RPC. Make sure the wallet has a funded Testnet address.');
  }

  const sourceAccount = new Account(voterPublicKey, sequence);

  // 2. Build the initial transaction
  const tx = new TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('vote', Address.fromString(voterPublicKey).toScVal(), xdr.ScVal.scvU32(optionId)))
    .setTimeout(30)
    .build();

  // 3. Prepare the transaction (simulate and add footprint/fees)
  try {
    const preparedTx = await rpcServer.prepareTransaction(tx);
    return preparedTx;
  } catch (error: any) {
    const errorStr = error?.message || '';
    if (errorStr.includes('Already voted') || errorStr.includes('HostError') || errorStr.includes('trapped')) {
      throw new Error('You have already voted in this poll from this wallet.');
    }
    throw new Error(errorStr || 'Simulation failed for the vote transaction. Double check if you already voted.');
  }
};

export const submitTransaction = async (signedXdr: string): Promise<string> => {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const response = await rpcServer.sendTransaction(tx);

  if (response.status === 'ERROR') {
    throw new Error(`Submission error: ${JSON.stringify(response.errorResult)}`);
  }

  const txHash = response.hash;

  // Poll for the status
  let attempts = 0;
  while (attempts < 20) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const txStatus = await rpcServer.getTransaction(txHash);

    if (txStatus.status === 'SUCCESS') {
      return txHash;
    } else if (txStatus.status === 'FAILED') {
      throw new Error('Transaction execution failed. The contract call reverted.');
    }

    attempts++;
  }

  throw new Error('Transaction pending timeout. Please check your transaction status on Stellar Expert.');
};
