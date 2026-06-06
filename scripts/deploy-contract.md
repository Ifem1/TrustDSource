# Deploying the Trustdsource GenLayer Intelligent Contract

## Prerequisites

- GenLayer Studio account at https://studio.genlayer.com
- MetaMask or compatible wallet connected to StudioNet

## Steps

### 1. Open GenLayer Studio

Navigate to https://studio.genlayer.com and connect your wallet.

### 2. Create a New Intelligent Contract

In the Studio IDE, create a new contract file named `trustdsource_contract.py`.

### 3. Paste the Contract Code

Copy the entire contents of:
```
intelligent-contract/trustdsource_contract.py
```

Paste it into the Studio editor.

### 4. Deploy to StudioNet

Click "Deploy" in the Studio interface.

The contract will be compiled and deployed to GenLayer StudioNet.

### 5. Copy the Contract Address

After successful deployment, copy the contract address from the Studio dashboard.

It will look like: `0x...` (a hex address)

### 6. Return the Contract Address

Provide the deployed contract address so the frontend integration can be completed.

## After Deployment

Once you have the contract address, set it in your environment:

```env
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE
```

The platform will automatically:
- Submit content to the contract via `submit_content()`
- Poll for verification completion
- Display results from `get_report()`
- Show on-chain proofs in the GenLayerProofPanel
