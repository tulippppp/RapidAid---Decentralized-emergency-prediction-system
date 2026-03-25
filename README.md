# RapidAid – Emergency Prediction System

Live Demo: [RapidAid Vercel App](https://rapidaid-emergency-prediction-syste.vercel.app/)

# Overview

RapidAid is a full-stack decentralized application that enables communities to predict emergency resource shortages, stake on outcomes, and generate early warning signals.

It transforms emergency response from reactive → proactive by combining:

Collective intelligence (prediction markets)
Blockchain trust (immutable logic)
Real-time alerts (early signals)
Architecture

RapidAid uses a hybrid architecture:

# On-Chain (Blockchain Layer)
Smart contract manages:
Predictions
Stakes
Resolution
Reward distribution
Deployed on Shardeum / Hardhat

# This ensures:

Transparency
Immutability
Trustless execution
# Off-Chain (Backend Layer)
Vercel Functions + Postgres
Stores:
Field reports
Source links
Community insights

These do NOT affect payouts (blockchain remains source of truth)

# Frontend (User Interface)
Built with React + Tailwind CSS + Vite
Handles:
User interaction
Wallet connection
Data display
# Key Features
Prediction System
Create emergency predictions
Binary outcomes: YES / NO
# Staking Mechanism
Fixed stake amount per bet
Funds locked in smart contract
# Transparent Resolution
Admin resolves outcomes
Includes proof (URL/text)
# Reward Distribution
Winners receive proportional rewards
Fallback refund if no winners
# High-Risk Alert (Core Innovation)
Triggered when YES has majority stake

Indicates potential emergency resource shortage

# Field Reports (Off-chain)
Users submit:
Notes
Source links
Stored in Postgres
Enhances real-world context
# Tech Stack
Layer	Technology
Smart Contracts	Solidity + Hardhat
Blockchain	Shardeum Testnet
Web3	ethers.js
Frontend	React + Tailwind CSS + Vite
Backend	Vercel Functions
Database	Postgres
Wallet	MetaMask
# Project Structure
<img width="221" height="309" alt="Screenshot 2026-03-25 at 8 09 06 PM" src="https://github.com/user-attachments/assets/4dd57a65-bf4a-46e4-a3b8-687fea9714dc" />

#  Smart Contract Flow
Core Functions
createPrediction(title, deadline)
placeBet(predictionId, option)
resolvePrediction(predictionId, winningOption, proof)
claimReward(predictionId)

#  Assumptions
Fixed stake amount
One bet per wallet per prediction
Refund fallback if no winners
#  Local Setup
1️⃣ Install dependencies
npm install
cd frontend
npm install
cd ..

2️⃣ Start local blockchain
npm run chain

3️⃣ Deploy contract
npm run deploy:local

4️⃣ Seed demo data
npm run seed:demo:local

5️⃣ Run frontend
cd frontend
npm run dev

# Vercel Deployment
Setup
Push repo to GitHub
Import into Vercel
Keep root at project root
Environment Variables
DATABASE_URL=your_postgres_url
VITE_ENABLE_FIELD_REPORTS=true
# Database
Recommended: Neon (Postgres)
Auto-creates field_reports table
# Shardeum Deployment
1️⃣ Setup .env
PRIVATE_KEY=your_private_key
SHARDEUM_RPC_URL=https://api-mezame.shardeum.org
SHARDEUM_CHAIN_ID=8119
STAKE_AMOUNT=0.01
DATABASE_URL=your_postgres_url
VITE_ENABLE_FIELD_REPORTS=true

2️⃣ Deploy
npm run deploy:shardeum

3️⃣ (Optional) Seed data
npm run seed:demo:shardeum

  Frontend ↔ Contract Integration
  
ABI: frontend/src/config/RapidAidPredictionSystem.json
Address: frontend/src/config/contract-addresses.json

  Auto-updated after deployment

# Demo Flow 
Connect wallet
Show active prediction + alert
Add field report
Create new prediction
Place bet
Resolve outcome
Claim reward
# Why RapidAid?
- Real-world impact (emergency response)
- Strong blockchain usage
- Full-stack architecture
- Unique “prediction → action” model
Security Note
Never expose private keys
Deployment should be done locally

RapidAid is not just a prediction platform —
it is a trust layer for proactive emergency response.
