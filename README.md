# PulsePoll 🌌 (Level 3 Production-Grade Upgrade)

**PulsePoll** is a complete, production-ready live voting dApp on the **Stellar Testnet** powered by two decentralized, cooperating **Soroban smart contracts**. It enables users to securely vote on a live poll question, view live results updated in real-time, trace transaction lifecycles, and earn points tracked by a separate rewards Registry contract.

No mock data is used anywhere; all data is fetched live from the Stellar Testnet ledger and contract events.

---

## 📖 Architecture & Integration Details

For a detailed view of the multi-contract interactions, atomic rollbacks, state synchronization, and event emissions, please refer to:
*   [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## ⚡ Live Soroban Contract Details (Testnet)

*   **Registry Contract Address**: `CBY7GRA5GN75QDZ4MY2FL6QSS2TWAY6BNIWYDBNKGKNBATZCYECIZF7J`
*   **Poll Contract Address**: `CDBIC35ZRH6YXDXOW4UZ63GQZOQLTBPPAIIZSMGQSVQJKDOOYX4UR44G`
*   **Contract Deployer Address**: `GCYMLCJTY6KNGGWRXHNMPDVQIPJZDQKHU45W4TA3QUELIPCFKY3ARHF5`

### Verified On-Chain Transactions (Stellar Expert):
*   **Registry Contract Deployment**: [Tx Hash: bd3b11438159c0647004edf9f3485d0d9fb3f958e6029baf1494bee43e097ee9](https://stellar.expert/explorer/testnet/tx/bd3b11438159c0647004edf9f3485d0d9fb3f958e6029baf1494bee43e097ee9)
*   **Registry Contract Initialization**: [Tx Hash: bc749f60cfd071b1d4b59e4c97c9a5a4e8e6497c707a21a5be8c7a59a4b9f0ea](https://stellar.expert/explorer/testnet/tx/bc749f60cfd071b1d4b59e4c97c9a5a4e8e6497c707a21a5be8c7a59a4b9f0ea)
*   **Poll Contract Deployment**: [Tx Hash: b043acf6d47ff85e757086e37ae7337eefe21459fd322e31084ef9ce78b8bd23](https://stellar.expert/explorer/testnet/tx/b043acf6d47ff85e757086e37ae7337eefe21459fd322e31084ef9ce78b8bd23)
*   **Poll Contract Initialization**: [Tx Hash: 74c3f95de81bb51bd5f04000952c2087b29cf762fb092ff481df3e3d789bc07c](https://stellar.expert/explorer/testnet/tx/74c3f95de81bb51bd5f04000952c2087b29cf762fb092ff481df3e3d789bc07c)

---

## 🛠️ Technology Stack

1.  **Smart Contracts**: Written in **Rust** (`soroban-sdk` 22.0.11)
2.  **Frontend**: **React** + **Vite** + **TypeScript** + **Tailwind CSS** (responsive layouts reflow to `<480px`)
3.  **Testing**:
    *   **Rust**: Cargo test utils (`cargo test`) for contract validation
    *   **Frontend**: Vitest + React Testing Library (`npm run test`) for component rendering and user interaction tests
4.  **CI/CD**: GitHub Actions workflow defined in `.github/workflows/ci.yml` validating smart contracts compilation/tests and frontend linting/testing.

---

## 🏗️ Multi-Contract Smart Architecture

### 1. Registry Contract (`contracts/registry_contract`)
Tracks voter loyalty and points.
*   `initialize(admin: Address)`: Configures the admin identity.
*   `record_participation(voter: Address) -> u32`: Authenticates the caller, registers participation, credits the voter with +10 points, and emits a `part_rec` event.
*   `get_points(voter: Address) -> u32`: Returns the cumulative points recorded for the given voter address.

### 2. Poll Contract (`contracts/poll_contract`)
Manages the poll state.
*   `initialize(question: String, options: Vec<String>, registry: Address)`: Stores question details and options, and hooks up the Registry contract address.
*   `vote(voter: Address, option: u32)`: Emits a `vote_cast` event. Executes check-and-throw logic to prevent double voting. Performs a cross-contract call to the Registry contract. 
*   **Atomic Rollback Behavior**: If the Registry contract call fails (e.g. registry contract panics or is not initialized), the entire transaction rolls back, preventing double votes and ensuring state consistency.
*   `get_results() -> Map<u32, u32>`: Returns the results map.
*   `get_question() -> PollQuestion`: Returns the poll structure.

---

## 🚀 Running the Project Locally

### 1. Prerequisites
*   Node.js (v18+)
*   Rust & Cargo
*   Stellar CLI (`cargo install --locked stellar-cli --features opt`)

### 2. Environment Setup
Rename `.env.example` to `.env` or check its contents:
```bash
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_CONTRACT_ID=CDBIC35ZRH6YXDXOW4UZ63GQZOQLTBPPAIIZSMGQSVQJKDOOYX4UR44G
VITE_REGISTRY_CONTRACT_ID=CBY7GRA5GN75QDZ4MY2FL6QSS2TWAY6BNIWYDBNKGKNBATZCYECIZF7J
```

### 3. Install Dependencies
```bash
npm install --ignore-scripts
```

### 4. Run Vite Dev Server
```bash
npm run dev
```

### 5. Build and Preview for Production
```bash
npm run build
npm run preview
```

---

## 🧪 Testing Frameworks

### 1. Smart Contract Tests (Rust)
Runs unit tests validating initialization, double-voting rejection, and cross-contract call integration with Mock Auths:
```bash
cargo test
```

### 2. Frontend Tests (Vitest + React Testing Library)
Runs unit tests for rendering questions/options, voting interactions, and activity feed rendering:
```bash
npm run test
```

---

## 🔒 Verification & Security
The contracts enforce cryptographic integrity by calling `voter.require_auth()` in both `poll_contract` and `registry_contract`. This guarantees that votes and rewards can only be recorded when signed by the respective account.
