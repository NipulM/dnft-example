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
    mapping(uint256 => string) public stateFullUris; // stateId → full IPFS URI

    uint256 public nextTokenId;

    constructor() ERC1155("") Ownable(msg.sender) {
        // Set the initial state URIs (you can also set these using a separate function)
        stateFullUris[
            1
        ] = "https://purple-improved-hippopotamus-960.mypinata.cloud/ipfs/bafkreidv5pfjjmipp6yeknhr7jvtahihodvt72osrhcf2blt2252vugmnm";
        stateFullUris[
            2
        ] = "https://purple-improved-hippopotamus-960.mypinata.cloud/ipfs/bafkreiefwxuio2r3dsgtgxaqedgrwe4j42bqj4acoofkb65kmrop64ozya";
        stateFullUris[
            3
        ] = "https://purple-improved-hippopotamus-960.mypinata.cloud/ipfs/bafkreigcqyf336pb2b4fsqeynw7tp7blcpygwtmm4ndvbsqusmkzghrdla";
    }

    function setStateFullUri(
        uint256 stateId,
        string memory fullUri
    ) public onlyOwner {
        stateFullUris[stateId] = fullUri;
    }

    function mint(address to, uint256 score) external returns (uint256) {
        uint256 tokenId = nextTokenId;
        nextTokenId++;

        dnftStats[tokenId] = PlayerStats({
            maxScore: score,
            stateId: 1, // start with state 1
            playTime: 0
        });

        _mint(to, tokenId, 1, "");
        return tokenId;
    }

    function updateStats(
        uint256 tokenId,
        uint256 score,
        uint256 newState,
        uint256 playTime
    ) public {
        require(balanceOf(msg.sender, tokenId) > 0, "Not token owner");

        PlayerStats storage stats = dnftStats[tokenId];

        if (score > stats.maxScore) {
            stats.maxScore = score;
        }

        if (stats.stateId != newState) {
            stats.stateId = newState;
            string memory newUri = stateFullUris[newState];
            if (bytes(newUri).length > 0) {
                emit URI(newUri, tokenId);
            }
        }

        stats.playTime += playTime;

        emit StatsUpdated(
            tokenId,
            msg.sender,
            stats.maxScore,
            stats.stateId,
            stats.playTime
        );
    }

    function updateVisualState(uint256 tokenId, uint256 newStateId) external {
        require(balanceOf(msg.sender, tokenId) > 0, "Not token owner");
        string memory newUri = stateFullUris[newStateId];
        require(bytes(newUri).length > 0, "Invalid state");

        dnftStats[tokenId].stateId = newStateId;

        emit URI(newUri, tokenId);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        PlayerStats memory stats = dnftStats[tokenId];
        string memory fullUri = stateFullUris[stats.stateId];
        require(bytes(fullUri).length > 0, "Metadata not set for this state");
        return fullUri;
    }

    function getStats(
        uint256 tokenId
    ) public view returns (PlayerStats memory) {
        return dnftStats[tokenId];
    }
}
