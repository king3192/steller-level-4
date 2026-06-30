#![no_std]

#[cfg(any(test, feature = "as-library"))]
extern crate std;

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyPaid = 1,
    InvalidAmount = 2,
    NotInitialized = 3,
    AlreadyInitialized = 4,
    AmountExceedsOwed = 5,
    NotRoommate = 6,
    AmountExceedsShare = 7,
    RoomManagerError = 8,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    RoomManager,
    TotalCollected,
    PayerPaid(Address),
    Initialized,
}

// Client definition for cross-contract calls to the RoomManager
#[soroban_sdk::contractclient(name = "RoomManagerClient")]
pub trait RoomManager {
    fn get_share(env: Env, roommate: Address) -> i128;
    fn get_paid(env: Env, roommate: Address) -> i128;
    fn is_roommate(env: Env, roommate: Address) -> bool;
    fn get_total_rent(env: Env) -> i128;
    fn record_payment(env: Env, roommate: Address, amount: i128) -> Result<(), u32>;
}

#[contract]
pub struct RentSplitContract;

#[contractimpl]
impl RentSplitContract {
    /// Initializes the rent split contract with the RoomManager contract address.
    pub fn initialize(env: Env, room_manager: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::RoomManager, &room_manager);
        env.storage().instance().set(&DataKey::TotalCollected, &0i128);
        env.storage().instance().set(&DataKey::Initialized, &true);
        Ok(())
    }

    /// Records a rent payment from a roommate.
    /// Requires payer's authorization.
    pub fn pay_rent(env: Env, payer: Address, amount: i128) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        payer.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let room_manager_addr: Address = env.storage().instance().get(&DataKey::RoomManager).unwrap();
        let room_manager_client = RoomManagerClient::new(&env, &room_manager_addr);

        // 1. Verify if payer is registered as a roommate
        if !room_manager_client.is_roommate(&payer) {
            return Err(Error::NotRoommate);
        }

        // 2. Fetch roommate share and how much they paid so far
        let share = room_manager_client.get_share(&payer);
        let paid = room_manager_client.get_paid(&payer);

        if paid + amount > share {
            return Err(Error::AmountExceedsShare);
        }

        // 3. Verify global total rent limits
        let total_rent = room_manager_client.get_total_rent();
        let mut total_collected: i128 = env.storage().instance().get(&DataKey::TotalCollected).unwrap();

        if total_collected >= total_rent {
            return Err(Error::AlreadyPaid);
        }

        if total_collected + amount > total_rent {
            return Err(Error::AmountExceedsOwed);
        }

        // 4. Record payment in the RoomManager contract (cross-contract invocation)
        if let Err(_) = room_manager_client.try_record_payment(&payer, &amount) {
            return Err(Error::RoomManagerError);
        }

        // 5. Update local roommate paid history
        let payer_key = DataKey::PayerPaid(payer.clone());
        let previous_paid: i128 = env.storage().persistent().get(&payer_key).unwrap_or(0);
        env.storage().persistent().set(&payer_key, &(previous_paid + amount));

        // 6. Update total collected
        total_collected += amount;
        env.storage().instance().set(&DataKey::TotalCollected, &total_collected);

        // 7. Emit payment event: topics [symbol, payer], data (amount, total_collected)
        env.events().publish(
            (soroban_sdk::symbol_short!("pay_rent"), payer.clone()),
            (amount, total_collected)
        );

        Ok(())
    }

    /// Returns the remaining rent balance that is owed globally.
    pub fn get_balance(env: Env, _payer: Address) -> i128 {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return 0;
        }
        let room_manager_addr: Address = env.storage().instance().get(&DataKey::RoomManager).unwrap();
        let room_manager_client = RoomManagerClient::new(&env, &room_manager_addr);
        
        let total_rent = room_manager_client.get_total_rent();
        let total_collected = env.storage().instance().get(&DataKey::TotalCollected).unwrap_or(0);
        
        total_rent - total_collected
    }

    /// Returns the total amount of rent paid/collected so far.
    pub fn get_total_paid(env: Env) -> i128 {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return 0;
        }
        env.storage().instance().get(&DataKey::TotalCollected).unwrap_or(0)
    }

    /// Returns the roommate's remaining individual rent share to pay.
    pub fn get_roommate_balance(env: Env, roommate: Address) -> i128 {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return 0;
        }
        let room_manager_addr: Address = env.storage().instance().get(&DataKey::RoomManager).unwrap();
        let room_manager_client = RoomManagerClient::new(&env, &room_manager_addr);
        
        let share = room_manager_client.get_share(&roommate);
        let paid = room_manager_client.get_paid(&roommate);
        
        share - paid
    }

    /// Returns the address of the linked RoomManager contract.
    pub fn get_room_manager(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::RoomManager)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, Address};
    use soroban_sdk::testutils::Address as _;

    // Minimal implementation of RoomManager in test for integration
    // We register both actual contracts in the test environment.
    
    // We import the RoomManagerContract here by defining its struct or importing the crate
    // Let's register it manually in the test.
    struct RoomManagerContractTest;

    #[contracttype]
    #[derive(Clone)]
    pub enum MockDataKey {
        Admin,
        RentSplit,
        RoommateShare(Address),
        RoommatePaid(Address),
        Initialized,
        TotalRent,
    }

    #[contract]
    pub struct RoomManagerMock;

    #[contractimpl]
    impl RoomManagerMock {
        pub fn initialize(env: Env, admin: Address) {
            env.storage().instance().set(&MockDataKey::Admin, &admin);
            env.storage().instance().set(&MockDataKey::TotalRent, &0i128);
            env.storage().instance().set(&MockDataKey::Initialized, &true);
        }
        pub fn set_rent_split(env: Env, rent_split: Address) {
            env.storage().instance().set(&MockDataKey::RentSplit, &rent_split);
        }
        pub fn add_roommate(env: Env, roommate: Address, share: i128) {
            env.storage().persistent().set(&MockDataKey::RoommateShare(roommate.clone()), &share);
            env.storage().persistent().set(&MockDataKey::RoommatePaid(roommate), &0i128);
            let mut total: i128 = env.storage().instance().get(&MockDataKey::TotalRent).unwrap_or(0);
            total += share;
            env.storage().instance().set(&MockDataKey::TotalRent, &total);
        }
        pub fn get_share(env: Env, roommate: Address) -> i128 {
            env.storage().persistent().get(&MockDataKey::RoommateShare(roommate)).unwrap_or(0)
        }
        pub fn get_paid(env: Env, roommate: Address) -> i128 {
            env.storage().persistent().get(&MockDataKey::RoommatePaid(roommate)).unwrap_or(0)
        }
        pub fn is_roommate(env: Env, roommate: Address) -> bool {
            env.storage().persistent().has(&MockDataKey::RoommateShare(roommate))
        }
        pub fn get_total_rent(env: Env) -> i128 {
            env.storage().instance().get(&MockDataKey::TotalRent).unwrap_or(0)
        }
        pub fn record_payment(env: Env, roommate: Address, amount: i128) -> Result<(), u32> {
            let split: Address = env.storage().instance().get(&MockDataKey::RentSplit).unwrap();
            split.require_auth();
            let paid_key = MockDataKey::RoommatePaid(roommate.clone());
            let current: i128 = env.storage().persistent().get(&paid_key).unwrap_or(0);
            env.storage().persistent().set(&paid_key, &(current + amount));
            Ok(())
        }
    }

    #[test]
    fn test_multi_contract_flow() {
        let env = Env::default();
        env.mock_all_auths();

        // 1. Deploy RoomManager
        let manager_id = env.register_contract(None, RoomManagerMock);
        let manager_client = RoomManagerMockClient::new(&env, &manager_id);

        let admin = Address::generate(&env);
        manager_client.initialize(&admin);

        // 2. Deploy RentSplit
        let split_id = env.register_contract(None, RentSplitContract);
        let split_client = RentSplitContractClient::new(&env, &split_id);
        
        split_client.initialize(&manager_id);

        // 3. Link RentSplit in RoomManager
        manager_client.set_rent_split(&split_id);

        // 4. Add Roommates
        let roomie1 = Address::generate(&env);
        let roomie2 = Address::generate(&env);
        manager_client.add_roommate(&roomie1, &500);
        manager_client.add_roommate(&roomie2, &700);

        // Verify setup
        assert_eq!(manager_client.get_total_rent(), 1200);
        assert_eq!(split_client.get_balance(&roomie1), 1200); // global balance remaining
        assert_eq!(split_client.get_roommate_balance(&roomie1), 500); // individual balance
        assert_eq!(split_client.get_roommate_balance(&roomie2), 700);

        // 5. Roommate 1 pays 200
        split_client.pay_rent(&roomie1, &200);
        assert_eq!(split_client.get_total_paid(), 200);
        assert_eq!(split_client.get_roommate_balance(&roomie1), 300);
        assert_eq!(manager_client.get_paid(&roomie1), 200);

        // 6. Roommate 1 pays 300 (fully paid their share)
        split_client.pay_rent(&roomie1, &300);
        assert_eq!(split_client.get_roommate_balance(&roomie1), 0);

        // 7. Roommate 1 tries to pay another 50 (should error as it exceeds share)
        let res = split_client.try_pay_rent(&roomie1, &50);
        assert!(res.is_err());

        // 8. Roommate 2 pays remaining 700
        split_client.pay_rent(&roomie2, &700);
        assert_eq!(split_client.get_total_paid(), 1200);
        assert_eq!(split_client.get_balance(&roomie2), 0);

        // 9. Roommate 2 tries to pay after full rent split settled
        let res2 = split_client.try_pay_rent(&roomie2, &10);
        assert!(res2.is_err());
    }

    #[test]
    fn test_unregistered_roommate_payment() {
        let env = Env::default();
        env.mock_all_auths();

        let manager_id = env.register_contract(None, RoomManagerMock);
        let manager_client = RoomManagerMockClient::new(&env, &manager_id);
        let admin = Address::generate(&env);
        manager_client.initialize(&admin);

        let split_id = env.register_contract(None, RentSplitContract);
        let split_client = RentSplitContractClient::new(&env, &split_id);
        split_client.initialize(&manager_id);
        manager_client.set_rent_split(&split_id);

        let outsider = Address::generate(&env);
        let res = split_client.try_pay_rent(&outsider, &100);
        assert!(res.is_err());
    }
}
