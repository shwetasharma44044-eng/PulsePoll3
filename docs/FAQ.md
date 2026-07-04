# Developer FAQ

Frequently Asked Questions regarding the PulsePoll project setup and smart contract details.

### How do I compile the contracts?
Run `stellar contract build` at the project root to compile Rust files into WASM targets.

### How do I handle contract deployment failures?
Ensure your deployer account has sufficient Testnet XLM and that you are using the correct network configurations in Stellar CLI.