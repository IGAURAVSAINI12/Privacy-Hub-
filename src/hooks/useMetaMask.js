import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { validateMetaMaskConnection, switchMetaMaskNetwork } from '../utils/verifyContract.js';

export function useMetaMask() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize provider and check connection
  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
      
      // Check if already connected
      checkConnection();
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(chainId);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setError('Please connect to MetaMask');
    } else {
      setAccount(accounts[0]);
      setError(null);
    }
  };

  const handleChainChanged = (chainId) => {
    setChainId(chainId);
    window.location.reload(); // Recommended by MetaMask
  };

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(chainId);
        return true;
      }
    } catch (error) {
      if (error.code === 4001) {
        setError('Please connect to MetaMask.');
      } else {
        setError('An error occurred while connecting to MetaMask.');
      }
      console.error('Error connecting to MetaMask:', error);
    } finally {
      setIsConnecting(false);
    }
    
    return false;
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setError(null);
  }, []);

  const switchNetwork = useCallback(async (networkConfig) => {
    try {
      const success = await switchMetaMaskNetwork(networkConfig);
      if (success) {
        setError(null);
        return true;
      } else {
        setError('Failed to switch network');
        return false;
      }
    } catch (error) {
      setError('Error switching network: ' + error.message);
      return false;
    }
  }, []);

  return {
    account,
    provider,
    chainId,
    isConnecting,
    error,
    isConnected: !!account,
    connect,
    disconnect,
    switchNetwork
  };
}