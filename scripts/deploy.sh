#!/bin/bash
# Scripts to deploy and wire the contracts on Stellar Testnet
set -e

# Real deployed addresses for reference:
# REGISTRY_CONTRACT_ADDRESS=CBY7GRA5GN75QDZ4MY2FL6QSS2TWAY6BNIWYDBNKGKNBATZCYECIZF7J
# POLL_CONTRACT_ADDRESS=CDBIC35ZRH6YXDXOW4UZ63GQZOQLTBPPAIIZSMGQSVQJKDOOYX4UR44G

echo "=== Building Smart Contracts ==="
stellar contract build

echo "=== Deploying Registry Contract ==="
REGISTRY_ADDR=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/registry_contract.wasm \
  --source deployer \
  --network testnet)
echo "Registry Contract Address: $REGISTRY_ADDR"

echo "=== Deploying Poll Contract ==="
POLL_ADDR=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/poll_contract.wasm \
  --source deployer \
  --network testnet)
echo "Poll Contract Address: $POLL_ADDR"

echo "=== Initializing Registry Contract ==="
stellar contract invoke \
  --id "$REGISTRY_ADDR" \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin GCYMLCJTY6KNGGWRXHNMPDVQIPJZDQKHU45W4TA3QUELIPCFKY3ARHF5

echo "=== Initializing Poll Contract ==="
# Write options array to a temporary JSON file to avoid shell quote-stripping issues
echo '["Stellar", "Ethereum"]' > temp_options.json

stellar contract invoke \
  --id "$POLL_ADDR" \
  --source deployer \
  --network testnet \
  -- initialize \
  --question '"Do you prefer Stellar or Ethereum?"' \
  --options-file-path temp_options.json \
  --registry "$REGISTRY_ADDR"

rm temp_options.json

echo "=== Deployment & Configuration Completed Successfully! ==="
echo "Registry Address: $REGISTRY_ADDR"
echo "Poll Address: $POLL_ADDR"
