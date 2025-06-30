import React from 'react';
import { Globe, ArrowRightLeft } from 'lucide-react';
import { CHAINLINK_CONFIG } from '../config/config.js';
import { useMetaMask } from '../hooks/useMetaMask.js';

export function NetworkSelector({ selectedNetwork, onNetworkChange }) {
  const { switchNetwork, chainId } = useMetaMask();
  const [isSwitching, setIsSwitching] = React.useState(false);

  const networks = [
    { key: 'ETHEREUM', name: 'Ethereum Mainnet', ...CHAINLINK_CONFIG.ETHEREUM },
    { key: 'POLYGON', name: 'Polygon Mainnet', ...CHAINLINK_CONFIG.POLYGON },
    { key: 'SEPOLIA', name: 'Sepolia Testnet', ...CHAINLINK_CONFIG.SEPOLIA }
  ];

  const handleNetworkSwitch = async (network) => {
    setIsSwitching(true);
    try {
      const success = await switchNetwork(network);
      if (success) {
        onNetworkChange(network.key);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const isCurrentNetwork = (network) => {
    return chainId === network.chainId;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Globe className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Network Selection</h2>
      </div>

      <div className="space-y-3">
        {networks.map((network) => (
          <div
            key={network.key}
            className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
              isCurrentNetwork(network)
                ? 'border-blue-500 bg-blue-50'
                : selectedNetwork === network.key
                ? 'border-blue-300 bg-blue-25'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onNetworkChange(network.key)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{network.chainName}</h3>
                <p className="text-sm text-gray-600">
                  {Object.keys(network.chainlinkPriceFeeds).length} price feeds available
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {isCurrentNetwork(network) && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    Connected
                  </span>
                )}
                
                {!isCurrentNetwork(network) && chainId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNetworkSwitch(network);
                    }}
                    disabled={isSwitching}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-full font-medium transition-colors duration-200 flex items-center gap-1"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Switch
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          Select a network to view available Chainlink price feeds. You can switch networks directly from MetaMask or use the switch buttons above.
        </p>
      </div>
    </div>
  );
}