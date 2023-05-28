"use client";

import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useState, useEffect, useRef } from "react";
import Web3Modal from "web3modal";
import { addLiquidity, calculateCD } from "@/utils/addLiquidity";
import {
  getCDTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfCDTokens,
} from "@/utils/getAmounts";
import { getTokensAfterRemove, removeLiquidity } from "@/utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "@/utils/swap";

const Home = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [liquidityTab, setLiquidityTab] = useState<boolean>(true);
  const zero = BigNumber.from(0);
  const [ethBalance, setEthBalance] = useState<BigNumber>(zero);
  const [reservedCD, setReservedCD] = useState<BigNumber>(zero);
  const [etherBalanceContract, setEtherBalanceContract] = useState<BigNumber>(zero);
  const [cdBalance, setCDBalance] = useState<BigNumber>(zero);
  const [lpBalance, setLPBalance] = useState<BigNumber>(zero);
  const [addEther, setAddEther] = useState<BigNumber | string>(zero);
  const [addCDTokens, setAddCDTokens] = useState<BigNumber>(zero);
  const [removeEther, setRemoveEther] = useState<BigNumber>(zero);
  const [removeCD, setRemoveCD] = useState<BigNumber>(zero);
  const [removeLPTokens, setRemoveLPTokens] = useState<string>("0");
  const [swapAmount, setSwapAmount] = useState<string>("");
  const [tokenToBeReceivedAfterSwap, setTokenToBeReceivedAfterSwap] = useState<BigNumber | string>(
    zero
  );
  const [ethSelected, setEthSelected] = useState<boolean>(true);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const web3ModalRef = useRef<Web3Modal | undefined>(undefined);

  /**
   * getAmounts: Call various functions to retrieve amounts for ethBalance
   */
  const getAmounts = async () => {
    try {
      const provider = (await getProviderOrSigner()) as providers.Web3Provider;
      const signer = (await getProviderOrSigner(true)) as providers.JsonRpcSigner;
      const address = await signer.getAddress();

      const _ethBalance = await getEtherBalance(provider, address);
      const _cdBalance = await getCDTokensBalance(provider, address);
      const _lpBalance = await getLPTokensBalance(provider, address);
      const _reservedCD = await getReserveOfCDTokens(provider);
      const _ethBalanceContract = await getEtherBalance(provider, null, true);

      setEthBalance(BigNumber.from(_ethBalance));
      setCDBalance(_cdBalance);
      setLPBalance(_lpBalance);
      setReservedCD(_reservedCD);
      setReservedCD(_reservedCD);
      setEtherBalanceContract(BigNumber.from(_ethBalanceContract));
    } catch (err) {
      console.error(err);
    }
  };

  /***** SWAP FUNCTIONS *****/

  /**
   * _swapTokens: Swaps 'swapAmountWei' of ETH/Crypto Dev tokens with 'tokenToBeReceivedAfterSwap' amount of
   *              ETH/Crypto Dev tokens
   */
  const _swapTokens = async () => {
    try {
      const swapAmountWei = utils.parseEther(swapAmount);

      if (!swapAmountWei.eq(zero)) {
        const signer = (await getProviderOrSigner(true)) as providers.JsonRpcSigner;
        setLoading(true);

        await swapTokens(signer, swapAmountWei, tokenToBeReceivedAfterSwap, ethSelected);
        setLoading(false);

        await getAmounts();
        setSwapAmount("");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setSwapAmount("");
    }
  };

  /**
   * _getAmountOfTokensReceivedFromSwap: Returns the number of ETH/Crypto Dev tokens that can be received when
   *                                     the user swaps '_swpaAmountWei' amount of ETH/Crypto Dev tokens
   */
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount: any) => {
    try {
      const _swapAmountWei = utils.parseEther(_swapAmount.toString());

      if (!_swapAmountWei.eq(zero)) {
        const provider = (await getProviderOrSigner()) as providers.Web3Provider;
        const _ethBalance = await getEtherBalance(provider, null, true);
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWei,
          provider,
          ethSelected,
          BigNumber.from(_ethBalance),
          reservedCD
        );
        setTokenToBeReceivedAfterSwap(amountOfTokens);
      } else {
        setTokenToBeReceivedAfterSwap(zero);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /*** END ***/

  /***** ADD LIQUIDITY FUNCTIONS *****/

  /**
   * _addLiquidity: Helps add liquidity to the exchange
   *
   * If the user is adding initial liquidity, user decides the ether and CD tokens he/she wants to add to the exchange.
   * If he/she is adding the liquidity after the initial liquidity has already been added, then the initial exchange
   * ratio dictates the crypto devs tokens the user can add given the eth he/she wants to add
   */
  const _addLiquidity = async () => {
    try {
      const addEtherWei = utils.parseEther(addEther.toString());

      if (!addCDTokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = (await getProviderOrSigner(true)) as providers.JsonRpcSigner;
        setLoading(true);

        await addLiquidity(signer, addCDTokens, addEtherWei);
        setLoading(false);
        setAddCDTokens(zero);
        await getAmounts();
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setAddCDTokens(zero);
    }
  };

  /**** END ****/

  /**** REMOVE LIQUIDITY FUNCTIONS ****/

  /**
   * _removeLiquidity: Removes the 'removeLPTokensWei' amount of LP tokens from the liquidity and calculated
   *                   amount of 'ether' and 'CD' tokens
   */
  const _removeLiquidity = async () => {
    try {
      const signer = (await getProviderOrSigner(true)) as providers.JsonRpcSigner;
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);

      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);

      await getAmounts();
      setRemoveCD(zero);
      setRemoveEther(zero);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRemoveCD(zero);
      setRemoveEther(zero);
    }
  };

  /**
   * _getTokensAfterRemove: Calculates the amount of 'Ether' and 'CD' tokens that would be returned back to user
   *                        after removing 'removeLPTokenWei' amount of LP tokens from the contract
   */
  const _getTokensAfterRemove = async (_removeLPTokens: string) => {
    try {
      const provider = (await getProviderOrSigner()) as providers.Web3Provider;
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      const _ethBalance = await getEtherBalance(provider, null, true);
      const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
      const result = await getTokensAfterRemove(
        provider,
        removeLPTokenWei,
        BigNumber.from(_ethBalance),
        cryptoDevTokenReserve
      );

      if (result) {
        const { _removeEther, _removeCD } = result;
        setRemoveEther(_removeEther);
        setRemoveCD(_removeCD);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /**** END ****/

  /**
   * connectWallet: Connects the MetaMask wallet
   */
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or
   * without the signing capabilities of Metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading
   * transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction
   * needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being
   * sent. Metamask exposes a Signer API to allow your website to request
   * signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false
   * otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    if (!web3ModalRef.current) {
      throw new Error("web3ModalRef.current is undefined");
    }

    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Sepolia network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 11155111) {
      window.alert("Change the network to Sepolia");
      throw new Error("Change network to Sepolia");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "sepolia",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);

  /**
   * renderButton: Returns a button based on the state of the dApp
   */
  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button
          onClick={connectWallet}
          className="rounded bg-blue-700 border-none text-white text-base p-5 w-52 cursor-pointer mb-2 md:w-full md:flex md:flex-col md:justify-center md:items-center"
        >
          Connect Your Wallet
        </button>
      );
    }

    if (loading) {
      return (
        <button className="rounded bg-blue-700 border-none text-white text-base p-5 w-52 cursor-pointer mb-2 md:w-full md:flex md:flex-col md:justify-center md:items-center">
          Loading...
        </button>
      );
    }

    if (liquidityTab) {
      return (
        <div>
          <div className="text-lg">
            You have:
            <br />
            {utils.formatEther(cdBalance)} Crypto Dev Tokens
            <br />
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} Crypto Dev LP Tokens
          </div>
          <div>
            {/* If reserved CD is zero, render the state for liquidity zero where we ask the user
            how much initial liquidity he wants to add else just render the state where liquidity is not zero and
            we calculate based on the `Eth` amount specified by the user how much `CD` tokens can be added */}
            {reservedCD.eq(zero) ? (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className="w-200 h-full p-1 m-2 shadow-md rounded-2xl"
                />
                <input
                  type="number"
                  placeholder="Amount of CryptoDev tokens"
                  onChange={(e) =>
                    setAddCDTokens(BigNumber.from(utils.parseEther(e.target.value || "0")))
                  }
                  className="w-200 h-full p-1 m-2 shadow-md rounded-2xl"
                />
                <button
                  className="border-4 bg-blue-500 border-none text-white text-base px-4 py-2 w-24 cursor-pointer m-2"
                  onClick={_addLiquidity}
                >
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    const _addCDTokens = await calculateCD(
                      e.target.value,
                      etherBalanceContract,
                      reservedCD
                    );
                    setAddCDTokens(_addCDTokens);
                  }}
                  className="w-200 h-full p-1 m-2 shadow-md rounded-2xl"
                />
                <div className="w-200 h-full p-1 m-2 border border-lightslategray shadow-md rounded-2xl">
                  {`You will need ${utils.formatEther(addCDTokens)} Crypto Dev
                  Tokens`}
                </div>
                <button
                  className="border-4 bg-blue-500 border-none text-white text-base px-4 py-2 w-24 cursor-pointer m-2"
                  onClick={_addLiquidity}
                >
                  Add
                </button>
              </div>
            )}
            <div>
              <input
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
                className="w-200 h-full p-1 m-2 shadow-md rounded-2xl"
              />
              <div className="w-200 h-full p-1 m-2 border border-lightslategray shadow-md rounded-2xl">
                {`You will get ${utils.formatEther(removeCD)} Crypto
              Dev Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button
                className="border-4 bg-blue-500 border-none text-white text-base px-4 py-2 w-24 cursor-pointer m-2"
                onClick={_removeLiquidity}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
            className="w-200 h-full p-1 m-2 shadow-md rounded-2xl"
            value={swapAmount}
          />
          <select
            className="border-4 text-base px-4 py-2 w-44 cursor-pointer m-2"
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              // Initialize the values back to zero
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option value="eth">Ethereum</option>
            <option value="cryptoDevToken">Crypto Dev Token</option>
          </select>
          <br />
          <div className="w-200 h-full p-1 m-2 border border-lightslategray shadow-md rounded-2xl">
            {ethSelected
              ? `You will get ${utils.formatEther(tokenToBeReceivedAfterSwap)} Crypto Dev Tokens`
              : `You will get ${utils.formatEther(tokenToBeReceivedAfterSwap)} Eth`}
          </div>
          <button
            className="border-4 bg-blue-500 border-none text-white text-base px-4 py-2 w-24 cursor-pointer m-2"
            onClick={_swapTokens}
          >
            Swap
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <link
          rel="icon"
          href="/favicon.ico"
        />
      </Head>
      <div className="min-h-screen flex flex-row justify-center items-center font-mono md:w-full md:flex md:flex-col md:justify-center md:items-center">
        <div className="mx-8">
          <h1 className="text-4xl mb-2">Welcome to Crypto Devs Exchange!</h1>
          <div className="text-lg">Exchange Ethereum &#60;&#62; Crypto Dev Tokens</div>
          <div>
            <button
              className="border-4 bg-blue-500 border-none text-white text-base px-4 py-2 w-28 cursor-pointer m-2"
              onClick={() => {
                setLiquidityTab(true);
              }}
            >
              Liquidity
            </button>
            <button
              className="border-4 bg-blue-500 border-none text-white text-base px-4 py-2 w-24 cursor-pointer m-2"
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img
            className="w-70 h-50 ml-20"
            src="./cryptodev.svg"
          />
        </div>
      </div>
      <footer className="flex justify-center items-center py-8 border-t-2 border-gray-300">
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
};

export default Home;
