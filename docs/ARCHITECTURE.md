# PulsePay2 Architecture

This document describes the architectural layout of the **PulsePay2** dApp.

## Smart Contract Layout
- Built using Stellar Soroban SDK (v22.0.0).
- Located in `contracts/pulsepay2`.
- Implements vote counting and cryptographic wallet verification.

## Frontend Architecture
- Built with React, TypeScript, Vite, and Tailwind CSS.
- Integrates with Freighter wallet via Stellar Wallets Kit.
