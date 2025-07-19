import { Alchemy, Network } from "alchemy-sdk";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
/**
 * Finds all token IDs owned by a specific account by querying past events.
 * This is the most efficient way to get token ownership for ERC1155.
 * @param ownerAddress - The wallet address of the owner.
 * @returns A promise that resolves to an array of token IDs (as numbers).
 */
export const getOwnedTokenIds = async (ownerAddress: string) => {
  const config = {
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    network: Network.BASE_SEPOLIA,
  };
  const alchemy = new Alchemy(config);
  try {
    const nfts = await alchemy.nft.getNftsForOwner(ownerAddress, {
      contractAddresses: [CONTRACT_ADDRESS!],
      omitMetadata: true,
    });

    const tokenIds = nfts.ownedNfts.map((nft) => parseInt(nft.tokenId, 10));

    console.log(`Found ${tokenIds.length} token(s) for ${ownerAddress}.`);
    console.log("Token IDs:", tokenIds);

    const metadata = await getAccountNFTs(ownerAddress);
    console.log("Metadata:", JSON.stringify(metadata, null, 2));
    return tokenIds;
  } catch (error) {
    console.error("Failed to fetch NFTs from Alchemy:", error);
    return [];
  }
};

export const getTokenMetadata = async (tokenId: number) => {
  const config = {
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    network: Network.BASE_SEPOLIA,
  };
  const alchemy = new Alchemy(config);

  const metadata = await alchemy.nft.getNftMetadata(
    CONTRACT_ADDRESS!,
    tokenId.toString()
  );
  return metadata;
};

export const getAccountNFTs = async (account: string) => {
  const config = {
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    network: Network.BASE_SEPOLIA,
  };
  const alchemy = new Alchemy(config);
  const nfts = await alchemy.nft.getNftsForOwner(account, {
    contractAddresses: [CONTRACT_ADDRESS!],
  });

  return nfts;
};
