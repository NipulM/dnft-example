const hre = require("hardhat");

async function main() {
  const DynamicNFT = await hre.ethers.getContractFactory("DynamicNFT");
  const dynamicNFT = await DynamicNFT.deploy();

  await dynamicNFT.waitForDeployment();

  const address = await dynamicNFT.getAddress();
  console.log("DynamicNFT deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });