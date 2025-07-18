// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DynamicNFT is ERC1155, Ownable {
    event StatsUpdated(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 maxScore,
        uint256 stateId,
        uint256 totalPlayTime
    );
    struct PlayerStats {
        uint256 maxScore;
        uint256 stateId;
        uint256 playTime;
    }

    mapping(uint256 => PlayerStats) public dnftStats;
    uint256 public nextTokenId;

    constructor()
        ERC1155("https://example.com/api/item/{id}.json")
        Ownable(msg.sender)
    {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = nextTokenId;
        nextTokenId++;

        dnftStats[tokenId] = PlayerStats({
            maxScore: 0,
            stateId: 0,
            playTime: 0
        });

        _mint(to, tokenId, 1, "");
        return tokenId;
    }

    function updateStats(
        uint256 tokenId,
        uint256 score,
        uint256 state,
        uint256 playTime
    ) public {
        require(balanceOf(msg.sender, tokenId) > 0, "Not token owner");

        PlayerStats storage stats = dnftStats[tokenId];

        if (score > stats.maxScore) {
            stats.maxScore = score;
        }

        stats.stateId = state;
        stats.playTime += playTime;

        emit StatsUpdated(
            tokenId,
            msg.sender,
            stats.maxScore,
            stats.stateId,
            stats.playTime
        );
    }

    function getStats(
        uint256 tokenId
    ) public view returns (PlayerStats memory) {
        return dnftStats[tokenId];
    }
}
