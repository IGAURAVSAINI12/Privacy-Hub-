/**
 * Chainlink Price Feed Integration
 * Minimal implementation for reading Chainlink price feeds
 */

// Chainlink Price Feed ABI (minimal)
const PRICE_FEED_ABI = [
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      {"internalType": "uint80", "name": "roundId", "type": "uint80"},
      {"internalType": "int256", "name": "answer", "type": "int256"},
      {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
      {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
      {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Common Chainlink Price Feed addresses
const CHAINLINK_FEEDS = {
  // Ethereum Mainnet
  '0x1': {
    'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
    'LINK/USD': '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c'
  },
  // Sepolia Testnet
  '0xaa36a7': {
    'ETH/USD': '0x694AA1769357215DE4FAC081bf1f309aDC325306',
    'BTC/USD': '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43'
  }
};

class ChainlinkIntegration {
  constructor(metaMaskConnector) {
    this.connector = metaMaskConnector;
  }

  // Get price from Chainlink feed
  async getPrice(feedAddress) {
    if (!this.connector.isConnected) {
      throw new Error('MetaMask not connected');
    }

    try {
      // Create ethers provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Create contract instance
      const contract = new ethers.Contract(feedAddress, PRICE_FEED_ABI, provider);
      
      // Get latest price data
      const [description, decimals, latestRoundData] = await Promise.all([
        contract.description(),
        contract.decimals(),
        contract.latestRoundData()
      ]);

      const [roundId, answer, startedAt, updatedAt, answeredInRound] = latestRoundData;
      
      // Calculate price with proper decimals
      const price = parseFloat(answer.toString()) / Math.pow(10, decimals);
      
      return {
        description,
        price,
        decimals,
        updatedAt: new Date(updatedAt.toNumber() * 1000),
        roundId: roundId.toString()
      };
    } catch (error) {
      throw new Error(`Failed to get price: ${error.message}`);
    }
  }

  // Get available feeds for current network
  getAvailableFeeds() {
    const chainId = this.connector.chainId;
    return CHAINLINK_FEEDS[chainId] || {};
  }

  // Get all prices for current network
  async getAllPrices() {
    const feeds = this.getAvailableFeeds();
    const prices = {};

    for (const [pair, address] of Object.entries(feeds)) {
      try {
        prices[pair] = await this.getPrice(address);
      } catch (error) {
        console.error(`Failed to get price for ${pair}:`, error);
        prices[pair] = { error: error.message };
      }
    }

    return prices;
  }
}

// Export for use in other files
window.ChainlinkIntegration = ChainlinkIntegration;