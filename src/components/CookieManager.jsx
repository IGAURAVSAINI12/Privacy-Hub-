import React, { useState, useEffect } from 'react';
import { Cookie, Trash2, Shield, AlertTriangle, Search, Filter } from 'lucide-react';
import { useCookieManager } from '../hooks/useCookieManager.js';

export function CookieManager() {
  const { cookies, harmfulCookies, deleteCookie, deleteAllHarmful, scanCookies, isScanning } = useCookieManager();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCookies, setSelectedCookies] = useState(new Set());

  const filteredCookies = cookies.filter(cookie => {
    const matchesSearch = cookie.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cookie.domain.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'harmful') return matchesSearch && cookie.isHarmful;
    if (filterType === 'tracking') return matchesSearch && cookie.isTracking;
    if (filterType === 'essential') return matchesSearch && cookie.isEssential;
    
    return matchesSearch;
  });

  const handleSelectCookie = (cookieId) => {
    const newSelected = new Set(selectedCookies);
    if (newSelected.has(cookieId)) {
      newSelected.delete(cookieId);
    } else {
      newSelected.add(cookieId);
    }
    setSelectedCookies(newSelected);
  };

  const handleDeleteSelected = async () => {
    for (const cookieId of selectedCookies) {
      await deleteCookie(cookieId);
    }
    setSelectedCookies(new Set());
  };

  const getCookieTypeColor = (cookie) => {
    if (cookie.isHarmful) return 'text-red-600 bg-red-100';
    if (cookie.isTracking) return 'text-orange-600 bg-orange-100';
    if (cookie.isEssential) return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getCookieTypeLabel = (cookie) => {
    if (cookie.isHarmful) return 'Harmful';
    if (cookie.isTracking) return 'Tracking';
    if (cookie.isEssential) return 'Essential';
    return 'Standard';
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Cookie className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{cookies.length}</div>
              <div className="text-sm text-gray-600">Total Cookies</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">{harmfulCookies.length}</div>
              <div className="text-sm text-gray-600">Harmful Cookies</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {cookies.filter(c => c.isTracking).length}
              </div>
              <div className="text-sm text-gray-600">Tracking Cookies</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Cookie className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {cookies.filter(c => c.isEssential).length}
              </div>
              <div className="text-sm text-gray-600">Essential Cookies</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Cookie className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Cookie Manager</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={scanCookies}
              disabled={isScanning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {isScanning ? 'Scanning...' : 'Scan Cookies'}
            </button>

            <button
              onClick={deleteAllHarmful}
              disabled={harmfulCookies.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Harmful ({harmfulCookies.length})
            </button>

            {selectedCookies.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedCookies.size})
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cookies by name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Cookies</option>
              <option value="harmful">Harmful Only</option>
              <option value="tracking">Tracking Only</option>
              <option value="essential">Essential Only</option>
            </select>
          </div>
        </div>

        {/* Cookie List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCookies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterType !== 'all' ? 'No cookies match your filters' : 'No cookies found'}
            </div>
          ) : (
            filteredCookies.map((cookie) => (
              <div
                key={cookie.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCookies.has(cookie.id)}
                      onChange={() => handleSelectCookie(cookie.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{cookie.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCookieTypeColor(cookie)}`}>
                          {getCookieTypeLabel(cookie)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p><span className="font-medium">Domain:</span> {cookie.domain}</p>
                        <p><span className="font-medium">Expires:</span> {cookie.expirationDate || 'Session'}</p>
                        {cookie.purpose && (
                          <p><span className="font-medium">Purpose:</span> {cookie.purpose}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cookie.isHarmful && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Harmful</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => deleteCookie(cookie.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {cookie.riskFactors && cookie.riskFactors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h5 className="text-sm font-medium text-red-900 mb-1">Risk Factors:</h5>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {cookie.riskFactors.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}