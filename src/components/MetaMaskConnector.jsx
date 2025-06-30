import React from 'react';
import { Wallet, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useMetaMask } from '../hooks/useMetaMask.js';

export function MetaMaskConnector({ onConnectionChange }) {
  const { account, chainId, isConnecting, error, isConnected, connect, disconnect } = useMetaMask();

  React.useEffect(() => {
    onConnectionChange({ account, chainId, isConnected });
  }, [account, chainId, isConnected, onConnectionChange]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainName = (chainId) => {
    const chains = {
      '0x1': 'Ethereum Mainnet',
      '0x89': 'Polygon Mainnet',
      '0xaa36a7': 'Sepolia Testnet'
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Wallet className="w-6 h-6 text-orange-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">MetaMask Connection</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 font-medium">Connected to MetaMask</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Account:</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {formatAddress(account)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Network:</span>
              <span className="text-sm font-medium text-blue-600">
                {getChainName(chainId)}
              </span>
            </div>
          </div>

          <button
            onClick={disconnect}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Connect your MetaMask wallet to interact with Chainlink price feeds and verify contracts.
          </p>
          
          <button
            onClick={connect}
            disabled={isConnecting}
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
          >
            {isConnecting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Connect MetaMask
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}