/**
 * MetaMask Connection Handler
 * Minimal implementation for connecting to MetaMask and interacting with Chainlink
 */

class MetaMaskConnector {
  constructor() {
    this.account = null;
    this.provider = null;
    this.chainId = null;
    this.isConnected = false;
  }

  // Check if MetaMask is installed
  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
  }

  // Connect to MetaMask
  async connect() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        this.account = accounts[0];
        this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
        this.isConnected = true;
        
        // Set up event listeners
        this.setupEventListeners();
        
        return {
          success: true,
          account: this.account,
          chainId: this.chainId
        };
      }
    } catch (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  // Disconnect from MetaMask
  disconnect() {
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
  }

  // Set up event listeners for account and network changes
  setupEventListeners() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.account = accounts[0];
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        this.chainId = chainId;
        window.location.reload(); // Recommended by MetaMask
      });
    }
  }

  // Get current connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId
    };
  }
}

// Export for use in other files
window.MetaMaskConnector = MetaMaskConnector;