// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LightToken is ERC20 {
    // The fixed amount of tokens stored in an unsigned integer type variable.
    uint256 public fixedTotalSupply = 1000000;

    // An address type variable is used to store ethereum accounts.
    address public owner;

    /***
     * Contract initialization.
     */
    constructor() ERC20("Light", "LIT"){
        // The totalSupply is assigned to the transaction sender, which is the
        // account that is deploying the contract.
        owner = msg.sender;
        _mint(owner, fixedTotalSupply * 10 ** decimals());
    }
}
