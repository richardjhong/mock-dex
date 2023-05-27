import { BigNumber, Contract, providers } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../../constants";

/**
 * getAmountOfTokensReceivedFromSwap: Returns the number of ETH/Crypto Dev tokens that can be received when the
 *                                    user swaps '_swapAmountWei' amount of ETH/Crypto Dev tokens
 */
export const getAmountOfTokensReceivedFromSwap = async (
  _swapAmountWei: BigNumber,
  provider: providers.Web3Provider,
  ethSelected: boolean,
  ethBalance: BigNumber,
  reservedCD: BigNumber
) => {
  const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, provider);
  let amountOfTokens: BigNumber;

  // If ethSelected is true then input value is 'ETH' which means input reserve would be 'ethBalance' and output
  // reserve would be 'Crypto Dev' token reserve; if ethSelected is false then the former input reserve and
  // former output reserve are swapped in argument placement
  amountOfTokens = ethSelected
    ? await exchangeContract.getAmountOfTokens(_swapAmountWei, ethBalance, reservedCD)
    : await exchangeContract.getAmountOfTokens(_swapAmountWei, reservedCD, ethBalance);

  return amountOfTokens;
};

/**
 * swapTokens: Swaps 'swapAmountWei' of ETH/Crypto Dev tokens with 'tokenToBeReceivedAfterSwap' amount of
 *             ETH/Crypto Dev tokens
 */
export const swapTokens = async (
  signer: providers.JsonRpcSigner,
  swapAmountWei: BigNumber,
  tokenToBeReceivedAfterSwap: any,
  ethSelected: boolean
) => {
  const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, signer);
  const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);

  let tx: any;

  // If Eth is selected call the `ethToCryptoDevToken` function else
  // call the `cryptoDevTokenToEth` function from the contract
  // As you can see you need to pass the `swapAmount` as a value to the function because
  // it is the ether we are paying to the contract, instead of a value we are passing to the function
  if (ethSelected) {
    tx = await exchangeContract.ethToCryptoToken(tokenToBeReceivedAfterSwap, {
      value: swapAmountWei,
    });
  } else {
    // User has to approve `swapAmountWei` for the contract because `Crypto Dev` token
    // is an ERC20
    tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, swapAmountWei.toString());
    await tx.wait();

    // call cryptoDevTokenToEth function which would take in `swapAmountWei` of `Crypto Dev` tokens and would
    // send back `tokenToBeReceivedAfterSwap` amount of `Eth` to the user
    tx = await exchangeContract.cryptoDevTokenToEth(swapAmountWei, tokenToBeReceivedAfterSwap);
  }
  await tx.wait();
};
