import { useState, useEffect } from 'react';

export function useTrackerMonitor() {
  const [trackers, setTrackers] = useState([]);
  const [blockedTrackers, setBlockedTrackers] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const generateMockTrackers = () => {
    const mockTrackers = [
      {
        id: '1',
        name: 'Google Analytics',
        domain: 'google-analytics.com',
        type: 'analytics',
        riskLevel: 'medium',
        firstSeen: new Date(Date.now() - 3600000),
        requestCount: 15,
        description: 'Web analytics service that tracks and reports website traffic',
        dataCollected: ['Page views', 'User interactions', 'Device info', 'Location']
      },
      {
        id: '2',
        name: 'DoubleClick',
        domain: 'doubleclick.net',
        type: 'advertising',
        riskLevel: 'high',
        firstSeen: new Date(Date.now() - 7200000),
        requestCount: 23,
        description: 'Ad serving platform that tracks users across websites',
        dataCollected: ['Browsing history', 'Ad interactions', 'Demographics', 'Interests']
      },
      {
        id: '3',
        name: 'Facebook Pixel',
        domain: 'facebook.com',
        type: 'social',
        riskLevel: 'high',
        firstSeen: new Date(Date.now() - 1800000),
        requestCount: 8,
        description: 'Social media tracking pixel for advertising and analytics',
        dataCollected: ['Social interactions', 'Profile data', 'Custom events', 'Conversions']
      },
      {
        id: '4',
        name: 'FingerprintJS',
        domain: 'fpjs.io',
        type: 'fingerprinting',
        riskLevel: 'high',
        firstSeen: new Date(Date.now() - 900000),
        requestCount: 3,
        description: 'Browser fingerprinting service for device identification',
        dataCollected: ['Browser fingerprint', 'Device characteristics', 'Screen resolution', 'Installed fonts']
      }
    ];

    setTrackers(mockTrackers);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    generateMockTrackers();
    
    // Simulate real-time tracker detection
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newTracker = {
          id: Date.now().toString(),
          name: 'New Tracker',
          domain: 'example-tracker.com',
          type: 'advertising',
          riskLevel: 'medium',
          firstSeen: new Date(),
          requestCount: 1,
          description: 'Newly detected tracking script',
          dataCollected: ['User behavior']
        };
        
        setTrackers(prev => [...prev, newTracker]);
      }
    }, 10000);

    return () => clearInterval(interval);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const blockTracker = (trackerId) => {
    const tracker = trackers.find(t => t.id === trackerId);
    if (tracker) {
      const blockedTracker = {
        ...tracker,
        blockedAt: new Date(),
        blockedRequests: tracker.requestCount
      };
      
      setBlockedTrackers(prev => [...prev, blockedTracker]);
      setTrackers(prev => prev.filter(t => t.id !== trackerId));
    }
  };

  useEffect(() => {
    // Initialize with some mock data
    generateMockTrackers();
  }, []);

  return {
    trackers,
    blockedTrackers,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    blockTracker
  };
}