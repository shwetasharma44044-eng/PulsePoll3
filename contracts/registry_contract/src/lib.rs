#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Map};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum DataKey {
    Admin,
    Initialized,
    Points(Address),
}

#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
    /// Initializes the registry contract with an admin address.
    /// Can only be called once.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    /// Records a voter's participation, authenticating the caller and awarding loyalty points.
    /// Returns the voter's updated total points balance.
    pub fn record_participation(env: Env, voter: Address) -> u32 {
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic!("Registry contract not initialized");
        }
        
        // Authenticate the voter to ensure this call is authorized by the voter
        voter.require_auth();

        let key = DataKey::Points(voter.clone());
        let current_points: u32 = env.storage().persistent().get(&key).unwrap_or(0);
        let new_points = current_points + 10;
        
        env.storage().persistent().set(&key, &new_points);

        // Emit participation_recorded event
        env.events().publish(
            (symbol_short!("part_rec"), voter.clone()),
            new_points
        );

        new_points
    }

    pub fn get_points(env: Env, voter: Address) -> u32 {
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic!("Registry contract not initialized");
        }
        let key = DataKey::Points(voter);
        env.storage().persistent().get(&key).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, Address, testutils::Address as _};

    #[test]
    fn test_registry() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, RegistryContract);
        let client = RegistryContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let voter = Address::generate(&env);
        assert_eq!(client.get_points(&voter), 0);

        let points = client.record_participation(&voter);
        assert_eq!(points, 10);
        assert_eq!(client.get_points(&voter), 10);

        let points_again = client.record_participation(&voter);
        assert_eq!(points_again, 20);
        assert_eq!(client.get_points(&voter), 20);
    }
}
