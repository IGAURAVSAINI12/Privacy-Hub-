import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, Shield, Activity, ExternalLink, Ban } from 'lucide-react';
import { useTrackerMonitor } from '../hooks/useTrackerMonitor.js';

export function TrackerMonitor() {
  const { trackers, blockedTrackers, isMonitoring, startMonitoring, stopMonitoring, blockTracker } = useTrackerMonitor();
  const [activeTab, setActiveTab] = useState('detected');

  const getTrackerTypeColor = (type) => {
    const colors = {
      'analytics': 'bg-blue-100 text-blue-800',
      'advertising': 'bg-red-100 text-red-800',
      'social': 'bg-purple-100 text-purple-800',
      'fingerprinting': 'bg-orange-100 text-orange-800',
      'cryptomining': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getRiskLevelColor = (risk) => {
    if (risk === 'high') return 'text-red-600';
    if (risk === 'medium') return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{trackers.length}</div>
              <div className="text-sm text-gray-600">Trackers Detected</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{blockedTrackers.length}</div>
              <div className="text-sm text-gray-600">Trackers Blocked</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">
                {trackers.filter(t => t.riskLevel === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Risk</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Activity className={`w-8 h-8 ${isMonitoring ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <div className={`text-2xl font-bold ${isMonitoring ? 'text-green-600' : 'text-gray-400'}`}>
                {isMonitoring ? 'ON' : 'OFF'}
              </div>
              <div className="text-sm text-gray-600">Monitoring Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tracker Monitor</h2>
              <p className="text-sm text-gray-600">Real-time tracking detection and blocking</p>
            </div>
          </div>

          <div className="flex gap-2">
            {isMonitoring ? (
              <button
                onClick={stopMonitoring}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Stop Monitoring
              </button>
            ) : (
              <button
                onClick={startMonitoring}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Start Monitoring
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('detected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'detected'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Detected Trackers ({trackers.length})
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'blocked'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Blocked Trackers ({blockedTrackers.length})
          </button>
        </div>

        {/* Tracker Lists */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeTab === 'detected' && (
            <>
              {trackers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {isMonitoring ? 'No trackers detected yet' : 'Start monitoring to detect trackers'}
                </div>
              ) : (
                trackers.map((tracker) => (
                  <div
                    key={tracker.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{tracker.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrackerTypeColor(tracker.type)}`}>
                            {tracker.type}
                          </span>
                          <span className={`text-xs font-medium ${getRiskLevelColor(tracker.riskLevel)}`}>
                            {tracker.riskLevel.toUpperCase()} RISK
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Domain:</span> {tracker.domain}</p>
                          <p><span className="font-medium">First Seen:</span> {tracker.firstSeen.toLocaleString()}</p>
                          <p><span className="font-medium">Requests:</span> {tracker.requestCount}</p>
                          {tracker.description && (
                            <p><span className="font-medium">Description:</span> {tracker.description}</p>
                          )}
                        </div>

                        {tracker.dataCollected && tracker.dataCollected.length > 0 && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h5 className="text-sm font-medium text-yellow-900 mb-1">Data Collected:</h5>
                            <div className="flex flex-wrap gap-1">
                              {tracker.dataCollected.map((data, index) => (
                                <span key={index} className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                                  {data}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <a
                          href={`https://www.whois.com/whois/${tracker.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        
                        <button
                          onClick={() => blockTracker(tracker.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors duration-200 flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          Block
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'blocked' && (
            <>
              {blockedTrackers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No trackers have been blocked yet
                </div>
              ) : (
                blockedTrackers.map((tracker) => (
                  <div
                    key={tracker.id}
                    className="p-4 border border-green-200 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          <h4 className="font-medium text-green-900">{tracker.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrackerTypeColor(tracker.type)}`}>
                            {tracker.type}
                          </span>
                        </div>
                        
                        <div className="text-sm text-green-700">
                          <p><span className="font-medium">Domain:</span> {tracker.domain}</p>
                          <p><span className="font-medium">Blocked:</span> {tracker.blockedAt.toLocaleString()}</p>
                          <p><span className="font-medium">Blocked Requests:</span> {tracker.blockedRequests}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {/* Implement unblock functionality */}}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors duration-200"
                      >
                        Unblock
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Real-time Activity */}
      {isMonitoring && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Real-time Activity</h3>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
              Monitoring active... Scanning for new tracking attempts...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}