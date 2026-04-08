const addresses = require("./contract-address.json");

async function main() {
    console.log("WARNING: This file assumes that you have run sample_run_2.js successfully")
    console.log("Executing example process.");
    console.log("========================================================");
    console.log("This file will first ask the Oracle to update sports matches 4 in the blockchain.");
    console.log("Notice that these matches will no longer be able to be bet on through the frontend url: http://localhost:5173/.");
    console.log("However, you will still see all matches that you have bet on, even on a page reload (matches that cannot be bet on anymore and that you have not placed a bet on will not show up).")
    console.log("You can now also claim winnings from matches that you have won bets on.")
    console.log("Once you have claimed winnings on a match, that match will no longer be fetched on the next sync.")
    console.log("This concludes the sample run");
    console.log("\n");

    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.attach(addresses.Oracle);

    const updatedMatches = {
        // Matches 1, 2, and 3 have concluded and will not change anymore
        4: {
            id: 4,
            homeTeam: {
                id: 2,
                name: "Montreal Canadiens"
            },
            awayTeam: {
                id: 3,
                name: "Edmonton Oilers"
            },
            epochTime: 1200150000,
            status: 2,
            winner: 2
        }
    };

    console.log("Updating the following matches through the Oracle");

    for (const [matchId, match] of Object.entries(updatedMatches)) {
        console.log(`\tAdding match ${matchId} with content: ${JSON.stringify(match)} \n`);
        await oracle.updateMatch(matchId, match);
    }

    console.log("\n");
    console.log("Done updating matches. They should be updated in the frontend momentarily.")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
