/**
 * Main integration file
 * Initialize MetaMask and Chainlink integration
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Create MetaMask connector instance
  const metaMask = new MetaMaskConnector();
  
  // Create Chainlink integration instance
  const chainlink = new ChainlinkIntegration(metaMask);

  // Example usage functions
  window.connectMetaMask = async () => {
    try {
      const result = await metaMask.connect();
      console.log('Connected to MetaMask:', result);
      return result;
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      throw error;
    }
  };

  window.disconnectMetaMask = () => {
    metaMask.disconnect();
    console.log('Disconnected from MetaMask');
  };

  window.getChainlinkPrice = async (feedAddress) => {
    try {
      const price = await chainlink.getPrice(feedAddress);
      console.log('Price data:', price);
      return price;
    } catch (error) {
      console.error('Failed to get price:', error);
      throw error;
    }
  };

  window.getAllChainlinkPrices = async () => {
    try {
      const prices = await chainlink.getAllPrices();
      console.log('All prices:', prices);
      return prices;
    } catch (error) {
      console.error('Failed to get prices:', error);
      throw error;
    }
  };

  window.getConnectionStatus = () => {
    return metaMask.getConnectionStatus();
  };

  // Auto-connect if previously connected
  if (metaMask.isMetaMaskInstalled()) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await metaMask.connect();
        console.log('Auto-connected to MetaMask');
      }
    } catch (error) {
      console.log('Auto-connect failed:', error);
    }
  }
});