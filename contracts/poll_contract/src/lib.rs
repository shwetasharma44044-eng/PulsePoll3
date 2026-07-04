#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Vec, contractclient};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct PollQuestion {
    pub question: String,
    pub options: Vec<String>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum DataKey {
    Question,
    Voted(Address),
    Votes,
    Initialized,
    Registry,
}

// Define the client interface for the registry contract
#[contractclient(name = "RegistryClient")]
pub trait RegistryContractTrait {
    fn record_participation(env: Env, voter: Address) -> u32;
}

#[contract]
pub struct PollContract;

#[contractimpl]
impl PollContract {
    /// Initializes the poll contract with the question, options, and registry address.
    /// Panics if already initialized or if there are less than 2 options.
    pub fn initialize(env: Env, question: String, options: Vec<String>, registry: Address) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("Already initialized");
        }
        
        if options.len() < 2 {
            panic!("Must have at least 2 options");
        }

        let poll = PollQuestion {
            question,
            options,
        };
        env.storage().instance().set(&DataKey::Question, &poll);
        
        let mut votes = Map::new(&env);
        for i in 0..poll.options.len() {
            votes.set(i as u32, 0u32);
        }
        env.storage().instance().set(&DataKey::Votes, &votes);
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    /// Casts a vote for an option, authenticates the voter, checks for double-voting,
    /// updates totals, and makes an atomic cross-contract call to the rewards registry.
    pub fn vote(env: Env, voter: Address, option: u32) {
        // 1. Authenticate voter
        voter.require_auth();
        
        // 2. Check if contract is initialized
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic!("Not initialized");
        }
        
        // 3. Prevent double-voting
        let voted_key = DataKey::Voted(voter.clone());
        if env.storage().persistent().has(&voted_key) {
            panic!("Already voted");
        }
        
        // 4. Validate option ID
        let poll: PollQuestion = env.storage().instance().get(&DataKey::Question).unwrap();
        if option >= poll.options.len() as u32 {
            panic!("Invalid option");
        }
        
        // 5. Invoke the Registry contract via cross-contract call
        // Chosen failure behavior: ATOMIC ROLLBACK.
        // If the cross-contract call to the registry contract fails (e.g. registry contract panics, is not initialized,
        // or gets a validation error), the entire transaction rolls back. This ensures that a voter's vote is only counted
        // if they are successfully credited with participation rewards/points, maintaining consistency between the poll
        // and the rewards registry.
        let registry_addr: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        let registry_client = RegistryClient::new(&env, &registry_addr);
        registry_client.record_participation(&voter);
        
        // 6. Update vote counts in storage
        let mut votes: Map<u32, u32> = env.storage().instance().get(&DataKey::Votes).unwrap();
        let current_votes = votes.get(option).unwrap_or(0);
        votes.set(option, current_votes + 1);
        env.storage().instance().set(&DataKey::Votes, &votes);
        
        // 7. Mark voter as voted
        env.storage().persistent().set(&voted_key, &true);
        
        // 8. Publish event
        env.events().publish(
            (symbol_short!("vote_cast"), voter.clone()),
            (option, votes.clone())
        );
    }

    pub fn get_results(env: Env) -> Map<u32, u32> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Map::new(&env);
        }
        env.storage().instance().get(&DataKey::Votes).unwrap_or_else(|| Map::new(&env))
    }

    pub fn get_question(env: Env) -> PollQuestion {
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic!("Not initialized");
        }
        env.storage().instance().get(&DataKey::Question).unwrap()
    }

    pub fn get_registry(env: Env) -> Address {
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic!("Not initialized");
        }
        env.storage().instance().get(&DataKey::Registry).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, Address, testutils::Address as _};

    fn setup_env<'a>() -> (Env, registry_contract::RegistryContractClient<'a>, PollContractClient<'a>, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        // 1. Deploy and initialize Registry
        let registry_id = env.register_contract(None, registry_contract::RegistryContract);
        let registry_client = registry_contract::RegistryContractClient::new(&env, &registry_id);
        let admin = Address::generate(&env);
        registry_client.initialize(&admin);

        // 2. Deploy and initialize Poll
        let poll_id = env.register_contract(None, PollContract);
        let poll_client = PollContractClient::new(&env, &poll_id);

        let question = String::from_str(&env, "Do you prefer Stellar or Ethereum?");
        let mut options = Vec::new(&env);
        options.push_back(String::from_str(&env, "Stellar"));
        options.push_back(String::from_str(&env, "Ethereum"));

        poll_client.initialize(&question, &options, &registry_id);

        (env, registry_client, poll_client, registry_id, poll_id)
    }

    #[test]
fn test_initialize() {
        let (_env, _registry_client, poll_client, registry_id, _poll_id) = setup_env();

        let poll = poll_client.get_question();
        assert_eq!(poll.question, String::from_str(&poll_client.env, "Do you prefer Stellar or Ethereum?"));
        assert_eq!(poll.options.len(), 2);
        assert_eq!(poll_client.get_registry(), registry_id);

        let results = poll_client.get_results();
        assert_eq!(results.get(0).unwrap(), 0);
        assert_eq!(results.get(1).unwrap(), 0);
    }

    #[test]
    fn test_vote_success_and_rewards() {
        let (env, registry_client, poll_client, _registry_id, _poll_id) = setup_env();
        let voter = Address::generate(&env);

        poll_client.vote(&voter, &0);

        // Verify vote tally
        let results = poll_client.get_results();
        assert_eq!(results.get(0).unwrap(), 1);
        assert_eq!(results.get(1).unwrap(), 0);

        // Verify cross-contract points registry update
        assert_eq!(registry_client.get_points(&voter), 10);
    }

    #[test]
    fn test_double_vote_rejection() {
        let (env, _registry_client, poll_client, _registry_id, _poll_id) = setup_env();
        let voter = Address::generate(&env);

        poll_client.vote(&voter, &0);

        // Verify second vote fails
        let result = poll_client.try_vote(&voter, &0);
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_option() {
        let (env, _registry_client, poll_client, _registry_id, _poll_id) = setup_env();
        let voter = Address::generate(&env);

        // Option 99 is invalid
        let result = poll_client.try_vote(&voter, &99);
        assert!(result.is_err());
    }
}
