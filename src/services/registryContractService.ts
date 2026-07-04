import { rpc, Contract, Account, TransactionBuilder, scValToNative, Address } from '@stellar/stellar-sdk';

const REGISTRY_CONTRACT_ID = import.meta.env.VITE_REGISTRY_CONTRACT_ID;
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL;
const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE;

export const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

// Helper to get dummy account for simulation
function getDummyAccount() {
  return new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
}

/**
 * Fetches the accumulated participation points of a voter from the rewards Registry contract.
 */
export const fetchVoterPoints = async (voterPublicKey: string): Promise<number> => {
  if (!voterPublicKey) return 0;
  try {
    const contract = new Contract(REGISTRY_CONTRACT_ID);
    const tx = new TransactionBuilder(getDummyAccount(), {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_points', Address.fromString(voterPublicKey).toScVal()))
      .setTimeout(30)
      .build();

    const response = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(response)) {
      const resultVal = response.result?.retval;
      if (!resultVal) return 0;
      const native = scValToNative(resultVal);
      return Number(native);
    } else {
      console.warn('Simulation failed for get_points');
      return 0;
    }
  } catch (error) {
    console.error('Failed to fetch voter points:', error);
    return 0;
  }
};
