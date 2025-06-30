// Injected script for MetaMask integration
(function() {
    'use strict';
    
    // MetaMask integration utilities
    window.ChainlinkPrivacyHub = {
        // Check if MetaMask is available
        isMetaMaskAvailable() {
            return typeof window.ethereum !== 'undefined';
        },

        // Connect to MetaMask
        async connectMetaMask() {
            if (!this.isMetaMaskAvailable()) {
                throw new Error('MetaMask is not installed');
            }

            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                const chainId = await window.ethereum.request({
                    method: 'eth_chainId'
                });

                return {
                    success: true,
                    account: accounts[0],
                    chainId: chainId
                };
            } catch (error) {
                throw new Error(`Connection failed: ${error.message}`);
            }
        },

        // Get current account
        async getCurrentAccount() {
            if (!this.isMetaMaskAvailable()) return null;

            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });
                return accounts[0] || null;
            } catch (error) {
                return null;
            }
        },

        // Switch network
        async switchNetwork(chainId) {
            if (!this.isMetaMaskAvailable()) {
                throw new Error('MetaMask is not installed');
            }

            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: chainId }]
                });
                return true;
            } catch (error) {
                throw new Error(`Network switch failed: ${error.message}`);
            }
        },

        // Get Chainlink price feed data (mock implementation)
        async getChainlinkPrice(feedAddress) {
            // This would normally interact with actual Chainlink contracts
            // For demo purposes, return mock data
            const mockPrices = {
                '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419': { // ETH/USD
                    price: 2345.67,
                    pair: 'ETH/USD',
                    updated: new Date().toISOString()
                },
                '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c': { // BTC/USD
                    price: 43210.89,
                    pair: 'BTC/USD',
                    updated: new Date().toISOString()
                }
            };

            return mockPrices[feedAddress] || {
                price: Math.random() * 1000,
                pair: 'UNKNOWN',
                updated: new Date().toISOString()
            };
        }
    };

    // Privacy monitoring utilities
    window.PrivacyMonitor = {
        // Scan for harmful cookies
        scanCookies() {
            const cookies = document.cookie.split(';').map(cookie => {
                const [name, value] = cookie.trim().split('=');
                return { name, value, domain: window.location.hostname };
            });

            return cookies.filter(cookie => this.isHarmfulCookie(cookie));
        },

        // Check if cookie is harmful
        isHarmfulCookie(cookie) {
            const harmfulPatterns = [
                'doubleclick', 'googleadservices', 'facebook', 'googlesyndication',
                'amazon-adsystem', 'adsystem', 'outbrain', 'taboola', 'criteo'
            ];

            return harmfulPatterns.some(pattern => 
                cookie.name.toLowerCase().includes(pattern)
            );
        },

        // Delete harmful cookies
        deleteHarmfulCookies() {
            const harmfulCookies = this.scanCookies();
            
            harmfulCookies.forEach(cookie => {
                document.cookie = `${cookie.name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${cookie.name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${cookie.domain};`;
            });

            return harmfulCookies.length;
        }
    };

    console.log('Chainlink Privacy Hub injected script loaded');
})();