import { BigNumber, Contract, providers, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../../constants";

/**
 * addLiquidity: Helps add liquidity to the exchange.
 *
 * If the user is adding initial liquidity, user decides the ether and CD tokens he/she wants to add to the exchange.
 * If he/she is adding the liquidity after the initial liquidity has already been added, then amount of Crypto Dev
 * tokens to add is calculated, given the ETH added by keeping the ratios constant
 */
export const addLiquidity = async (
  signer: providers.JsonRpcSigner,
  addCDAmountWei: BigNumber,
  addEtherAmountWei: BigNumber
) => {
  try {
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
    const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, signer);

    // CD Tokens are an ERC20, so user needs to give contract allowance to take the rquired number CD tokens
    // out of his/her contract
    let tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, addCDAmountWei.toString());
    await tx.wait();

    // After the contract has approval, add the ether and CD tokens in the liquidity
    tx = await exchangeContract.addLiquidity(addCDAmountWei, {
      value: addEtherAmountWei,
    });
    await tx.wait();
  } catch (err) {
    console.error(err);
  }
};

/**
 * calculateCD: Calculates the CD tokens that need to be added to the liquidity given '_addEtherAmountWei' amount
 *              of ether
 */
export const calculateCD = async (
  _addEther: string = "0",
  etherBalanceContract: BigNumber,
  cdTokenReserve: BigNumber
) => {
  // convert string to BigNumber for calculations
  const _addEtherAmountWei = utils.parseEther(_addEther);

  // Ratio needs to be maintained when adding liquidity
  // User needs to be informed that given a specific amount of ether how many 'CD' tokens the user can add so that
  // the price impact is not large
  // The ratio to follow is (amount of Crypto Dev tokens to be added) / (Crypto Dev tokens balance) =
  // (ETH that would be added) / (ETH reserve in the contract)
  // The math equivalent is (amount of Crypto Dev tokens to be added) =
  // (ETH that would be added * Crypto Dev tokens balance) / (ETH reserve in the contract)

  const cryptoDevTokenAmount = _addEtherAmountWei.mul(cdTokenReserve).div(etherBalanceContract);
  return cryptoDevTokenAmount;
};
