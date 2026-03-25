// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RapidAidPredictionSystem is Ownable, ReentrancyGuard {
    struct Prediction {
        string title;
        string yesLabel;
        string noLabel;
        address creator;
        uint64 createdAt;
        uint64 deadline;
        bool resolved;
        bool winningOption;
        bool refundOnly;
        string proof;
        uint256 totalYesStake;
        uint256 totalNoStake;
        uint256 totalPool;
    }

    struct Bet {
        bool exists;
        bool option;
        bool claimed;
        uint256 amount;
    }

    uint256 public immutable stakeAmount;

    Prediction[] private predictions;
    mapping(uint256 => mapping(address => Bet)) private bets;

    event PredictionCreated(
        uint256 indexed predictionId,
        address indexed creator,
        string title,
        uint256 deadline
    );
    event BetPlaced(
        uint256 indexed predictionId,
        address indexed bettor,
        bool option,
        uint256 amount
    );
    event PredictionResolved(
        uint256 indexed predictionId,
        bool winningOption,
        bool refundOnly,
        string proof
    );
    event RewardClaimed(
        uint256 indexed predictionId,
        address indexed bettor,
        uint256 payout
    );

    constructor(uint256 _stakeAmount) Ownable(msg.sender) {
        require(_stakeAmount > 0, "Stake amount must be greater than zero");
        stakeAmount = _stakeAmount;
    }

    function createPrediction(
        string calldata title,
        uint256 deadline
    ) external returns (uint256 predictionId) {
        require(bytes(title).length > 0, "Title is required");
        require(deadline > block.timestamp, "Deadline must be in the future");

        Prediction memory newPrediction = Prediction({
            title: title,
            yesLabel: "YES",
            noLabel: "NO",
            creator: msg.sender,
            createdAt: uint64(block.timestamp),
            deadline: uint64(deadline),
            resolved: false,
            winningOption: false,
            refundOnly: false,
            proof: "",
            totalYesStake: 0,
            totalNoStake: 0,
            totalPool: 0
        });

        predictions.push(newPrediction);
        predictionId = predictions.length - 1;

        emit PredictionCreated(predictionId, msg.sender, title, deadline);
    }

    function placeBet(uint256 predictionId, bool option) external payable {
        Prediction storage prediction = _getPrediction(predictionId);
        Bet storage userBet = bets[predictionId][msg.sender];

        require(block.timestamp < prediction.deadline, "Betting deadline passed");
        require(!prediction.resolved, "Prediction already resolved");
        require(msg.value == stakeAmount, "Incorrect stake amount");
        require(!userBet.exists, "Wallet already staked on this prediction");

        userBet.exists = true;
        userBet.option = option;
        userBet.claimed = false;
        userBet.amount = msg.value;

        prediction.totalPool += msg.value;

        if (option) {
            prediction.totalYesStake += msg.value;
        } else {
            prediction.totalNoStake += msg.value;
        }

        emit BetPlaced(predictionId, msg.sender, option, msg.value);
    }

    function resolvePrediction(
        uint256 predictionId,
        bool winningOption,
        string calldata proof
    ) external onlyOwner {
        Prediction storage prediction = _getPrediction(predictionId);

        require(!prediction.resolved, "Prediction already resolved");
        require(block.timestamp >= prediction.deadline, "Deadline not reached");
        require(bytes(proof).length > 0, "Proof is required");

        prediction.resolved = true;
        prediction.winningOption = winningOption;
        prediction.proof = proof;

        uint256 winningPool = winningOption
            ? prediction.totalYesStake
            : prediction.totalNoStake;

        prediction.refundOnly = winningPool == 0;

        emit PredictionResolved(
            predictionId,
            winningOption,
            prediction.refundOnly,
            proof
        );
    }

    function claimReward(uint256 predictionId) external nonReentrant {
        Prediction storage prediction = _getPrediction(predictionId);
        Bet storage userBet = bets[predictionId][msg.sender];

        require(prediction.resolved, "Prediction not resolved");
        require(userBet.exists, "No stake found");
        require(!userBet.claimed, "Reward already claimed");

        uint256 payout;

        if (prediction.refundOnly) {
            payout = userBet.amount;
        } else {
            require(
                userBet.option == prediction.winningOption,
                "Only winning side can claim"
            );

            uint256 winningPool = prediction.winningOption
                ? prediction.totalYesStake
                : prediction.totalNoStake;

            payout = (userBet.amount * prediction.totalPool) / winningPool;
        }

        userBet.claimed = true;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");

        emit RewardClaimed(predictionId, msg.sender, payout);
    }

    function getPrediction(
        uint256 predictionId
    ) external view returns (Prediction memory) {
        return _getPrediction(predictionId);
    }

    function getAllPredictions() external view returns (Prediction[] memory) {
        return predictions;
    }

    function getPredictionCount() external view returns (uint256) {
        return predictions.length;
    }

    function getUserBet(
        uint256 predictionId,
        address user
    ) external view returns (Bet memory) {
        _requirePredictionExists(predictionId);
        return bets[predictionId][user];
    }

    function _getPrediction(
        uint256 predictionId
    ) internal view returns (Prediction storage) {
        _requirePredictionExists(predictionId);
        return predictions[predictionId];
    }

    function _requirePredictionExists(uint256 predictionId) internal view {
        require(predictionId < predictions.length, "Prediction does not exist");
    }
}
