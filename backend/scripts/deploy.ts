import { ethers } from "hardhat";
import "dotenv/config";
import { CRYPTO_DEV_TOKEN_CONTRACT_ADDRESS } from "../constants";

const main = async () => {
  const cryptoDevTokenAddress = CRYPTO_DEV_TOKEN_CONTRACT_ADDRESS;

  const exchangeContract = await ethers.getContractFactory("Exchange");

  const deployedExchangeContract = await exchangeContract.deploy(cryptoDevTokenAddress);
  await deployedExchangeContract.deployed();

  console.log("Exchange Contract Address: ", deployedExchangeContract.address);
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
