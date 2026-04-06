Start up process:

```shell
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3
npm start
```

Modifying and deploying the smart contract
```shell
# End running processes on Terminals 1 and 3 `Ctrl+C`

# Terminal 2
npx hardhat clean
npx hardhat compile

# Rerun the Start up process
```