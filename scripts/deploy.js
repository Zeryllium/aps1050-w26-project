// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Token = await ethers.getContractFactory("LightToken");
  const token = await Token.deploy();
  await token.deployed();
  console.log("LightToken address:", token.address);

  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy(
      deployer.address
  );
  await oracle.deployed();
  console.log("Oracle address:", oracle.address);

  const Wager = await ethers.getContractFactory("Wager");
  const wager = await Wager.deploy(
      deployer.address,
      token.address
  );
  await wager.deployed();
  console.log("Wager address:", wager.address);

  // Tell Wager the Oracle's address
  const setUpOracleTx = await wager.setupOracle(oracle.address);
  await setUpOracleTx.wait();
  console.log("Oracle linked to Wager smart contract")

  // Add the minted tokens to Wager
  const tokensToTransfer = ethers.utils.parseUnits("1000000", 18);
  const transferTx = await token.transfer(wager.address, tokensToTransfer);
  await transferTx.wait();
  console.log(`Wager LIT balance: ${
    ethers.utils.formatUnits(await token.balanceOf(wager.address), 18)
  }`);

  // Add ETH funds to Wager
  await deployer.sendTransaction({
    to: wager.address,
    value: ethers.utils.parseEther("1000.0"),
  })
  console.log(`Wager ETH balance: ${
      ethers.utils.formatEther(await ethers.provider.getBalance(wager.address))
  }`);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(token, oracle, wager);
}

function saveFrontendFiles(token, oracle, wager) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({
      Token: token.address,
      Oracle: oracle.address,
      Wager: wager.address
    }, undefined, 2)
  );

  const contractsToDeploy = [
      "LightToken",
      "Oracle",
      "Wager",
  ]

  contractsToDeploy.forEach(contract => {
    const contractArtifact = artifacts.readArtifactSync(contract);

    fs.writeFileSync(
        path.join(contractsDir, `${contract}.json`),
        JSON.stringify(contractArtifact, null, 2)
    );
  });

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
