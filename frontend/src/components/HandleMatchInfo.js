import { useState, useEffect, useRef } from "react";

export const MatchStatus = {
    Pending: 0,
    Underway: 1,
    Finished: 2,
    Cancelled: 3
}

export function handleMatchInfo(oracle, wager, selectedAddress, isInitializing) {
    const [trackedMatchIds, setTrackedMatchIds] = useState(new Set());
    const [matchData, setMatchData] = useState({});

    const trackedMatchIdsRef = useRef(trackedMatchIds);
    useEffect(() => {
        trackedMatchIdsRef.current = trackedMatchIds;
    }, [trackedMatchIds]);

    useEffect(() => {
        if (isInitializing || !oracle) {
            return;
        }

        const updateTrackedMatchIds = async () => {
            try {
                const [pendingMatchIds, historyBetIds, historyClaimedIds] = await Promise.all([
                    oracle.getMatchesWithStatus(MatchStatus.Pending),
                    wager.getMatchesWithBets(selectedAddress),
                    wager.getMatchesWithClaims(selectedAddress)
                ]);
                //console.log(`### raw matchIds: ${pendingMatchIds}`);
                setTrackedMatchIds(old => {
                    const updated = new Set(old);
                    pendingMatchIds.forEach(matchId => {
                        //console.log(`### ## raw id: ${matchId} => new id: ${Number(matchId)}`)
                        updated.add(Number(matchId));
                    });
                    historyBetIds.forEach(matchId => {
                        updated.add(Number(matchId));
                    });
                    // Forget about all matches that have already be finalised and claimed
                    historyClaimedIds.forEach(matchId => {
                       updated.delete(Number(matchId));
                    });
                    return updated
                });
            } catch (error) {
                console.error(error.message ?? "Failed to get tracked match Ids");
            }
        }

        const updateTrackedMatchInformation = async () => {
            try {
                const matchIds = Array.from(trackedMatchIdsRef.current);
                // console.log(`matchIds.length: ${matchIds.length}`)
                if (matchIds.length === 0) {
                    return;
                }

                const matchPromises = matchIds.map((matchId) => oracle.getMatchByID(matchId));
                const results = await Promise.all(matchPromises);

                const matchInformation = {};
                results.forEach((match, index) => {
                    matchInformation[Number(match.id)] = {
                        matchId: Number(match.id),
                        homeTeam: {
                            teamId: Number(match.homeTeam.id),
                            name: match.homeTeam.name
                        },
                        awayTeam: {
                            teamId: Number(match.awayTeam.id),
                            name: match.awayTeam.name
                        },
                        epochTime: Number(match.epochTime),
                        status: match.status,
                        winner: Number(match.winner)
                    }
                });

                // console.log(`new match data: ${JSON.stringify(matchInformation)}`)
                // console.log("matchInformation?", matchInformation)

                setMatchData(old => ({
                    ...old,
                    ...matchInformation
                }));

            } catch (error) {
                console.error(error.message ?? "Could not fetch matches from Oracle");
            }
        }

        // 60 seconds before querying new match IDs
        const findNewMatches = setInterval(updateTrackedMatchIds, 10000);
        // 30 seconds between each tracked match information refresh
        const updateMatchData = setInterval(updateTrackedMatchInformation, 2000);

        return () => {
            clearInterval(findNewMatches);
            clearInterval(updateMatchData);
        };
    }, [oracle]);

    // useEffect(() => {
    //     console.log("Tracked IDs actually changed in state:", Array.from(trackedMatchIds));
    // }, [trackedMatchIds]);

    useEffect(() => {
        console.log(`matchIds: ${JSON.stringify(trackedMatchIds)} || matchData: ${JSON.stringify(matchData)}`);
    }, [trackedMatchIds, matchData])

    return {
        matchIds: Array.from(trackedMatchIds),
        matchData,
    };
}