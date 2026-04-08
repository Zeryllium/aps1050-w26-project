// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {OracleInterface} from "./OracleInterface.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Oracle is Ownable, OracleInterface {
    Match[] matches;
    mapping(uint32 => uint) matchIdToIndex;

    mapping(MatchStatus => uint32[]) public matchesByStatus;
    mapping(uint32 => uint) matchIdToStatusArrayIndex;

    event MatchCreated(uint32 indexed matchId, uint32 homeTeam, uint32 awayTeam, uint32 startTime);
    event MatchStatusUpdated(uint32 indexed matchId, MatchStatus newStatus, uint32 winner);

    constructor(address initialOwner) Ownable(initialOwner) {
    }

    function getAddress() public view returns (address) {
        return address(this);
    }

    /***
     * @notice Check if a match exists
     * @param _matchId the match ID to search for
     * @return True if the match exists
     */
    function matchExists(uint32 _matchId) public view returns (bool) {
        if (matches.length == 0) {
            return false;
        }

        uint index = matchIdToIndex[_matchId];
        return matches[index].id == _matchId;
    }

    /***
     * @notice Adds a match
     * @param _newMatch The Match object to add (as defined above)
     */

    function addMatch(Match calldata _newMatch) onlyOwner public {
        _addMatch(_newMatch);
    }

    /***
     * @notice addMatch workaround to be callable within the contract for test data
     * @param _newMatch The Match object to add (as defined above)
     */
    function _addMatch(Match memory _newMatch) internal {
        // Only new matches should be added
        require(!matchExists(_newMatch.id), "Match already exists");

        // Push a match into memory and add it to the lookup
        matches.push(_newMatch);
        matchIdToIndex[_newMatch.id] = matches.length - 1;

        // Push a match id into the corresponding matchesByStatus array and store the
        // reverse mapping in matchIdToStatusArrayIndex
        matchesByStatus[_newMatch.status].push(_newMatch.id);
        matchIdToStatusArrayIndex[_newMatch.id] = matchesByStatus[_newMatch.status].length - 1;

        // Emit an event
        emit MatchCreated(_newMatch.id, _newMatch.homeTeam.id, _newMatch.awayTeam.id, _newMatch.epochTime);
    }

    /***
     * @notice Updates a match's status and winner (if applicable)
     * @param _id The ID of the match to update
     * @param _matchData The updated match data
     */
    function updateMatch(uint32 _id, Match calldata _matchData) onlyOwner public {
        // Require that the match exists before modification
        require(matchExists(_id), "Match does not exist");

        // Get the current match information fromthe blockchain
        Match storage matchToUpdate = matches[matchIdToIndex[_id]];

        // Require that the match id is consistent with the match being updated
        require(_id == matchToUpdate.id, "Match ID does not correspond to the Match being updated");

        // Require that the status has changed
        require(matchToUpdate.status != _matchData.status, "Status unchanged, skipping operation");

        if (_matchData.status == MatchStatus.Finished) {
            require((_matchData.winner == _matchData.homeTeam.id) || (_matchData.winner == _matchData.awayTeam.id), "Declaring invalid winner");
        }

        // Update the state of the match on the blockchain
        MatchStatus oldStatus = matchToUpdate.status;
        matchToUpdate.status = _matchData.status;
        if (_matchData.status == MatchStatus.Finished) {
            matchToUpdate.winner = _matchData.winner;
        }

        // Update the mappings to support future O(1) reads
        uint32[] storage oldStatusMap = matchesByStatus[oldStatus];
        uint indexInOldStatusMap = matchIdToStatusArrayIndex[_id];
        uint lastIndexInOldStatusMap = oldStatusMap.length - 1;

        // Swap with last element in the status array and pop to update
        if (indexInOldStatusMap != lastIndexInOldStatusMap) {
            uint32 lastMatchIdInStatusArray = oldStatusMap[lastIndexInOldStatusMap];
            oldStatusMap[lastIndexInOldStatusMap] = _id;
            oldStatusMap[indexInOldStatusMap] = lastMatchIdInStatusArray;

            // Update the reverse mapping of the swapped last element too
            matchIdToStatusArrayIndex[lastMatchIdInStatusArray] = indexInOldStatusMap;
        }
        oldStatusMap.pop();

        // Adds the match to the status array matching its new status and
        // update the reverse mapping too
        matchesByStatus[_matchData.status].push(_id);
        matchIdToStatusArrayIndex[_id] = matchesByStatus[_matchData.status].length - 1;

        // Emit an event
        emit MatchStatusUpdated(_id, _matchData.status, _matchData.winner);
    }

    /***
     * @notice Gets all matches that correspond to a certain MatchStatus
     * @param _status the MatchStatus to look for
     * @return An array of all the matchIDs corresponding to matches in the provided status
     */
    function getMatchesWithStatus(MatchStatus _status) public view returns (uint32[] memory) {
        return matchesByStatus[_status];
    }

    /***
     * @notice Gets the match information corresponding to the provided matchID
     * @param _id The matchID to look for
     * @return The Match object with all the relevant information for that match
     */
    function getMatchByID(uint32 _id) public view returns(Match memory) {
        require(matchExists(_id), "Match does not exist");

        return matches[matchIdToIndex[_id]];
    }

    /***
     * @notice Test Data
     */
    function addTestData() onlyOwner external {
        Match memory testMatch0 = Match(
            1111,
            Team(12345, "HomeTeam"),
            Team(24680, "AwayTeam"),
            1234567890,
            MatchStatus.Pending,
            0
        );
        _addMatch(testMatch0);

        Match memory testMatch1 = Match(
            1112,
            Team(33333, "HomeTeam"),
            Team(44444, "AwayTeam"),
            1248163264,
            MatchStatus.Pending,
            0
        );
        _addMatch(testMatch1);

        Match memory testMatch2 = Match(
            1113,
            Team(44444, "HomeTeam"),
            Team(55555, "AwayTeam"),
            1359173157,
            MatchStatus.Pending,
            0
        );
        _addMatch(testMatch2);
    }
}
