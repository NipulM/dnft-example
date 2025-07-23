// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DynamicNFT is ERC721URIStorage, Ownable {
    event StatsUpdated(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 maxScore,
        uint256 stateId,
        uint256 totalPlayTime
    );

    event NewTokenMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 stateId,
        string updatedUri
    );

    struct PlayerStats {
        uint256 maxScore;
        uint256 stateId;
        uint256 playTime;
    }

    mapping(uint256 => PlayerStats) public dnftStats;
    mapping(uint256 => string) public stateFullUris; // stateId → full IPFS URI

    uint256 public nextTokenId;

    constructor() ERC721("DynamicNFT", "DNFT") Ownable(msg.sender) {
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
        uint256 tokenId = nextTokenId++;
        _mint(to, tokenId);

        dnftStats[tokenId] = PlayerStats({
            maxScore: score,
            stateId: 1,
            playTime: 0
        });

        _setTokenURI(tokenId, stateFullUris[1]); // Initial state URI
        return tokenId;
    }

    function updateStats(
        uint256 tokenId,
        uint256 score,
        uint256 newState,
        uint256 playTime
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        PlayerStats storage stats = dnftStats[tokenId];

        if (score > stats.maxScore) {
            stats.maxScore = score;
        }

        if (stats.stateId != newState) {
            stats.stateId = newState;
            string memory newUri = stateFullUris[newState];
            require(bytes(newUri).length > 0, "Invalid state URI");
            _setTokenURI(tokenId, newUri);
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
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        string memory newUri = stateFullUris[newStateId];
        require(bytes(newUri).length > 0, "Invalid state");

        dnftStats[tokenId].stateId = newStateId;
        _setTokenURI(tokenId, newUri);

        emit NewTokenMinted(
            tokenId,
            msg.sender,
            dnftStats[tokenId].stateId,
            newUri
        );
    }

    function getStats(
        uint256 tokenId
    ) public view returns (PlayerStats memory) {
        return dnftStats[tokenId];
    }
}
