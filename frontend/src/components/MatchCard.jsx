import {MatchStatus} from "./HandleMatchInfo.js";
import * as UI from "../ui/ui.js"
import {ethers} from "ethers";
import {useEffect, useState} from "react";

const statusToText = (status) => {
    switch(status) {
        case 0:
            return "Pending";
        case 1:
            return "Underway";
        case 2:
            return "Finished";
        case 3:
            return "Cancelled";
        default:
            return "Unknown";
    }
}

export default function MatchCard({ match, token, wager, selectedAddress, isInitializing}) {
    const [betAmount, setBetAmount] = useState("0");
    const [betTeam, setBetTeam] = useState(null);
    const [hasClaimed, setHasClaimed] = useState(false);
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        const checkUserBet = async() => {
            // match may be undefined because HandleMatchInfo.findNewMatches can return matchIds
            // before HandleMatchInfo.updateMatchData runs, which leads to known matchIds without
            // corresponding matchData
            if (isInitializing || !match || !wager || !selectedAddress) {
                return;
            }
            try {
                const userWager = wager.connect(wager.provider.getSigner(selectedAddress));

                const [_teamId, _betAmount, _betClaimed] = await userWager.getBetInfo(
                    Number(match.matchId),
                    selectedAddress
                );
                if (_teamId !== 0) {
                    setBetTeam(_teamId)
                    setBetAmount(_betAmount);
                    setHasClaimed(_betClaimed);
                }
                console.log(`_teamID = ${_teamId} _betAmount = ${_betAmount} _betClaimed = ${_betClaimed}`);
            } catch (error) {
                console.error(error.message ?? "Failed to get user bet information")
            }
        }
        checkUserBet();
    }, [match, wager]);

    // Do not attempt to render the rest of this component if matchData has not yet been fetched by
    // HandleMatchInfo.updateMatchData
    if (match === undefined) {
        return (
            <div className={"flex flex-col rounded-2xl bg-white min-h-60 w-full"}>
                <div>
                    Match not loaded yet
                </div>
            </div>
        )
    }

    // Disables the button to claim if the user is not eligible to claim a reward
    const canClaim = (
        (match.status === MatchStatus.Finished) && (
            betTeam &&
            Number(match.winner) !== 0 &&
            Number(match.winner) === betTeam &&
            betAmount > 0
        )
    );

    const handlePlaceBet = async () => {
        console.log(`Attempting to place a bet on team ${betTeam} of amount ${betAmount}`);
        if (betTeam === null) {
            alert("Select a team first before betting");
            return;
        }
        if (betAmount <= 0) {
            alert("Bet amount must be a positive number");
            return;
        }

        try {
            setIsPending(true);
            const amount = ethers.utils.parseUnits(betAmount, 18);

            const approveTx = await token.approve(wager.address, amount);
            await approveTx.wait();

            const betTx = await wager.placeBet(match.matchId, betTeam, amount);
            await betTx.wait();

            alert(`Bet of ${betAmount} LIT placed successfully`);
        } catch (error) {
            console.error(error.message ?? "Failed to place bet")
            alert(`Failed to place bet of ${betAmount} LIT`);
        } finally {
            setIsPending(false)
        }
    }

    const handleClaimEarnings = async() => {
        try {
            setIsPending(true)
            const tx = await wager.claimEarnings(Number(match.matchId));
            await tx.wait();
            alert("Claimed Earnings!");
            setHasClaimed(true);
        } catch (error) {
            console.error(error.message ?? "Failed to claim earnings")
            alert("Failed to claim earnings");
        } finally {
            setIsPending(false)
        }
    }

    // Generates the center item in the Match Card depending on the match state
    //      MatchStatus.Pending => We want to be able to bet on this
    //      MatchStatus.Underway => No betting or claiming allowed
    //      MatchStatus.Finished => Display the claiming button but only enable it for eligible users
    function cardCenterItem() {
        if (match.status === MatchStatus.Pending) {
            return (
                <>
                    <label className={`${UI.textH3Style} w-full`}>
                        Amount
                    </label>
                    <input
                        className={`${UI.inputClass} w-full`}
                        id={"betAmount"}
                        placeholder={"0"}
                        type={"number"}
                        onChange={(e) => setBetAmount(e.target.value)}
                    />
                    <button
                        className={`${UI.buttonGreen} w-full`}
                        onClick={handlePlaceBet}
                        disabled={isPending}
                    >
                        Bet
                    </button>
                </>
            )
        } else if (match.status === MatchStatus.Underway) {
            return (
                <div className={`${UI.textH3Style} items-center justify-center`}>
                    Match Underway
                </div>
            )
        } else if (match.status === MatchStatus.Finished) {
            return (
                <>
                    <div className={UI.textH3Style}>
                        Claim Earnings
                    </div>
                    {
                        canClaim ? (
                            <button
                                className={`${UI.buttonGreen} w-full`}
                                onClick={handleClaimEarnings}
                                disabled={isPending || hasClaimed}
                            >
                                Claim
                            </button>
                        ) : (
                            <button
                                className={`${UI.buttonRed} w-full`}
                                disabled={true}
                            >
                                Did not win
                            </button>
                        )
                    }
                </>
            )
        } else {
            return (
                <div className={UI.textH3Style}>
                    Match Cancelled
                </div>
            )
        }
    }

    return (
        <div className={"flex flex-col rounded-2xl bg-white min-h-60 w-full"}>
            <div className={"flex flex-row justify-between p-2"}>
                <div className={`${UI.textH3Style}`}>
                    Match #{match.matchId}
                </div>

                <div className={`${UI.textDescription}`}>
                    Start Time: {match.epochTime}
                </div>
            </div>
            <hr/>

            <div className={"grid grid-cols-3 gap-4 p-4 h-full"}>
                {/* Home Team */}
                <button
                    className={`${(betTeam === null || betTeam !== match.homeTeam.teamId) ? UI.buttonGrey : UI.buttonGreenDisabled}`}
                    disabled={betTeam === match.homeTeam.teamId || isPending || match.status !== MatchStatus.Pending}
                    onClick={(e) => setBetTeam(match.homeTeam.teamId)}
                >
                    <div className={"flex flex-col w-full text-left"}>
                        <div className={"text-xl font-bold text-slate-900"}>
                            Home
                        </div>
                        {
                            match.status === MatchStatus.Finished && match.winner === match.homeTeam.teamId ? (
                                <div className={"text-green-600 font-bold"}>
                                    {match.homeTeam.name}
                                    <hr/>
                                    <div className={"text-sm"}>
                                        Winner
                                    </div>
                                </div>
                            ) : (
                                <div className={"text-slate-600"}>
                                    {match.homeTeam.name}
                                </div>
                            )
                        }
                    </div>
                </button>
                {/* Center item (see above) */}
                <div className={"flex flex-col items-center"}>
                    {cardCenterItem()}

                </div>
                {/* Away Team */}
                <button
                    className={`${(betTeam === null || betTeam !== match.awayTeam.teamId) ? UI.buttonGrey : UI.buttonGreenDisabled}`}
                    disabled={betTeam === match.awayTeam.teamId || isPending || match.status !== MatchStatus.Pending}
                    onClick={(e) => setBetTeam(match.awayTeam.teamId)}
                >
                    <div className={"flex flex-col w-full text-left"}>
                        <div className={"text-xl font-bold text-slate-900"}>
                            Away
                        </div>
                        {
                            match.status === MatchStatus.Finished && match.winner === match.awayTeam.teamId ? (
                                <div className={"text-green-600 font-bold"}>
                                    {match.awayTeam.name}
                                    <hr/>
                                    <div className={"text-sm"}>
                                        Winner
                                    </div>
                                </div>
                            ) : (
                                <div className={"text-slate-600"}>
                                    {match.awayTeam.name}
                                </div>
                            )
                        }
                    </div>
                </button>
            </div>

            <hr/>
            <div className={`${UI.textDescription} p-2`}>
                Match status: {statusToText(match.status)}
            </div>
        </div>
    )
}