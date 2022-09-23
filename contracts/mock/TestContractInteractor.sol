// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "../Deviants.sol";

contract TestContractInteractor {
    Deviants public deviantsContract;

    constructor(address payable _deviantsAddress) {
        deviantsContract = Deviants(_deviantsAddress);
    }

    function triggerMint(uint256 amount) public payable {
        deviantsContract.mint{value: msg.value}(amount);
    }
}