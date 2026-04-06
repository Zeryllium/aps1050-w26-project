// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface OracleInterface {
    enum MatchStatus {
        Pending,
        Underway,
        Finished,
        Cancelled
    }

    struct Team {
        uint32 id;
        string name;
    }

    struct Match {
        uint32 id;
        Team homeTeam;
        Team awayTeam;
        uint32 epochTime;
        MatchStatus status;
        uint32 winner;
    }

    function getAddress() external view returns (address);

    /***
     * @notice Check if a match exists
     * @param _matchId the match ID to search for
     * @return True if the match exists
     */
    function matchExists(uint32 _matchId) external view returns (bool);

    /***
     * @notice Adds a match
     * @param _newMatch The Match object to add (as defined above)
     */
    function addMatch(Match calldata _newMatch) external;

    /***
     * @notice Updates a match's status and winner (if applicable)
     * @param _id The ID of the match to update
     * @param _matchData The updated match data
     */
    function updateMatch(uint32 _id, Match calldata _matchData) external;

    /***
     * @notice Gets all matches that correspond to a certain MatchStatus
     * @param _status the MatchStatus to look for
     * @return An array of all the matchIDs corresponding to matches in the provided status
     */
    function getMatchesWithStatus(MatchStatus _status) external view returns (uint32[] memory);

    /***
     * @notice Gets the match information corresponding to the provided matchID
     * @param _id The matchID to look for
     * @return The Match object with all the relevant information for that match
     */
    function getMatchByID(uint32 _id) external view returns(Match memory);

    /***
     * @notice Test Data
     */
    function addTestData() external;
}
