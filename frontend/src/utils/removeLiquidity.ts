import { Contract, providers, utils, BigNumber } from "ethers";
import { EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS } from "../../constants";

/**
 * removeLiquidity: Removes the 'removeLPTokensWei' amount of LP tokens from liquidity and also the calculated
 *                  amount of 'ether' and 'CD' tokens
 */
export const removeLiquidity = async (
  signer: providers.JsonRpcSigner,
  removeLPTokenWei: BigNumber
) => {
  const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, signer);
  const tx = await exchangeContract.removeLiquidity(removeLPTokenWei);
  await tx.wait();
};

/**
 * getTokensAfterRemove: Calculates the amount of 'ETH' and 'CD' tokens to return back to user after he/she
 *                       removes 'removeLPTokenWei' amount of LP tokens from the contract
 */
export const getTokensAfterRemove = async (
  provider: providers.Web3Provider,
  removeLPTokenWei: BigNumber,
  _ethBalance: BigNumber,
  cryptoDevTokenReserve: BigNumber
) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const _totalSupply = await exchangeContract.totalSupply();

    // The amount of Eth that would be sent back to the user after he withdraws the LP token
    // is calculated based on a ratio,
    // Ratio is -> (amount of Eth that would be sent back to the user / Eth reserve) = (LP tokens withdrawn) / (total supply of LP tokens)
    // By some maths we get -> (amount of Eth that would be sent back to the user) = (Eth Reserve * LP tokens withdrawn) / (total supply of LP tokens)
    // Similarly we also maintain a ratio for the `CD` tokens, so here in our case
    // Ratio is -> (amount of CD tokens sent back to the user / CD Token reserve) = (LP tokens withdrawn) / (total supply of LP tokens)
    // Then (amount of CD tokens sent back to the user) = (CD token reserve * LP tokens withdrawn) / (total supply of LP tokens)
    const _removeEther = _ethBalance.mul(removeLPTokenWei).div(_totalSupply);
    const _removeCD = cryptoDevTokenReserve.mul(removeLPTokenWei).div(_totalSupply);

    return {
      _removeEther,
      _removeCD,
    };
  } catch (err) {
    console.error(err);
  }
};
