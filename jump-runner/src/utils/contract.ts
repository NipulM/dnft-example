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
  console.log(
    "Requesting to mint NFT for account:",
    account,
    "with score:",
    score
  );

  // Call the updated mint function on the contract with the score
  const tx = await contract.mint(account, score);

  // Wait for the transaction to be mined and confirmed
  await tx.wait();

  console.log("Transaction successful:", tx);
};
