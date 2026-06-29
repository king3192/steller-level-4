#![no_std]

#[cfg(any(test, feature = "as-library"))]
extern crate std;

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotAuthorized = 1,
    AlreadyInitialized = 2,
    NotInitialized = 3,
    RoommateNotFound = 4,
    InvalidAmount = 5,
    ExceedsShare = 6,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    RentSplit,
    RoommateShare(Address),
    RoommatePaid(Address),
    Initialized,
    TotalRent,
}

#[contract]
pub struct RoomManagerContract;

#[contractimpl]
impl RoomManagerContract {
    /// Initializes the roommate manager with the administrator (landlord) address.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalRent, &0i128);
        env.storage().instance().set(&DataKey::Initialized, &true);
        Ok(())
    }

    /// Sets the RentSplit contract address that is authorized to call record_payment.
    /// Can only be called by the admin.
    pub fn set_rent_split(env: Env, rent_split: Address) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::RentSplit, &rent_split);
        Ok(())
    }

    /// Registers a roommate and sets their rent share.
    /// Can only be called by the admin.
    pub fn add_roommate(env: Env, roommate: Address, share: i128) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if share <= 0 {
            return Err(Error::InvalidAmount);
        }

        let roommate_share_key = DataKey::RoommateShare(roommate.clone());
        let previous_share: i128 = env.storage().persistent().get(&roommate_share_key).unwrap_or(0);

        // Update total rent (subtract previous share if updating, add new share)
        let mut total_rent: i128 = env.storage().instance().get(&DataKey::TotalRent).unwrap_or(0);
        total_rent = total_rent - previous_share + share;
        env.storage().instance().set(&DataKey::TotalRent, &total_rent);

        env.storage().persistent().set(&roommate_share_key, &share);
        
        // Initialize payment to 0 if not set yet
        let roommate_paid_key = DataKey::RoommatePaid(roommate.clone());
        if !env.storage().persistent().has(&roommate_paid_key) {
            env.storage().persistent().set(&roommate_paid_key, &0i128);
        }

        // Emit roommate registered event
        env.events().publish(
            (soroban_sdk::symbol_short!("add_room"), roommate),
            share
        );

        Ok(())
    }

    /// Returns the roommate's total rent share (0 if unregistered).
    pub fn get_share(env: Env, roommate: Address) -> i128 {
        let key = DataKey::RoommateShare(roommate);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Returns the roommate's paid rent amount.
    pub fn get_paid(env: Env, roommate: Address) -> i128 {
        let key = DataKey::RoommatePaid(roommate);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Checks if an address is registered as a roommate.
    pub fn is_roommate(env: Env, roommate: Address) -> bool {
        let key = DataKey::RoommateShare(roommate);
        env.storage().persistent().has(&key)
    }

    /// Returns the sum of all roommate shares (total rent of the pool).
    pub fn get_total_rent(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalRent).unwrap_or(0)
    }

    /// Returns the admin (landlord) address.
    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    /// Returns the authorized RentSplit contract address.
    pub fn get_rent_split(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::RentSplit)
    }

    /// Records a roommate payment.
    /// Can only be invoked by the authorized RentSplit contract.
    pub fn record_payment(env: Env, roommate: Address, amount: i128) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }

        // Only the authorized RentSplit contract can call this
        let rent_split: Address = env.storage().instance().get(&DataKey::RentSplit).ok_or(Error::NotAuthorized)?;
        rent_split.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let share_key = DataKey::RoommateShare(roommate.clone());
        if !env.storage().persistent().has(&share_key) {
            return Err(Error::RoommateNotFound);
        }
        let share: i128 = env.storage().persistent().get(&share_key).unwrap();

        let paid_key = DataKey::RoommatePaid(roommate.clone());
        let paid: i128 = env.storage().persistent().get(&paid_key).unwrap_or(0);

        if paid + amount > share {
            return Err(Error::ExceedsShare);
        }

        env.storage().persistent().set(&paid_key, &(paid + amount));
        Ok(())
    }
}
