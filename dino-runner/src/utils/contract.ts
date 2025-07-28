import { ethers } from "ethers";
import dynamicNFTAbi from "./abis/DynamicNFT.json";

// Ensure your contract address is set in your .env file
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS!;

// Type definitions
interface TokenStats {
  maxScore: string;
  stateId: string;
  playTime: string;
}

interface TokenInfo {
  tokenId: string;
  tokenURI: string;
  stats: TokenStats;
  owner: string;
}

interface NFTData {
  tokenId: string;
  name: string;
  description: string;
  image: {
    thumbnailUrl: string;
  };
  balance: string;
  stats: TokenStats;
}

/**
 * Creates and returns a contract instance connected to the user's signer.
 */
export const getContract = async () => {
  if (!(window as any).ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install it to use this app."
    );
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, dynamicNFTAbi.abi, signer);
};

/**
 * Creates and returns a contract instance for read-only operations.
 */
export const getContractReadOnly = () => {
  if (!(window as any).ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install it to use this app."
    );
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, dynamicNFTAbi.abi, provider);
};

/**
 * Calls the smart contract's mint function to create a new NFT with the player's score.
 * @param account - The address of the player who will own the NFT.
 * @param score - The player's final score from the game.
 */
export const mint = async (account: string, score: number) => {
  const contract = await getContract();
  console.log("Requesting to mint NFT for account:", account);

  // Call the updated mint function on the contract with the score
  console.log("Minting NFT for account:", account, "with score:", score);
  const tx = await contract.mint(account, score);

  // Wait for the transaction to be mined and confirmed
  await tx.wait();

  console.log("Transaction successful:", tx);
};

const BASE_SEPOLIA_CHAIN_ID_HEX = "0x14A34"; // 84532 in hex

/**
 * Prompts the user to switch to the Base Sepolia Testnet in MetaMask.
 * If the network is not already added, it will prompt the user to add it.
 */
export const switchToBaseSepolia = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    // Request to switch to the Base Sepolia network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
    });
    console.log("Switched to Base Sepolia Testnet successfully.");
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      console.log("Base Sepolia Testnet not found. Attempting to add it...");
      try {
        // Request to add the Base Sepolia network
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
              chainName: "Base Sepolia Testnet",
              nativeCurrency: {
                name: "Sepolia ETH",
                symbol: "ETH", // The symbol for the native currency
                decimals: 18,
              },
              rpcUrls: ["https://sepolia.base.org"], // Official public RPC
              blockExplorerUrls: ["https://sepolia.basescan.org"],
            },
          ],
        });
      } catch (addError) {
        console.error("Failed to add Base Sepolia Testnet:", addError);
        throw new Error(
          "Failed to add the Base Sepolia network to your wallet."
        );
      }
    } else {
      console.error("Failed to switch network:", switchError);
      throw new Error(
        "Failed to switch network. Please do it manually in MetaMask."
      );
    }
  }
};

export const updateVisualState = async (
  tokenId: number,
  newStateId: number,
  onSuccess: () => void
) => {
  const contract = await getContract();

  console.log(
    "Updating visual state for tokenId:",
    tokenId,
    "to stateId:",
    newStateId
  );
  try {
    const tx = await contract.updateVisualState(tokenId, newStateId);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("Transaction successful:", tx);

    onSuccess();
  } catch (error) {
    console.error("Failed to update visual state:", error);
  }
};

// export const updateStats = async (
//   tokenId: number,
//   score: number,
//   newStateId: number,
//   playTime: number
// ) => {
//   const contract = await getContract();
//   const tx = await contract.updateStats(tokenId, score, newStateId, playTime);

//   await tx.wait();
//   console.log("Transaction successful:", tx.hash);
// };

export const getStats = async (tokenId: number) => {
  const contract = await getContract();
  const stats = await contract.getStats(tokenId);
  return stats;
};

/**
 * Get all token IDs owned by a specific address from the smart contract
 * @param ownerAddress - The wallet address of the owner
 * @returns A promise that resolves to an array of token IDs (as numbers)
 */
