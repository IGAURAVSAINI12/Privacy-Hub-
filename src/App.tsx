import React, { useState, useCallback } from 'react';
import { Link, Shield, Zap, Eye, Cookie, AlertTriangle } from 'lucide-react';
import { MetaMaskConnector } from './components/MetaMaskConnector.jsx';
import { NetworkSelector } from './components/NetworkSelector.jsx';
import { ContractVerifier } from './components/ContractVerifier.jsx';
import { PriceFeedList } from './components/PriceFeedList.jsx';
import { PrivacyDashboard } from './components/PrivacyDashboard.jsx';
import { CookieManager } from './components/CookieManager.jsx';
import { TrackerMonitor } from './components/TrackerMonitor.jsx';

function App() {
  const [connectionState, setConnectionState] = useState({
    account: null,
    chainId: null,
    isConnected: false
  });
  const [selectedNetwork, setSelectedNetwork] = useState('ETHEREUM');
  const [provider, setProvider] = useState(null);
  const [activeTab, setActiveTab] = useState('chainlink');

  const handleConnectionChange = useCallback((state) => {
    setConnectionState(state);
    if (state.isConnected && window.ethereum) {
      const { ethers } = window;
      if (ethers) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
      }
    } else {
      setProvider(null);
    }
  }, []);

  const tabs = [
    { id: 'chainlink', label: 'Chainlink Feeds', icon: Link },
    { id: 'privacy', label: 'Privacy Dashboard', icon: Eye },
    { id: 'cookies', label: 'Cookie Manager', icon: Cookie },
    { id: 'trackers', label: 'Tracker Monitor', icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-blue-600 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chainlink Privacy Hub</h1>
                <p className="text-sm text-gray-600">Web3 Integration with Privacy Protection</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Powered by Chainlink & Enhanced Privacy
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Web3 Privacy & Security Hub
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect your MetaMask wallet to access Chainlink price feeds while monitoring and protecting 
            your privacy with advanced cookie management and tracker detection.
          </p>
        </div>

        {/* Tab Content */}
        {activeTab === 'chainlink' && (
          <div className="space-y-8">
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* MetaMask Connection */}
              <MetaMaskConnector onConnectionChange={handleConnectionChange} />
              
              {/* Network Selection */}
              <NetworkSelector 
                selectedNetwork={selectedNetwork}
                onNetworkChange={setSelectedNetwork}
              />
            </div>

            {/* Contract Verifier */}
            <ContractVerifier 
              provider={provider}
              selectedNetwork={selectedNetwork}
            />

            {/* Price Feeds */}
            <PriceFeedList 
              provider={provider}
              selectedNetwork={selectedNetwork}
            />
          </div>
        )}

        {activeTab === 'privacy' && (
          <PrivacyDashboard />
        )}

        {activeTab === 'cookies' && (
          <CookieManager />
        )}

        {activeTab === 'trackers' && (
          <TrackerMonitor />
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="p-3 bg-orange-100 rounded-lg w-fit mb-4">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Connection</h3>
            <p className="text-gray-600 text-sm">
              Connect securely to MetaMask with industry-standard Web3 protocols.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
              <Link className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chainlink Integration</h3>
            <p className="text-gray-600 text-sm">
              Access real-time price feeds from Chainlink's decentralized oracle network.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
              <Cookie className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Protection</h3>
            <p className="text-gray-600 text-sm">
              Monitor and manage harmful cookies with advanced detection algorithms.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="p-3 bg-red-100 rounded-lg w-fit mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tracker Detection</h3>
            <p className="text-gray-600 text-sm">
              Real-time monitoring of tracking scripts and privacy threats.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Built with React, TypeScript, Tailwind CSS, and Ethers.js
            </p>
            <p className="text-xs mt-2">
              Integrating Chainlink Oracle Network with MetaMask and Advanced Privacy Protection
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;