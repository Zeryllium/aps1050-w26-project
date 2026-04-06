// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OracleInterface} from "./OracleInterface.sol";

contract Wager is Ownable {
    uint8 private housePercentage = 2;

    struct WagerMatch {
        uint32 matchId;
        uint256 totalPot;
        bool resolved;
    }

    // Mapping for matchId => WagerMatch object
    mapping(uint32 => WagerMatch) private matches;

    // Mapping for matchId => teamId => totalAmount
    // Stores the total number of tokens bet on a specific team in a specific match
    mapping(uint32 => mapping(uint32 => uint256)) private poolPerTeam;

    // Mapping for matchId => userAddress => chosenTeamId => stakedAmount
    // Stores how many tokens a user has bet on a specific team on a specific match
    mapping(uint32 => mapping(address => mapping(uint32 => uint256))) private bets;

    // Mapping for userAddress => matchId => hasUserBetOnMatch
    // Stores which matches a user has bet on
    mapping(address => mapping(uint32 => bool)) private hasUserBetOnMatch;

    // Mapping for userAddress => matchId => hasUserClaimedMatch
    // Stores which matches a user has claimed earnings on
    mapping(address => mapping(uint32 => bool)) private hasUserClaimedMatch;

    OracleInterface internal oracle;

    IERC20 public lightToken;

    constructor(address _initialOwner, address _tokenAddress) Ownable(_initialOwner) {
        lightToken = IERC20(_tokenAddress);
    }

    function setupOracle(address _oracleAddress) external onlyOwner returns (bool) {
        require(_oracleAddress != address(0), "Cannot set Oracle to address zero");
        oracle = OracleInterface(_oracleAddress);
        return (oracle.getAddress() == _oracleAddress);
    }

    modifier oracleReady() {
        require(address(oracle) != address(0), "Oracle not set up");
        _;
    }

    function getPendingMatches() public view oracleReady returns (uint32[]) {
        return oracle.getMatchesWithStatus(OracleInterface.MatchStatus.Pending);
    }

    function getMatch(uint32 _matchId) public view oracleReady returns (OracleInterface.Match) {
        return oracle.getMatchByID(_matchId);
    }

    function placeBet(uint32 _matchId, uint32 _chosenTeamId, uint256 _amount) external oracleReady {
        require(getMatch(_matchId).status == OracleInterface.MatchStatus.Pending, "Betting window has closed");
        // TODO: Is there reason to (allow / not allow) multiple bets from the same user on the same match?
        // require(!hasUserBetOnMatch[msg.sender][_matchId], "Cannot bet twice on the same match");
        require(lightToken.transferFrom(msg.sender, address(this), _amount), "Transaction failed");

        // Add the bet and update all mappings
        matches[_matchId].totalPot += _amount;
        poolPerTeam[_matchId][_chosenTeamId] += _amount;

        if (!hasUserBetOnMatch[msg.sender][_matchId]) {
            hasUserBetOnMatch[msg.sender][_matchId] = true;
        }
        bets[_matchId][msg.sender][_chosenTeamId] += _amount;
    }

    function claimEarnings(uint32 _matchId) external oracleReady {
        WagerMatch storage wagerMatch = matches[_matchId];
        OracleInterface.Match memory oracleMatch = getMatch(_matchId);

        require(oracleMatch.status == OracleInterface.MatchStatus.Finished, "Match is not over");
        require(!hasUserClaimedMatch[msg.sender][_matchId], "Already claimed earnings");

        // Amount of tokens this user has bet on the winning team
        uint256 userBet = bets[_matchId][msg.sender][oracleMatch.winner];
        require(userBet > 0, "Did not win");

        // Payout to the user a share proportional to their bet across all winning bets, with a house fee withheld
        uint256 payout = (wagerMatch.totalPot * (100 - housePercentage) / 100) * userBet / poolPerTeam[_matchId][oracleMatch.winner];
        hasUserClaimedMatch[msg.sender][_matchId] = true;
        require(lightToken.transfer(msg.sender, payout), "Transfer failed");
    }
}
