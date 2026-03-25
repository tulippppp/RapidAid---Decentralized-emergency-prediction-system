# RapidAid - Emergency Prediction System

RapidAid is a full-stack decentralized application where communities forecast emergency resource shortages, stake on outcomes, and surface high-risk signals transparently on-chain.

## What this MVP does

- Create binary emergency predictions with fixed `YES` / `NO` options.
- Lock a fixed stake amount inside the smart contract for every bet.
- Let the contract owner resolve outcomes with a proof URL or text note.
- Distribute rewards proportionally to the winning side.
- Trigger a high-risk alert in the frontend whenever `YES` has the majority of stake.
- Sync deployment details from Hardhat into the React frontend automatically.

## Tech stack

- Smart contracts: Solidity + Hardhat
- Web3 integration: ethers.js
- Frontend: React + Tailwind CSS + Vite
- Wallet: MetaMask

## Project structure

```text
RapidAid/
├── components/
├── contracts/
├── deployments/
├── frontend/
│   └── src/
│       ├── components/
│       ├── config/
│       ├── hooks/
│       └── lib/
├── scripts/
├── hardhat.config.js
└── package.json
```

## Smart contract flow

### Main functions

- `createPrediction(title, deadline)`
- `placeBet(predictionId, option)`
- `resolvePrediction(predictionId, winningOption, proof)`
- `claimReward(predictionId)`

### MVP assumptions

- Stake size is fixed contract-wide.
- Each wallet can place one bet per prediction.
- If the resolved winning side has zero stakers, the contract falls back to refund mode so funds are never trapped.

## Local run

### 1. Install dependencies

```bash
npm install
cd frontend
npm install
cd ..
```

### 2. Start Hardhat local chain

```bash
npm run chain
```

### 3. Deploy the contract locally

Open a second terminal in the project root and run:

```bash
npm run deploy:local
```

This deploy script will:

- deploy `RapidAidPredictionSystem`
- save deployment data in `deployments/`
- copy the ABI into `frontend/src/config/RapidAidPredictionSystem.json`
- copy the address into `frontend/src/config/contract-addresses.json`

### 4. Seed demo predictions

```bash
npm run seed:demo:local
```

This creates sample predictions and places sample stakes so the emergency alert banner appears immediately.

### 5. Start the frontend

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in your terminal, then connect MetaMask to the local Hardhat network.

## Shardeum testnet deployment

### 1. Create a root `.env`

Copy the sample file:

```bash
cp .env.example .env
```

Then fill in:

```env
PRIVATE_KEY=0xyour_private_key
SHARDEUM_RPC_URL=https://api-mezame.shardeum.org
SHARDEUM_CHAIN_ID=8119
STAKE_AMOUNT=0.01
```

### 2. Deploy

```bash
npm run deploy:shardeum
```

The script updates the frontend contract ABI and stores the deployed address for chain `8119`.

### 3. Optional: seed sample predictions

```bash
npm run seed:demo:shardeum
```

On Shardeum this will create sample predictions from the deployer wallet. For live staking variety, use multiple wallets in the frontend.

### 4. Run the frontend

```bash
cd frontend
npm run dev
```

If MetaMask is not already on the correct chain, the app can prompt a network switch.

## How the frontend connects to the contract

The integration is intentionally simple:

- ABI file: `frontend/src/config/RapidAidPredictionSystem.json`
- Address map: `frontend/src/config/contract-addresses.json`
- Network metadata: `frontend/src/config/networks.js`

When you deploy with Hardhat, the deploy script refreshes those files automatically. That means the React app can immediately read and write to the latest deployed contract.

## Demo script for judges

1. Open the app and connect MetaMask.
2. Show an active seeded prediction with the high-risk `YES` alert.
3. Create a new emergency prediction from the form.
4. Stake on a prediction from another wallet.
5. After the deadline, resolve it from the owner wallet with proof.
6. Claim the reward from the winning wallet.

## Verified locally

- `npm run compile`
- `npm run deploy:local`
- `npm run seed:demo:local`
- `cd frontend && npm run build`

## Notes

- The public address you shared is enough for funding or verification, but deployment requires the private key of the wallet that controls that address. Never paste that private key into chat or commit it to the repo.
- For a fast hackathon demo, set prediction deadlines a few minutes ahead so the full create -> stake -> resolve -> reward loop fits comfortably in one session.
