const hre = require("hardhat");

async function main() {
  const DynamicNFT = await hre.ethers.getContractFactory("DynamicNFT");
  const dynamicNFT = await DynamicNFT.deploy();
  await dynamicNFT.waitForDeployment();

  console.log("DynamicNFT deployed to:", await dynamicNFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});