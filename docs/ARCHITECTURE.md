# PulsePoll Architecture 🌌

This document describes the architectural layout, smart contract interfaces, data flows, and system integration patterns for the production-grade **PulsePoll** dApp on the Stellar Testnet.

---

## 🏗️ System Overview

PulsePoll implements a dual-contract architecture designed to demonstrate robust inter-contract communication, auth verification, and atomic state updates on Stellar.

```mermaid
graph TD
    User([User Wallet]) -->|1. Sign & Submit Vote| PollContract[Poll Contract]
    
    subgraph "Soroban Smart Contracts"
        PollContract -->|2. require_auth| VoterAuth{Auth Verification}
        VoterAuth -->|3. Success: cross-contract call| RegistryContract[Registry Contract]
        RegistryContract -->|4. require_auth| RegistryAuth{Auth Verification}
        RegistryAuth -->|5. Record points (+10 Pts)| RegistryStore[(Registry Storage)]
        RegistryContract -->|6. Emit part_rec Event| RegistryEvent((part_rec event))
        PollContract -->|7. Update tally| PollStore[(Poll Storage)]
        PollContract -->|8. Emit vote_cast Event| PollEvent((vote_cast event))
    end

    classDef contract fill:#4f46e5,stroke:#fff,stroke-width:2px,color:#fff;
    classDef auth fill:#10b981,stroke:#fff,stroke-width:2px,color:#fff;
    classDef store fill:#1e293b,stroke:#fff,stroke-width:2px,color:#fff;
    classDef event fill:#d97706,stroke:#fff,stroke-width:2px,color:#fff;
    
    class PollContract,RegistryContract contract;
    class VoterAuth,RegistryAuth auth;
    class PollStore,RegistryStore store;
    class PollEvent,RegistryEvent event;
```

---

## ⚡ Smart Contract Interactions

### 1. Registry Contract (`contracts/registry_contract`)
The Registry contract functions as a loyalty/rewards system. It stores the points earned by users for participating in live voting events.
*   **Storage Model**: Uses `Persistent` storage key `DataKey::Points(Address)` to keep voter points recorded indefinitely.
*   **Events**: Emits `(symbol_short!("part_rec"), Address)` with the updated points balance.

### 2. Poll Contract (`contracts/poll_contract`)
The Poll contract maintains the poll state, question structure, options, and vote counts.
*   **Storage Model**:
    *   `Instance` storage for configuration (`DataKey::Question`, `DataKey::Votes`, `DataKey::Registry`, `DataKey::Initialized`).
    *   `Persistent` storage for tracking whether an address has voted (`DataKey::Voted(Address)`).
*   **Events**: Emits `(symbol_short!("vote_cast"), Address)` with the chosen option ID and the complete updated results map.

### 3. Cross-Contract Invocation & Atomic Rollback
When the user submits a vote:
1.  `PollContract::vote` is invoked.
2.  `voter.require_auth()` is called, checking the signature of the voter.
3.  The contract verifies the voter has not voted before.
4.  The contract fetches the Registry contract address and creates a `RegistryClient`.
5.  It calls `registry_client.record_participation(&voter)`.
6.  The Registry contract executes `voter.require_auth()`. Since the original transaction was signed by the voter, this authorization automatically propagates to the nested cross-contract call.
7.  The Registry contract updates the voter's points and returns the new balance.
8.  The Poll contract updates the vote counts, marks the voter as voted, and publishes the `vote_cast` event.

> [!IMPORTANT]
> **Atomic Rollback Guarantee**: If the call to `RegistryContract::record_participation` fails or panics (e.g. if the Registry is not initialized), the entire transaction rolls back. This prevents situations where a vote is cast but no points are awarded, ensuring cryptographic and economic consistency.

---

## 🌐 Frontend Architecture

The frontend is a React Single Page Application (SPA) structured as follows:

```
src/
├── components/          # Reusable UI components
│   ├── WalletConnect.tsx   # Connection options (Freighter/xBull/Albedo)
│   ├── PollQuestion.tsx    # Question rendering and selection
│   ├── VoteButton.tsx      # Multi-state action button
│   ├── ResultsChart.tsx    # Results visual bar chart
│   ├── TxStatus.tsx        # Stage feedback (Building, Signing, Submitting)
│   └── ActivityFeed.tsx    # Live feed inside ResultsChart
├── hooks/               # Custom hooks
│   ├── useWallet.ts        # Stellar Wallets Kit hooks
│   └── useContract.ts      # Multi-contract state and events sync hook
├── services/            # Client interfaces for Stellar Soroban RPC
│   ├── pollContractService.ts     # Poll contract queries & prep
│   ├── registryContractService.ts # Registry contract queries
│   └── eventService.ts            # Consolidated event poll subscription
├── types/               # TypeScript type definitions
└── test/                # Unit test suites (Vitest)
```

### State Synchronization Loop
1.  **Mount**: The app retrieves the question, options, and current totals. It queries the latest ledger sequence `startLedger`.
2.  **Polling (4s)**:
    *   Queries `pollContractService.ts` for updated results.
    *   Queries `registryContractService.ts` for connected wallet points.
    *   Queries `eventService.ts` for events from both contract IDs starting at `startLedger`.
3.  **Reflow**: The UI re-renders with live progress bars and active rows in the Activity Feed when events are processed.
