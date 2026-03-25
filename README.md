# RapidAid - Emergency Prediction System

RapidAid is a full-stack decentralized application where communities forecast emergency resource shortages, stake on outcomes, and surface high-risk signals transparently.

It now uses two layers:

- On-chain truth for predictions, stakes, resolution, and rewards
- Off-chain Postgres storage for field reports and source links

## What the MVP does

- Create binary emergency predictions with fixed `YES` / `NO` options
- Lock a fixed stake amount inside the smart contract for every bet
- Let the contract owner resolve outcomes with a proof URL or text note
- Distribute rewards proportionally to the winning side
- Trigger a high-risk alert when `YES` has the majority of stake
- Store optional field reports in Postgres through Vercel serverless functions
- Sync deployment details from Hardhat into the React frontend automatically

## Tech stack

- Smart contracts: Solidity + Hardhat
- Web3 integration: ethers.js
- Frontend: React + Tailwind CSS + Vite
- API + database: Vercel Functions + Postgres
- Wallet: MetaMask

## Project structure

```text
RapidAid/
├── api/
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
├── vercel.json
├── hardhat.config.js
└── package.json
```

## Architecture

### On-chain

- `contracts/RapidAidPredictionSystem.sol` stores predictions, stakes, proof, and payouts
- Shardeum or local Hardhat is the source of truth for all financial logic

### Off-chain

- `api/reports.js` is a Vercel serverless function
- It stores community field reports in Postgres using `DATABASE_URL`
- These reports are optional and do not affect payouts or betting logic

### Frontend

- `frontend/src/hooks/useRapidAid.js` loads blockchain data
- `frontend/src/components/PredictionCard.jsx` shows market state and actions
- `frontend/src/components/FieldReports.jsx` loads and submits off-chain field reports

## Smart contract flow

### Main functions

- `createPrediction(title, deadline)`
- `placeBet(predictionId, option)`
- `resolvePrediction(predictionId, winningOption, proof)`
- `claimReward(predictionId)`

### MVP assumptions

- Stake size is fixed contract-wide
- Each wallet can place one bet per prediction
- If the resolved winning side has zero stakers, the contract falls back to refund mode so funds are never trapped

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

This creates sample predictions and sample stakes so the emergency alert banner appears immediately.

### 5. Start the frontend

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in your terminal, then connect MetaMask to the local Hardhat network.

## Vercel deployment

### What gets deployed where

- Vercel hosts the React frontend from `frontend/dist`
- Vercel Functions serve the API from `api/`
- Postgres stores off-chain field reports
- Shardeum stores the contract state

### Recommended production setup

1. Push the repo to GitHub
2. Import the repo into Vercel
3. Keep the Vercel project root at the repository root
4. Let `vercel.json` handle install, build, and output settings

### Environment variables for Vercel

Add these in the Vercel dashboard:

```env
DATABASE_URL=postgres://user:password@your-neon-host/dbname?sslmode=require
VITE_ENABLE_FIELD_REPORTS=true
```

You usually do not need `PRIVATE_KEY` in Vercel. Smart contract deployment is safer from your local machine.

### Database recommendation

Use a Postgres provider that plugs into Vercel easily, such as Neon.

`api/reports.js` auto-creates the `field_reports` table on first request, so you do not need a migration step for the hackathon MVP.

### What the database stores

- prediction id
- chain id
- contract address
- wallet address of the reporter
- note text
- source URL
- created timestamp

This gives judges a proper full-stack story while keeping the blockchain responsible for money and trust.

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
DATABASE_URL=postgres://user:password@your-neon-host/dbname?sslmode=require
VITE_ENABLE_FIELD_REPORTS=true
```

### 2. Fund the wallet with test SHM

Make sure the deployer wallet has Shardeum testnet gas before deploying.

### 3. Deploy the contract

```bash
npm run deploy:shardeum
```

The script updates the frontend contract ABI and stores the deployed address for chain `8119`.

### 4. Optional: seed sample predictions

```bash
npm run seed:demo:shardeum
```

On Shardeum this creates sample predictions from the deployer wallet. For live staking variety, use multiple wallets in the frontend.

### 5. Push the updated config

After `npm run deploy:shardeum`, commit and push:

- `deployments/8119.json` once created
- `frontend/src/config/RapidAidPredictionSystem.json`
- `frontend/src/config/contract-addresses.json`

Vercel will rebuild the frontend with the live Shardeum contract address.

## How the frontend connects to the contract

The integration is intentionally simple:

- ABI file: `frontend/src/config/RapidAidPredictionSystem.json`
- Address map: `frontend/src/config/contract-addresses.json`
- Network metadata: `frontend/src/config/networks.js`
- Reports API: `api/reports.js`

When you deploy with Hardhat, the deploy script refreshes the ABI and address files automatically. The React app can then read and write to the latest deployed contract immediately.

## Demo script for judges

1. Open the app and connect MetaMask
2. Show an active seeded prediction with the high-risk `YES` alert
3. Open a prediction and show the off-chain field reports section
4. Add a field report with a source link
5. Create a new emergency prediction from the form
6. Stake on a prediction from another wallet
7. After the deadline, resolve it from the owner wallet with proof
8. Claim the reward from the winning wallet

## Verified locally

- `npm run compile`
- `npm run deploy:local`
- `npm run seed:demo:local`
- `cd frontend && npm run build`

## Notes

- The public address you shared is enough for funding or verification, but deployment requires the private key of the wallet that controls that address. Never paste that private key into chat or commit it to the repo.
- For a fast hackathon demo, set prediction deadlines a few minutes ahead so the full create -> stake -> resolve -> reward loop fits comfortably in one session.
- `SHM` is the Shardeum gas token. If someone says “deploy with SHM,” they mean fund the wallet with test SHM before running the Hardhat deploy script.
