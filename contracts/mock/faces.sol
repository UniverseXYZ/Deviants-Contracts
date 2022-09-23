// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;


import "erc721a/contracts/ERC721A.sol";

contract Faces is ERC721A {

    constructor(
    ) ERC721A("Faces", "FACE")
    { }

    function mint(uint256 _amount) public {
        _safeMint(msg.sender, _amount);
    }
}