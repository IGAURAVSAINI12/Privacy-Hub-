import React, { useState, useEffect } from 'react';
import { Shield, Eye, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { usePrivacyMonitor } from '../hooks/usePrivacyMonitor.js';

export function PrivacyDashboard() {
  const { privacyScore, threats, protections, isScanning } = usePrivacyMonitor();
  const [activeThreats, setActiveThreats] = useState([]);

  useEffect(() => {
    // Filter active threats
    const active = threats.filter(threat => threat.status === 'active');
    setActiveThreats(active);
  }, [threats]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Privacy Score Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${getScoreBgColor(privacyScore)}`}>
              <Shield className={`w-8 h-8 ${getScoreColor(privacyScore)}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Privacy Score</h2>
              <p className="text-gray-600">Real-time privacy protection assessment</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(privacyScore)}`}>
              {privacyScore}/100
            </div>
            <p className="text-sm text-gray-500">
              {privacyScore >= 80 ? 'Excellent' : privacyScore >= 60 ? 'Good' : 'Needs Attention'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              privacyScore >= 80 ? 'bg-green-500' : 
              privacyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${privacyScore}%` }}
          ></div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{threats.length}</div>
            <div className="text-sm text-gray-600">Total Threats</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{activeThreats.length}</div>
            <div className="text-sm text-gray-600">Active Threats</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{protections.length}</div>
            <div className="text-sm text-gray-600">Active Protections</div>
          </div>
        </div>
      </div>

      {/* Active Threats */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Active Privacy Threats</h3>
          {isScanning && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Activity className="w-4 h-4 animate-pulse" />
              Scanning...
            </div>
          )}
        </div>

        {activeThreats.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">No active privacy threats detected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeThreats.map((threat, index) => (
              <div key={index} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <h4 className="font-medium text-red-900">{threat.name}</h4>
                      <p className="text-sm text-red-700">{threat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      threat.severity === 'high' ? 'bg-red-200 text-red-800' :
                      threat.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-orange-200 text-orange-800'
                    }`}>
                      {threat.severity.toUpperCase()}
                    </span>
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors">
                      Block
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Protections */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Eye className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Active Protections</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {protections.map((protection, index) => (
            <div key={index} className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-900">{protection.name}</h4>
                  <p className="text-sm text-green-700">{protection.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Recommendations */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Privacy Recommendations</h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Enable Enhanced Tracking Protection</h4>
            <p className="text-sm text-blue-700 mb-3">
              Block cross-site tracking cookies and fingerprinting attempts for better privacy.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
              Enable Protection
            </button>
          </div>

          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Review Cookie Permissions</h4>
            <p className="text-sm text-yellow-700 mb-3">
              Some websites have excessive cookie permissions that could compromise your privacy.
            </p>
            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors">
              Review Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}