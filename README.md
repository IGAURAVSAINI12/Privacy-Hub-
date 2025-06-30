# Chainlink MetaMask Integration

Minimal code to integrate MetaMask with Chainlink price feeds in your browser extension.

## Files Included:

1. **metamask-connector.js** - Handles MetaMask connection and wallet management
2. **chainlink-integration.js** - Interfaces with Chainlink price feeds
3. **main.js** - Initializes the integration and provides global functions
4. **manifest.json** - Extension manifest file
5. **usage-example.html** - Example HTML page showing how to use the integration

## Setup Instructions:

1. Download ethers.js library:
   ```
   curl -o ethers.min.js https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js
   ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select your folder

## Usage:

### Connect to MetaMask:
```javascript
await connectMetaMask();
```

### Get price from specific feed:
```javascript
const price = await getChainlinkPrice('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419');
```

### Get all available prices:
```javascript
const prices = await getAllChainlinkPrices();
```

### Check connection status:
```javascript
const status = getConnectionStatus();
```

## Available Functions:

- `connectMetaMask()` - Connect to MetaMask wallet
- `disconnectMetaMask()` - Disconnect from MetaMask
- `getChainlinkPrice(feedAddress)` - Get price from specific Chainlink feed
- `getAllChainlinkPrices()` - Get all prices for current network
- `getConnectionStatus()` - Get current connection status

## Supported Networks:

- Ethereum Mainnet (ETH/USD, BTC/USD, LINK/USD)
- Sepolia Testnet (ETH/USD, BTC/USD)

## Dependencies:

- Ethers.js (for Web3 interaction)
- MetaMask browser extension