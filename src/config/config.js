// Chainlink and Web3 Configuration
export const CHAINLINK_CONFIG = {
  // Ethereum Mainnet
  ETHEREUM: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
    blockExplorerUrls: ['https://etherscan.io'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    chainlinkPriceFeeds: {
      'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      'LINK/USD': '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c'
    }
  },
  
  // Polygon Mainnet
  POLYGON: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    chainlinkPriceFeeds: {
      'ETH/USD': '0xF9680D99D6C9589e2a93a78A04A279e509205945',
      'BTC/USD': '0xc907E116054Ad103354f2D350FD2514433D57F6f',
      'MATIC/USD': '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
    }
  },

  // Sepolia Testnet
  SEPOLIA: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: {
      name: 'Sepolia Ethereum',
      symbol: 'SEP',
      decimals: 18
    },
    chainlinkPriceFeeds: {
      'ETH/USD': '0x694AA1769357215DE4FAC081bf1f309aDC325306',
      'BTC/USD': '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43'
    }
  }
};

export const METAMASK_CONFIG = {
  supportedChains: [
    CHAINLINK_CONFIG.ETHEREUM.chainId,
    CHAINLINK_CONFIG.POLYGON.chainId,
    CHAINLINK_CONFIG.SEPOLIA.chainId
  ],
  defaultChain: CHAINLINK_CONFIG.ETHEREUM.chainId
};

// Price Feed ABI for Chainlink
export const PRICE_FEED_ABI = [
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