import { ethers } from 'ethers';
import { PRICE_FEED_ABI } from '../config/config.js';

/**
 * Verify if a contract address is a valid Chainlink Price Feed
 * @param {string} contractAddress - The contract address to verify
 * @param {object} provider - Ethereum provider instance
 * @returns {Promise<object>} Verification result with contract details
 */
export async function verifyChainlinkContract(contractAddress, provider) {
  try {
    // Validate address format
    if (!ethers.isAddress(contractAddress)) {
      throw new Error('Invalid contract address format');
    }

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, PRICE_FEED_ABI, provider);

    // Verify contract by calling standard Chainlink methods
    const [description, decimals, latestRoundData] = await Promise.all([
      contract.description(),
      contract.decimals(),
      contract.latestRoundData()
    ]);

    // Validate the response structure
    if (!description || decimals === undefined || !latestRoundData) {
      throw new Error('Contract does not implement Chainlink Price Feed interface');
    }

    const [roundId, answer, startedAt, updatedAt, answeredInRound] = latestRoundData;

    // Calculate price with proper decimals
    const price = Number(answer) / Math.pow(10, Number(decimals));
    
    // Check if data is recent (within last 24 hours)
    const currentTime = Math.floor(Date.now() / 1000);
    const dataAge = currentTime - Number(updatedAt);
    const isStale = dataAge > 86400; // 24 hours

    return {
      isValid: true,
      contractAddress,
      description: description,
      decimals: Number(decimals),
      latestPrice: price,
      roundId: roundId.toString(),
      updatedAt: new Date(Number(updatedAt) * 1000),
      dataAge: dataAge,
      isStale: isStale,
      rawAnswer: answer.toString()
    };

  } catch (error) {
    console.error('Contract verification failed:', error);
    
    return {
      isValid: false,
      contractAddress,
      error: error.message,
      details: 'This contract does not appear to be a valid Chainlink Price Feed'
    };
  }
}

/**
 * Get historical price data from Chainlink contract
 * @param {string} contractAddress - The contract address
 * @param {object} provider - Ethereum provider instance
 * @param {number} rounds - Number of historical rounds to fetch
 * @returns {Promise<Array>} Array of historical price data
 */
export async function getHistoricalData(contractAddress, provider, rounds = 10) {
  try {
    const contract = new ethers.Contract(contractAddress, PRICE_FEED_ABI, provider);
    const latestRoundData = await contract.latestRoundData();
    const latestRoundId = latestRoundData[0];
    
    const historicalData = [];
    const decimals = await contract.decimals();

    for (let i = 0; i < rounds; i++) {
      try {
        const roundId = latestRoundId - BigInt(i);
        const roundData = await contract.getRoundData(roundId);
        
        if (roundData[1] > 0) { // Valid answer
          const price = Number(roundData[1]) / Math.pow(10, Number(decimals));
          historicalData.push({
            roundId: roundId.toString(),
            price: price,
            timestamp: new Date(Number(roundData[3]) * 1000),
            updatedAt: Number(roundData[3])
          });
        }
      } catch (error) {
        // Skip invalid rounds
        continue;
      }
    }

    return historicalData.reverse(); // Return chronological order
  } catch (error) {
    console.error('Failed to fetch historical data:', error);
    return [];
  }
}

/**
 * Validate MetaMask connection and network
 * @param {string} expectedChainId - Expected chain ID
 * @returns {Promise<object>} Connection validation result
 */
export async function validateMetaMaskConnection(expectedChainId) {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const accounts = await provider.listAccounts();

    if (accounts.length === 0) {
      throw new Error('No accounts connected to MetaMask');
    }

    const currentChainId = '0x' + network.chainId.toString(16);
    const isCorrectNetwork = currentChainId === expectedChainId;

    return {
      isValid: true,
      currentChainId,
      expectedChainId,
      isCorrectNetwork,
      account: accounts[0].address,
      networkName: network.name
    };

  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Switch MetaMask to specified network
 * @param {object} networkConfig - Network configuration object
 * @returns {Promise<boolean>} Success status
 */
export async function switchMetaMaskNetwork(networkConfig) {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkConfig.chainId }],
    });
    return true;
  } catch (switchError) {
    // Network not added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add network:', addError);
        return false;
      }
    }
    console.error('Failed to switch network:', switchError);
    return false;
  }
}