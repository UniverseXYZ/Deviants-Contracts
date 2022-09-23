// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;


import "erc721a/contracts/ERC721A.sol";

contract LobbyLobsters is ERC721A {

    constructor(
    ) ERC721A("Lobby Lobsters", "LBSTR")
    { }

    function mint(uint256 _amount) public {
        _safeMint(msg.sender, _amount);
    }
}