export const getOwnedTokenIds = async (ownerAddress: string) => {
  try {
    const contract = getContractReadOnly();
    const tokenIds = await contract.getTokensOfOwner(ownerAddress);

    // Convert BigNumber array to number array
    const tokenIdsAsNumbers = tokenIds.map((id: any) => id.toString());

    console.log(
      `Found ${tokenIdsAsNumbers.length} token(s) for ${ownerAddress}.`
    );
    console.log("Token IDs:", tokenIdsAsNumbers);

    return tokenIdsAsNumbers;
  } catch (error) {
    console.error("Failed to fetch token IDs from contract:", error);
    return [];
  }
};

/**
 * Get complete token information for a specific token ID from the smart contract
 * @param tokenId - The token ID to get information for
 * @returns A promise that resolves to token information
 */
export const getTokenInfo = async (tokenId: number) => {
  try {
    const contract = getContractReadOnly();
    const tokenInfo = await contract.getTokenInfo(tokenId);

    return {
      tokenId: tokenInfo.tokenId.toString(),
      tokenURI: tokenInfo.tokenURI,
      stats: {
        maxScore: tokenInfo.stats.maxScore.toString(),
        stateId: tokenInfo.stats.stateId.toString(),
        playTime: tokenInfo.stats.playTime.toString(),
      },
      owner: tokenInfo.owner,
    };
  } catch (error) {
    console.error("Failed to fetch token info from contract:", error);
    throw error;
  }
};

/**
 * Get all token information for tokens owned by a specific address from the smart contract
 * @param ownerAddress - The wallet address of the owner
 * @returns A promise that resolves to an array of token information
 */
export const getTokensInfoOfOwner = async (ownerAddress: string) => {
  try {
    const contract = getContractReadOnly();
    const tokensInfo = await contract.getTokensInfoOfOwner(ownerAddress);

    // Convert BigNumber values to strings for easier handling
    const formattedTokensInfo: TokenInfo[] = tokensInfo.map(
      (tokenInfo: any) => ({
        tokenId: tokenInfo.tokenId.toString(),
        tokenURI: tokenInfo.tokenURI,
        stats: {
          maxScore: tokenInfo.stats.maxScore.toString(),
          stateId: tokenInfo.stats.stateId.toString(),
          playTime: tokenInfo.stats.playTime.toString(),
        },
        owner: tokenInfo.owner,
      })
    );

    console.log(
      `Found ${formattedTokensInfo.length} token(s) with info for ${ownerAddress}.`
    );

    return formattedTokensInfo;
  } catch (error) {
    console.error("Failed to fetch tokens info from contract:", error);
    return [];
  }
};

/**
 * Fetch metadata from IPFS URI and format it for display
 * @param tokenInfo - Token information from the contract
 * @returns Formatted NFT data for display
 */
export const fetchTokenMetadata = async (
  tokenInfo: TokenInfo
): Promise<NFTData> => {
  try {
    // Fetch metadata from IPFS URI
    const response = await fetch(tokenInfo.tokenURI);
    const metadata = await response.json();

    return {
      tokenId: tokenInfo.tokenId,
      name: metadata.name || `DNFT #${tokenInfo.tokenId}`,
      description: metadata.description || "Dynamic NFT from Dino Runner",
      image: {
        thumbnailUrl: metadata.image || tokenInfo.tokenURI,
      },
      balance: "1", // ERC721 tokens always have balance 1
      stats: tokenInfo.stats,
    };
  } catch (error) {
    console.error(
      "Failed to fetch metadata for token:",
      tokenInfo.tokenId,
      error
    );

    // Return fallback data if metadata fetch fails
    return {
      tokenId: tokenInfo.tokenId,
      name: `DNFT #${tokenInfo.tokenId}`,
      description: "Dynamic NFT from Dino Runner",
      image: {
        thumbnailUrl: tokenInfo.tokenURI,
      },
      balance: "1",
      stats: tokenInfo.stats,
    };
  }
};

/**
 * Get all NFTs owned by an address with metadata from the smart contract
 * @param ownerAddress - The wallet address of the owner
 * @returns A promise that resolves to an array of NFT data with metadata
 */
export const getAccountNFTs = async (ownerAddress: string) => {
  try {
    const tokensInfo = await getTokensInfoOfOwner(ownerAddress);
    const nftsWithMetadata = await Promise.all(
      tokensInfo.map((tokenInfo) => fetchTokenMetadata(tokenInfo))
    );

    return {
      ownedNfts: nftsWithMetadata,
    };
  } catch (error) {
    console.error("Failed to fetch account NFTs from contract:", error);
    return {
      ownedNfts: [],
    };
  }
};
