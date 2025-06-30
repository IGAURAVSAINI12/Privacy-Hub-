import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import { CHAINLINK_CONFIG, PRICE_FEED_ABI } from '../config/config.js';
import { ethers } from 'ethers';

export function PriceFeedList({ provider, selectedNetwork }) {
  const [priceFeeds, setPriceFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const networkConfig = CHAINLINK_CONFIG[selectedNetwork];

  useEffect(() => {
    if (provider && networkConfig) {
      fetchPriceFeeds();
    }
  }, [provider, selectedNetwork]);

  const fetchPriceFeeds = async () => {
    if (!provider || !networkConfig) return;

    setIsLoading(true);
    try {
      const feeds = await Promise.all(
        Object.entries(networkConfig.chainlinkPriceFeeds).map(async ([pair, address]) => {
          try {
            const contract = new ethers.Contract(address, PRICE_FEED_ABI, provider);
            const [description, decimals, latestRoundData] = await Promise.all([
              contract.description(),
              contract.decimals(),
              contract.latestRoundData()
            ]);

            const [roundId, answer, startedAt, updatedAt, answeredInRound] = latestRoundData;
            const price = Number(answer) / Math.pow(10, Number(decimals));

            return {
              pair,
              address,
              description,
              price,
              decimals: Number(decimals),
              updatedAt: new Date(Number(updatedAt) * 1000),
              roundId: roundId.toString()
            };
          } catch (error) {
            console.error(`Error fetching ${pair}:`, error);
            return {
              pair,
              address,
              error: error.message
            };
          }
        })
      );

      setPriceFeeds(feeds);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching price feeds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price);
  };

  const getExplorerUrl = (address) => {
    const explorers = {
      'ETHEREUM': 'https://etherscan.io/address/',
      'POLYGON': 'https://polygonscan.com/address/',
      'SEPOLIA': 'https://sepolia.etherscan.io/address/'
    };
    return explorers[selectedNetwork] + address;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Price Feeds</h2>
            <p className="text-sm text-gray-600">{networkConfig?.chainName}</p>
          </div>
        </div>
        
        <button
          onClick={fetchPriceFeeds}
          disabled={isLoading || !provider}
          className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!provider ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Please connect MetaMask to view price feeds
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {priceFeeds.map((feed) => (
            <div
              key={feed.pair}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200"
            >
              {feed.error ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{feed.pair}</h3>
                    <p className="text-sm text-red-600">Error: {feed.error}</p>
                  </div>
                  <a
                    href={getExplorerUrl(feed.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{feed.pair}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {feed.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated: {feed.updatedAt?.toLocaleTimeString()}</span>
                      </div>
                      <span>Round: {feed.roundId}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(feed.price)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Decimals: {feed.decimals}
                      </p>
                    </div>
                    <a
                      href={getExplorerUrl(feed.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}

          {lastUpdated && (
            <div className="text-center text-xs text-gray-500 pt-2">
              Last refreshed: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}