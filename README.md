# PulsePay2 🌌

**PulsePay2** is a complete, production-ready live voting dApp on the **Stellar Testnet** powered by a decentralized **Soroban smart contract**. It enables users to securely vote on a single live question, view live voting results updated in real-time, and trace transaction lifecycles directly on-chain using any major Stellar browser wallet (Freighter, xBull, Albedo, etc.).

No mock data is used anywhere; all data is fetched live from the Stellar ledger and contract events.

---

## 📖 Architecture
For detailed documentation on the architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## ⚡ Live Soroban Contract Details (Testnet)

*   **Deployed Contract Address**: `CB3O6FJ3AHCNR2XTTEE3C3RBKOW4GK76ZE2J6PN2CPXAULQ2PAEPFTBQ`
*   **Contract Deployer Address**: `GCYMLCJTY6KNGGWRXHNMPDVQIPJZDQKHU45W4TA3QUELIPCFKY3ARHF5`
*   **Real Vote Transaction Hash**: `5015dee67024481f722cffed8e2ba52626760374856d43c73e48498c1c9404c1`
*   **Stellar Expert Link**: [View Vote Tx on Stellar Expert](https://stellar.expert/explorer/testnet/tx/5015dee67024481f722cffed8e2ba52626760374856d43c73e48498c1c9404c1)

---

## 🛠️ Technology Stack

1.  **Smart Contract**: Written in **Rust** (`soroban-sdk` 22.0.0).
2.  **Frontend**: **React** + **Vite** + **TypeScript** + **Tailwind CSS**.
3.  **Stellar Interaction**:
    *   `@stellar/stellar-sdk` (v16.0.1) for building/preparing transactions and querying Soroban RPC.
    *   `@creit.tech/stellar-wallets-kit` (v2.5.0) for multi-wallet support (Freighter, xBull, Albedo, etc.).

---

## 🏗️ Smart Contract Architecture

The contract is structured under `contracts/pulsepay2` and implements four main methods:

*   `initialize(admin: Address, question: String, options: Vec<String>)`: Stores the poll question and options. Can only be run once.
*   `vote(voter: Address, option: u32)`: Emits a `vote_cast` event and updates the options tally in storage. Implements check-and-throw logic to prevent an address from voting more than once (fails with a panic if already voted).
*   `get_results() -> Map<u32, u32>`: Returns the map of option IDs and their respective vote tallies.
*   `get_question() -> PollQuestion`: Returns the poll's question string and string list of options.

---

## 🌐 Walkthrough: Frontend Transaction Lifecycle

Interactions are processed through a structured pipeline that ensures users are informed of transaction progress and failures at every step:

```
[Idle Selection] 
       │
       ▼ (User clicks "Submit Vote")
[Building] ────────► Simulates transaction via Soroban RPC (`prepareTransaction`)
       │             to calculate exact resources, footprint, and gas fees.
       ▼
[Signing] ─────────► Prompts the connected wallet to securely sign the transaction XDR.
       │
       ▼
[Submitting] ──────► Broadcasts the signed transaction to Soroban RPC.
       │
       ▼
[Pending] ─────────► Polls the transaction status from the ledger.
       │
       ├───────────────────────────────┐
       ▼ (Success)                     ▼ (Revert / Failure)
[Success]                       [Failed]
- Displays TX Hash              - Displays contract/revert errors
- Link to Stellar Expert        - E.g. "Voter already voted"
- Refreshes live results        - Allows user to try again
```

### Robust Error Handling Cases
The dApp maps low-level RPC and hardware exceptions into friendly user alerts:
1.  **Wallet Extension Missing**: If Freighter, xBull, or Albedo is selected but not active, shows a prompt to install the browser extension.
2.  **User Rejection**: If a user cancels a connection or signing request, shows *"Wallet connection request/signing was rejected by the user."*
3.  **Account Unfunded / Not Exist**: If a wallet is connected but has not been funded via Friendbot, it prevents building and warns: *"Account not funded. Please fund your account on the Stellar Testnet using Friendbot first."*
4.  **Double Voting Rejection**: If the voter address has already cast a vote, the simulated transaction reverts and displays: *"You have already voted in this poll from this wallet."*

---

## 🚀 Running the Project Locally

### 1. Prerequisites
*   Node.js (v18+)
*   Rust & Cargo (for smart contract work)
*   Stellar CLI (`cargo install --locked stellar-cli --features opt`)

### 2. Environment Setup
Create a `.env` file at the root (or copy `.env.example`):
```bash
VITE_CONTRACT_ID=CB3O6FJ3AHCNR2XTTEE3C3RBKOW4GK76ZE2J6PN2CPXAULQ2PAEPFTBQ
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

### 3. Install Dependencies
Install frontend libraries (using `--ignore-scripts` to bypass native compilation blocks on Windows systems):
```bash
npm install --ignore-scripts
```

### 4. Run Vite Dev Server
Start the development server:
```bash
npm run dev
```

### 5. Build and Preview for Production
To bundle and build the application:
```bash
npm run build
npm run preview
```

---

## 🧪 Smart Contract Development & Testing

### Run Rust Contract Unit Tests
```bash
cd contracts/pulsepay2
cargo test
```

### Compile WASM Target
```bash
stellar contract build
```

---

## 🔒 Verification & Security
The contract code checks the sender of the vote using:
```rust
voter.require_auth();
```
This guarantees that nobody can forge votes on behalf of other addresses. The smart contract states are stored permanently in Soroban instance storage.

---

## 📸 Screenshots

### Wallet Connection Options
Here are the supported Stellar browser wallets:
![Wallet Connection Options](./image-4.png)

### Main Dashboard & Voting Interface
![Main Dashboard](./image-7.png)

### Real-Time Activity Feed & Live Results
![Results](./image-5.png)
![Activity Feed](./image-6.png)

