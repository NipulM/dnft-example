import { ethers } from "ethers";
import dynamicNFTAbi from "../utils/abis/DynamicNFT.json";

// Ensure your contract address is set in your .env file
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS!;

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
