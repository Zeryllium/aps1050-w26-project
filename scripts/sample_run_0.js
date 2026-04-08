const addresses = require("./contract-address.json");

async function main() {
    console.log("WARNING: This file assumes that you have run deploy.js successfully")
    console.log("Executing example process.");
    console.log("========================================================");
    console.log("This file will first ask the Oracle to add 4 sports matches to the blockchain.");
    console.log("Afterwards, you can start betting on matches through the frontend url: http://localhost:5173/");
    console.log("Match IDs are fetched by the frontend every 10 seconds while Match data, for those IDs, are fetched every other second.");
    console.log("Execute sample_run_1.js after placing your bets (you do not need to bet on all matches)");
    console.log("\n");

    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.attach(addresses.Oracle);

    const matches = {
        1: {
            id: 1,
            homeTeam: {
                id: 1,
                name: "Toronto Maple Leafs"
            },
            awayTeam: {
                id: 2,
                name: "Montreal Canadiens"
            },
            epochTime: 1200000000,
            status: 0,
            winner: 0
        },
        2: {
            id: 2,
            homeTeam: {
                id: 3,
                name: "Edmonton Oilers"
            },
            awayTeam: {
                id: 4,
                name: "Calgary Flames"
            },
            epochTime: 1200050000,
            status: 0,
            winner: 0
        },
        3: {
            id: 3,
            homeTeam: {
                id: 5,
                name: "Vancouver Canucks"
            },
            awayTeam: {
                id: 6,
                name: "Ottawa Senators"
            },
            epochTime: 1200100000,
            status: 0,
            winner: 0
        },
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
            status: 0,
            winner: 0
        }
    };

    console.log("Uploading the following matches to the Oracle");

    for (const [matchId, match] of Object.entries(matches)) {
        console.log(`\tAdding match ${matchId} with content: ${JSON.stringify(match)} \n`);
        await oracle.addMatch(match);
    }

    console.log("\n");
    console.log("Done adding matches. Wait for them to show up in the frontend.")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
