// Web3 MetaMask Connection Script
class Web3MetaMaskConnector {
    constructor() {
        this.isConnected = false;
        this.account = null;
        this.chainId = null;
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.checkTimeout = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Web3 MetaMask Connector initializing...');
        this.setupEventListeners();
        this.fastMetaMaskCheck();
    }

    setupEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => {
            this.connectMetaMask();
        });

        document.getElementById('installBtn').addEventListener('click', () => {
            window.open('https://metamask.io/download/', '_blank');
        });

        document.getElementById('disconnectBtn').addEventListener('click', () => {
            this.disconnect();
        });

        document.getElementById('callContractBtn').addEventListener('click', () => {
            this.callContractFunction();
        });

        // Listen for MetaMask events
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('👤 Accounts changed:', accounts);
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.account = accounts[0];
                    this.updateUI();
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                console.log('🔗 Chain changed:', chainId);
                this.chainId = chainId;
                this.updateUI();
                if (this.isConnected) {
                    this.fetchPriceFeeds();
                }
            });
        }
    }

    fastMetaMaskCheck() {
        console.log('⚡ Starting FAST MetaMask check...');
        
        // Set a timeout to prevent hanging
        this.checkTimeout = setTimeout(() => {
            console.log('⏰ MetaMask check timeout - assuming not installed');
            this.handleMetaMaskNotFound();
        }, 3000); // 3 second timeout

        // Immediate check
        this.performMetaMaskCheck();
        
        // Also check after a short delay for async loading
        setTimeout(() => {
            this.performMetaMaskCheck();
        }, 500);
        
        // Final check after 1 second
        setTimeout(() => {
            this.performMetaMaskCheck();
        }, 1000);
    }

    performMetaMaskCheck() {
        try {
            console.log('🔍 Performing MetaMask check...');
            
            // Clear timeout if we're checking
            if (this.checkTimeout) {
                clearTimeout(this.checkTimeout);
                this.checkTimeout = null;
            }

            // Check if ethereum object exists
            if (typeof window.ethereum === 'undefined') {
                console.log('❌ window.ethereum not found');
                this.handleMetaMaskNotFound();
                return;
            }

            // Handle multiple providers
            let ethereum = window.ethereum;
            if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
                ethereum = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
                console.log('🔍 Multiple providers found, using MetaMask:', ethereum.isMetaMask);
            }

            if (!ethereum.isMetaMask) {
                console.log('❌ MetaMask provider not found');
                this.handleMetaMaskNotFound();
                return;
            }

            console.log('✅ MetaMask found!');
            this.provider = ethereum;
            this.handleMetaMaskFound();

        } catch (error) {
            console.error('❌ Error in MetaMask check:', error);
            this.handleMetaMaskNotFound();
        }
    }

    handleMetaMaskFound() {
        console.log('🎉 MetaMask detected successfully!');
        
        const statusEl = document.getElementById('connectionStatus');
        const connectBtn = document.getElementById('connectBtn');
        
        statusEl.innerHTML = '✅ MetaMask Ready';
        statusEl.className = 'status-value status-ready';
        
        connectBtn.disabled = false;
        connectBtn.textContent = '🦊 Connect MetaMask';
        
        // Check if already connected
        this.checkExistingConnection();
    }

    handleMetaMaskNotFound() {
        console.log('❌ MetaMask not found');
        
        const statusEl = document.getElementById('connectionStatus');
        const connectBtn = document.getElementById('connectBtn');
        const installBtn = document.getElementById('installBtn');
        
        statusEl.innerHTML = '❌ MetaMask Not Installed';
        statusEl.className = 'status-value status-error';
        
        connectBtn.style.display = 'none';
        installBtn.style.display = 'inline-flex';
        
        this.showError('MetaMask is not installed. Please install the MetaMask browser extension to continue.');
    }

    async checkExistingConnection() {
        try {
            console.log('🔍 Checking existing connection...');
            
            if (!this.provider) return;

            const accounts = await this.provider.request({ method: 'eth_accounts' });
            
            if (accounts.length > 0) {
                console.log('🎉 Already connected to MetaMask');
                this.account = accounts[0];
                this.chainId = await this.provider.request({ method: 'eth_chainId' });
                this.isConnected = true;
                
                // Initialize ethers provider and signer
                await this.initializeEthers();
                
                this.updateUI();
                await this.fetchPriceFeeds();
                this.showSuccess('🎉 Already connected to MetaMask!');
            }

        } catch (error) {
            console.error('❌ Error checking existing connection:', error);
            // Don't show error for this, just continue
        }
    }

    async initializeEthers() {
        try {
            // Initialize ethers provider and signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            console.log('✅ Ethers provider and signer initialized');
        } catch (error) {
            console.error('❌ Error initializing ethers:', error);
        }
    }

    async connectMetaMask() {
        console.log('🔗 Attempting to connect to MetaMask...');
        
        const connectBtn = document.getElementById('connectBtn');
        const originalText = connectBtn.textContent;
        
        connectBtn.disabled = true;
        connectBtn.innerHTML = '<span class="spinner"></span> Connecting...';
        
        try {
            if (!this.provider) {
                throw new Error('MetaMask provider not available');
            }

            console.log('📡 Requesting account access...');
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            console.log('📋 Connection response:', accounts);

            if (accounts.length > 0) {
                this.account = accounts[0];
                this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
                this.isConnected = true;

                // Initialize ethers provider and signer
                await this.initializeEthers();

                console.log('🎉 Successfully connected!', {
                    account: this.account,
                    chainId: this.chainId
                });

                this.updateUI();
                await this.fetchPriceFeeds();
                
                this.showSuccess('🎉 Successfully connected to MetaMask!');
            } else {
                throw new Error('No accounts returned from MetaMask');
            }

        } catch (error) {
            console.error('❌ Connection failed:', error);
            
            let errorMessage = 'Failed to connect to MetaMask';
            if (error.code === 4001) {
                errorMessage = 'Connection rejected by user';
            } else if (error.code === -32002) {
                errorMessage = 'Connection request already pending. Please check MetaMask.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        } finally {
            connectBtn.disabled = false;
            connectBtn.innerHTML = originalText;
        }
    }

    async callContractFunction() {
        if (!this.isConnected) {
            this.showError('Please connect MetaMask first');
            return;
        }

        const contractAddress = document.getElementById('contractAddress').value.trim();
        const functionName = document.getElementById('functionName').value.trim();
        const functionInput = document.getElementById('functionInput').value.trim();

        if (!contractAddress || !functionName) {
            this.showError('Please enter contract address and function name');
            return;
        }

        const callBtn = document.getElementById('callContractBtn');
        const originalText = callBtn.textContent;
        
        callBtn.disabled = true;
        callBtn.innerHTML = '<span class="spinner"></span> Calling Contract...';

        try {
            // Basic ABI for common functions
            const basicABI = [
                // Read functions
                `function ${functionName}() view returns (string)`,
                `function ${functionName}(uint256) view returns (string)`,
                `function ${functionName}(address) view returns (uint256)`,
                `function ${functionName}(string) view returns (string)`,
                // Write functions
                `function ${functionName}()`,
                `function ${functionName}(uint256)`,
                `function ${functionName}(address)`,
                `function ${functionName}(string)`
            ];

            // Create contract instance
            this.contract = new ethers.Contract(contractAddress, basicABI, this.signer);

            let result;
            if (functionInput) {
                // Try to determine input type and call with parameter
                if (functionInput.startsWith('0x')) {
                    // Address
                    result = await this.contract[functionName](functionInput);
                } else if (!isNaN(functionInput)) {
                    // Number
                    result = await this.contract[functionName](functionInput);
                } else {
                    // String
                    result = await this.contract[functionName](functionInput);
                }
            } else {
                // Call without parameters
                result = await this.contract[functionName]();
            }

            // Display result
            const resultDiv = document.getElementById('contractResult');
            const outputDiv = document.getElementById('resultOutput');
            
            resultDiv.style.display = 'block';
            
            if (typeof result === 'object' && result.length !== undefined) {
                // Array result
                outputDiv.innerHTML = `
                    <p><strong>Function:</strong> ${functionName}</p>
                    <p><strong>Result Type:</strong> Array</p>
                    <p><strong>Length:</strong> ${result.length}</p>
                    <p><strong>Values:</strong></p>
                    <ul>
                        ${result.map((item, index) => `<li>[${index}]: ${item.toString()}</li>`).join('')}
                    </ul>
                `;
            } else {
                // Single value result
                outputDiv.innerHTML = `
                    <p><strong>Function:</strong> ${functionName}</p>
                    <p><strong>Result:</strong> ${result.toString()}</p>
                    <p><strong>Type:</strong> ${typeof result}</p>
                `;
            }

            this.showSuccess(`Contract function "${functionName}" called successfully!`);

        } catch (error) {
            console.error('❌ Contract call failed:', error);
            
            let errorMessage = 'Contract call failed';
            if (error.message.includes('execution reverted')) {
                errorMessage = 'Contract execution reverted - check function parameters';
            } else if (error.message.includes('invalid address')) {
                errorMessage = 'Invalid contract address';
            } else if (error.message.includes('function does not exist')) {
                errorMessage = 'Function does not exist on this contract';
            } else {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        } finally {
            callBtn.disabled = false;
            callBtn.innerHTML = originalText;
        }
    }

    async fetchPriceFeeds() {
        const priceFeedsSection = document.getElementById('priceFeedsSection');
        const priceFeeds = document.getElementById('priceFeeds');
        
        priceFeedsSection.style.display = 'block';
        priceFeeds.innerHTML = '<div class="loading"><span class="spinner"></span> Loading price feeds...</div>';

        try {
            console.log('📊 Fetching price feeds for chain:', this.chainId);
            
            const networkName = this.getNetworkName(this.chainId);
            
            // Simulate fetching real price data with faster loading
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const prices = {
                'ETH/USD': { 
                    price: 2345.67 + (Math.random() - 0.5) * 100, 
                    network: networkName,
                    updated: new Date().toLocaleTimeString()
                },
                'BTC/USD': { 
                    price: 43210.89 + (Math.random() - 0.5) * 1000, 
                    network: networkName,
                    updated: new Date().toLocaleTimeString()
                },
                'LINK/USD': { 
                    price: 14.56 + (Math.random() - 0.5) * 2, 
                    network: networkName,
                    updated: new Date().toLocaleTimeString()
                },
                'MATIC/USD': { 
                    price: 0.89 + (Math.random() - 0.5) * 0.2, 
                    network: networkName,
                    updated: new Date().toLocaleTimeString()
                }
            };

            this.displayPriceFeeds(prices);
            
        } catch (error) {
            console.error('❌ Error fetching price feeds:', error);
            priceFeeds.innerHTML = '<div class="error">Failed to load price feeds</div>';
        }
    }

    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum Mainnet',
            '0x89': 'Polygon Mainnet',
            '0xaa36a7': 'Sepolia Testnet',
            '0x5': 'Goerli Testnet',
            '0xa': 'Optimism',
            '0xa4b1': 'Arbitrum One',
            '0x38': 'BSC Mainnet'
        };
        return networks[chainId] || `Unknown Network (${chainId})`;
    }

    displayPriceFeeds(prices) {
        const container = document.getElementById('priceFeeds');
        const html = Object.entries(prices).map(([pair, data]) => `
            <div class="price-item">
                <div>
                    <div class="price-pair">${pair}</div>
                    <div class="network-info">${data.network} • Updated: ${data.updated}</div>
                </div>
                <div class="price-value">$${data.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 8
                })}</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    updateUI() {
        const statusEl = document.getElementById('connectionStatus');
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const accountInfo = document.getElementById('accountInfo');
        const contractSection = document.getElementById('contractSection');
        const accountAddress = document.getElementById('accountAddress');
        const networkName = document.getElementById('networkName');
        const chainIdEl = document.getElementById('chainId');

        if (this.isConnected && this.account) {
            statusEl.innerHTML = '🎉 Connected to MetaMask';
            statusEl.className = 'status-value status-connected';
            
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'inline-flex';
            accountInfo.style.display = 'block';
            contractSection.style.display = 'block';
            
            accountAddress.textContent = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
            networkName.textContent = this.getNetworkName(this.chainId);
            chainIdEl.textContent = this.chainId;
        } else {
            statusEl.innerHTML = '⚠️ Not Connected';
            statusEl.className = 'status-value status-error';
            
            connectBtn.style.display = 'inline-flex';
            disconnectBtn.style.display = 'none';
            accountInfo.style.display = 'none';
            contractSection.style.display = 'none';
            document.getElementById('priceFeedsSection').style.display = 'none';
        }
    }

    disconnect() {
        console.log('🔌 Disconnecting from MetaMask...');
        
        this.isConnected = false;
        this.account = null;
        this.chainId = null;
        this.provider = null;
        this.signer = null;
        this.contract = null;
        
        this.updateUI();
        this.showSuccess('Disconnected from MetaMask');
    }

    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        const successEl = document.getElementById('successMessage');
        
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        successEl.style.display = 'none';
        
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 8000);
    }

    showSuccess(message) {
        const errorEl = document.getElementById('errorMessage');
        const successEl = document.getElementById('successMessage');
        
        successEl.textContent = message;
        successEl.style.display = 'block';
        errorEl.style.display = 'none';
        
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
    }
}

// Initialize when script loads
console.log('🌐 Web3 MetaMask Connection Page script loaded');

// Start immediately, don't wait for DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.web3Connector = new Web3MetaMaskConnector();
    });
} else {
    window.web3Connector = new Web3MetaMaskConnector();
}

// Global functions for easy access
window.connectWallet = async function() {
    if (window.web3Connector) {
        return await window.web3Connector.connectMetaMask();
    }
};

window.getProvider = function() {
    return window.web3Connector?.provider;
};

window.getSigner = function() {
    return window.web3Connector?.signer;
};

window.getContract = function(address, abi) {
    if (window.web3Connector?.signer) {
        return new ethers.Contract(address, abi, window.web3Connector.signer);
    }
    return null;
};