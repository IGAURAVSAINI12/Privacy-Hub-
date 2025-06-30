import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, ExternalLink, Loader } from 'lucide-react';
import { verifyChainlinkContract } from '../utils/verifyContract.js';

export function ContractVerifier({ provider, selectedNetwork }) {
  const [contractAddress, setContractAddress] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!contractAddress.trim() || !provider) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyChainlinkContract(contractAddress.trim(), provider);
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({
        isValid: false,
        error: error.message,
        contractAddress: contractAddress.trim()
      });
    } finally {
      setIsVerifying(false);
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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Search className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Contract Verifier</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="contract-address" className="block text-sm font-medium text-gray-700 mb-2">
            Contract Address
          </label>
          <div className="flex gap-2">
            <input
              id="contract-address"
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleVerify}
              disabled={!contractAddress.trim() || !provider || isVerifying}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Verify
                </>
              )}
            </button>
          </div>
        </div>

        {verificationResult && (
          <div className={`p-4 rounded-lg border-2 ${
            verificationResult.isValid 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {verificationResult.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                verificationResult.isValid ? 'text-green-800' : 'text-red-800'
              }`}>
                {verificationResult.isValid ? 'Valid Chainlink Price Feed' : 'Invalid Contract'}
              </span>
            </div>

            {verificationResult.isValid ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Description:</span>
                    <p className="font-medium text-gray-900">{verificationResult.description}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Latest Price:</span>
                    <p className="font-bold text-2xl text-green-600">
                      {formatPrice(verificationResult.latestPrice)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Decimals:</span>
                    <p className="font-medium text-gray-900">{verificationResult.decimals}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Last Updated:</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <p className="font-medium text-gray-900">
                        {verificationResult.updatedAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {verificationResult.isStale && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Warning: Price data is more than 24 hours old
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={getExplorerUrl(verificationResult.contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-700 text-sm mb-2">{verificationResult.error}</p>
                {verificationResult.details && (
                  <p className="text-red-600 text-xs">{verificationResult.details}</p>
                )}
              </div>
            )}
          </div>
        )}

        {!provider && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Please connect MetaMask to verify contracts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}