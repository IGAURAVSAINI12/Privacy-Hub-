import { useState, useEffect } from 'react';

export function usePrivacyMonitor() {
  const [privacyScore, setPrivacyScore] = useState(75);
  const [threats, setThreats] = useState([]);
  const [protections, setProtections] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Initialize with mock data
    setThreats([
      {
        id: 1,
        name: 'Cross-site Tracking Cookie',
        description: 'Third-party cookie tracking your browsing across multiple sites',
        severity: 'high',
        status: 'active',
        domain: 'doubleclick.net'
      },
      {
        id: 2,
        name: 'Fingerprinting Script',
        description: 'JavaScript attempting to create a unique browser fingerprint',
        severity: 'medium',
        status: 'active',
        domain: 'analytics.example.com'
      }
    ]);

    setProtections([
      {
        id: 1,
        name: 'HTTPS Enforcement',
        description: 'All connections are encrypted and secure',
        status: 'active'
      },
      {
        id: 2,
        name: 'Third-party Cookie Blocking',
        description: 'Blocking cross-site tracking cookies',
        status: 'active'
      },
      {
        id: 3,
        name: 'Referrer Policy Protection',
        description: 'Limiting referrer information shared with external sites',
        status: 'active'
      }
    ]);

    // Simulate periodic scanning
    const interval = setInterval(() => {
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        // Update privacy score based on threats
        const activeThreats = threats.filter(t => t.status === 'active');
        const newScore = Math.max(20, 100 - (activeThreats.length * 15));
        setPrivacyScore(newScore);
      }, 2000);
    }, 30000);

    return () => clearInterval(interval);
  }, [threats]);

  return {
    privacyScore,
    threats,
    protections,
    isScanning
  };
}