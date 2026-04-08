import {handleMatchInfo} from "./HandleMatchInfo.js";
import MatchCard from "./MatchCard.jsx";
import * as UI from "../ui/ui.js"

export default function MatchesDashboard({token, oracle, wager, selectedAddress, isInitializing}) {
    const {matchIds, matchData} = handleMatchInfo(oracle, wager, selectedAddress, isInitializing);

    // console.log(`matchIds length: ${matchIds.length}`)
    // if (matchIds.length !== 0) {
    //     matchIds.forEach(element => {
    //         console.log(`>> matchId Element: ${element} of type: ${typeof(element)}`)
    //         console.log(`>> matchData item: ${JSON.stringify(matchData[element])}`)
    //     })
    // }

    return (
        <div className={`flex flex-col py-4`}>
            <div className={`${UI.textH2Style} `}>
                Matches
            </div>
            <div className={`flex flex-wrap gap-6 p-6 bg-slate-200 rounded-2xl min-h-16`}>
                {
                    matchIds.length === 0 ? (
                        <div className={"text-slate-900"}>
                            No matches found
                        </div>
                    ) : (
                        matchIds.map((matchId) => (
                            <MatchCard
                                key={`matchCard-${matchId}`}
                                match={matchData[matchId]}
                                token={token}
                                wager={wager}
                                selectedAddress={selectedAddress}
                                isInitializing={isInitializing}
                            />
                        ))
                    )
                }

            </div>
        </div>
    )
}