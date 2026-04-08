import {MatchStatus} from "./HandleOracleInfo.js";
import * as UI from "../ui/ui.js"

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

export default function MatchCard({ match, isLoading }) {
    if (isLoading || match === undefined) {
        return (
            <div className={"flex flex-col rounded-2xl bg-white min-h-60 w-full"}>
                <div>
                    Match not loaded yet
                </div>
            </div>
        )
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

            <div className={"flex flex-row gap-4 p-4 h-full"}>
                {/* Home Team*/}
                <div className={"flex flex-col w-1/2 p-4 text-left"}>
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
                {/* Away Team*/}
                <div className={"flex flex-col w-1/2 p-4 text-left"}>
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
            </div>

            <hr/>
            <div className={`${UI.textDescription} p-2`}>
                Match status: {statusToText(match.status)}
            </div>
        </div>
    )
}