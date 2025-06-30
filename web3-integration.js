/**
 * Web3 Integration Module
 * Complete ethers.js integration for smart contract interaction
 */

class Web3Integration {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.isConnected = false;
        this.account = null;
        this.chainId = null;
    }

    // Connect with Wallet
    async connectWallet() {
        try {
            if (window.ethereum) {
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
                
                // Get user address
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                this.account = accounts[0];
                
                // Get chain ID
                this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
                
                this.isConnected = true;
                
                console.log('✅ Wallet connected:', {
                    account: this.account,
                    chainId: this.chainId
                });
                
                return {
                    success: true,
                    account: this.account,
                    chainId: this.chainId
                };
            } else {
                alert("Please install MetaMask to interact with this DApp.");
                return { success: false, error: 'MetaMask not installed' };
            }
        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Get User Address
    async getUserAddress() {
        try {
            if (!this.isConnected) {
                await this.connectWallet();
            }
            
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const userAddress = accounts[0];
            
            console.log('👤 User address:', userAddress);
            return userAddress;
        } catch (error) {
            console.error('❌ Error getting user address:', error);
            throw error;
        }
    }

    // Connect wallet and Get Contract
    async getContract(contractAddress, abi) {
        try {
            if (!this.isConnected) {
                await this.connectWallet();
            }

            if (!this.provider || !this.signer) {
                throw new Error('Provider or signer not initialized');
            }

            this.contract = new ethers.Contract(contractAddress, abi, this.signer);
            
            console.log('📄 Contract initialized:', contractAddress);
            return this.contract;
        } catch (error) {
            console.error('❌ Error getting contract:', error);
            throw error;
        }
    }

    // Call Contract Function (Read)
    async callReadFunction(contractAddress, abi, functionName, ...inputs) {
        try {
            const contract = await this.getContract(contractAddress, abi);
            
            console.log(`📞 Calling read function: ${functionName}`, inputs);
            
            const result = await contract[functionName](...inputs);
            
            console.log(`✅ Function result:`, result);
            return result;
        } catch (error) {
            console.error(`❌ Error calling function ${functionName}:`, error);
            throw error;
        }
    }

    // Call Contract Function (Write)
    async callWriteFunction(contractAddress, abi, functionName, ...inputs) {
        try {
            const contract = await this.getContract(contractAddress, abi);
            
            console.log(`✍️ Calling write function: ${functionName}`, inputs);
            
            const tx = await contract[functionName](...inputs);
            console.log('📝 Transaction sent:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Transaction confirmed:', receipt);
            
            return {
                transaction: tx,
                receipt: receipt,
                success: true
            };
        } catch (error) {
            console.error(`❌ Error calling write function ${functionName}:`, error);
            throw error;
        }
    }

    // Example: Get Patient Data (Healthcare Contract)
    async getPatientData(contractAddress, abi, patientId) {
        try {
            const result = await this.callReadFunction(
                contractAddress, 
                abi, 
                'getPatient', 
                patientId
            );
            
            // Assuming the contract returns an array with patient data
            const patientData = {
                id: result[0],
                name: result[1],
                age: result[2],
                diagnosis: result[3]
            };
            
            // Update UI
            const patientNameElement = document.getElementById('patientName');
            if (patientNameElement) {
                patientNameElement.innerHTML = patientData.name;
            }
            
            return patientData;
        } catch (error) {
            console.error("Error fetching patient:", error);
            throw error;
        }
    }

    // Example: Get Token Balance
    async getTokenBalance(contractAddress, abi, userAddress) {
        try {
            const balance = await this.callReadFunction(
                contractAddress,
                abi,
                'balanceOf',
                userAddress
            );
            
            // Convert from wei to ether if needed
            const formattedBalance = ethers.formatEther(balance);
            
            console.log(`💰 Token balance: ${formattedBalance}`);
            return formattedBalance;
        } catch (error) {
            console.error("Error fetching balance:", error);
            throw error;
        }
    }

    // Example: Transfer Tokens
    async transferTokens(contractAddress, abi, toAddress, amount) {
        try {
            // Convert amount to wei
            const amountInWei = ethers.parseEther(amount.toString());
            
            const result = await this.callWriteFunction(
                contractAddress,
                abi,
                'transfer',
                toAddress,
                amountInWei
            );
            
            console.log(`💸 Tokens transferred successfully`);
            return result;
        } catch (error) {
            console.error("Error transferring tokens:", error);
            throw error;
        }
    }

    // Utility: Format Address
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // Utility: Format Token Amount
    formatTokenAmount(amount, decimals = 18) {
        return ethers.formatUnits(amount, decimals);
    }

    // Utility: Parse Token Amount
    parseTokenAmount(amount, decimals = 18) {
        return ethers.parseUnits(amount.toString(), decimals);
    }

    // Network Management
    async switchNetwork(chainId) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainId }],
            });
            
            this.chainId = chainId;
            return true;
        } catch (error) {
            console.error('❌ Error switching network:', error);
            return false;
        }
    }

    // Event Listeners
    setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.account = accounts[0];
                    console.log('👤 Account changed:', this.account);
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                this.chainId = chainId;
                console.log('🔗 Chain changed:', chainId);
                window.location.reload(); // Recommended by MetaMask
            });
        }
    }

    // Disconnect
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.isConnected = false;
        this.account = null;
        this.chainId = null;
        
        console.log('🔌 Wallet disconnected');
    }

    // Get Connection Status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            account: this.account,
            chainId: this.chainId,
            provider: !!this.provider,
            signer: !!this.signer
        };
    }
}

// Example ABIs for common contracts
const COMMON_ABIS = {
    // ERC20 Token ABI
    ERC20: [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ],

    // Healthcare Contract Example
    HEALTHCARE: [
        "function addPatient(string name, uint256 age, string diagnosis) returns (uint256)",
        "function getPatient(uint256 patientId) view returns (uint256, string, uint256, string)",
        "function updatePatient(uint256 patientId, string name, uint256 age, string diagnosis)",
        "function getPatientCount() view returns (uint256)",
        "event PatientAdded(uint256 indexed patientId, string name)",
        "event PatientUpdated(uint256 indexed patientId, string name)"
    ],

    // Chainlink Price Feed ABI
    CHAINLINK_PRICE_FEED: [
        "function decimals() view returns (uint8)",
        "function description() view returns (string)",
        "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"
    ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Web3Integration, COMMON_ABIS };
} else {
    window.Web3Integration = Web3Integration;
    window.COMMON_ABIS = COMMON_ABIS;
}

// Initialize global instance
window.web3 = new Web3Integration();
window.web3.setupEventListeners();

console.log('🚀 Web3 Integration module loaded');