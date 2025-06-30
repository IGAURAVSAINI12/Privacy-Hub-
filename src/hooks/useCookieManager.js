import { useState, useEffect } from 'react';

export function useCookieManager() {
  const [cookies, setCookies] = useState([]);
  const [harmfulCookies, setHarmfulCookies] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  // Mock harmful cookie patterns
  const harmfulPatterns = [
    'doubleclick', 'googleadservices', 'facebook', 'googlesyndication',
    'amazon-adsystem', 'adsystem', 'outbrain', 'taboola', 'criteo'
  ];

  const trackingPatterns = [
    'analytics', 'tracking', '_ga', '_gid', 'utm_', 'fbp', 'fbclid'
  ];

  const generateMockCookies = () => {
    const mockCookies = [
      {
        id: '1',
        name: '_ga',
        domain: '.google-analytics.com',
        value: 'GA1.2.123456789.1234567890',
        expirationDate: '2025-12-31',
        isHarmful: false,
        isTracking: true,
        isEssential: false,
        purpose: 'Google Analytics tracking'
      },
      {
        id: '2',
        name: 'doubleclick_id',
        domain: '.doubleclick.net',
        value: 'abc123def456',
        expirationDate: '2025-06-15',
        isHarmful: true,
        isTracking: true,
        isEssential: false,
        purpose: 'Cross-site advertising tracking',
        riskFactors: [
          'Tracks users across multiple websites',
          'Builds detailed behavioral profiles',
          'Shares data with third parties'
        ]
      },
      {
        id: '3',
        name: 'session_token',
        domain: 'localhost',
        value: 'sess_xyz789',
        expirationDate: null,
        isHarmful: false,
        isTracking: false,
        isEssential: true,
        purpose: 'User session management'
      },
      {
        id: '4',
        name: 'fb_tracking',
        domain: '.facebook.com',
        value: 'fb_track_123',
        expirationDate: '2025-03-20',
        isHarmful: true,
        isTracking: true,
        isEssential: false,
        purpose: 'Facebook cross-site tracking',
        riskFactors: [
          'Tracks social media interactions',
          'Links browsing to social profile',
          'Enables targeted advertising'
        ]
      },
      {
        id: '5',
        name: 'preferences',
        domain: 'localhost',
        value: 'theme=dark&lang=en',
        expirationDate: '2026-01-01',
        isHarmful: false,
        isTracking: false,
        isEssential: true,
        purpose: 'User preferences storage'
      }
    ];

    setCookies(mockCookies);
    setHarmfulCookies(mockCookies.filter(cookie => cookie.isHarmful));
  };

  const scanCookies = async () => {
    setIsScanning(true);
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // In a real implementation, this would scan actual browser cookies
      generateMockCookies();
    } catch (error) {
      console.error('Error scanning cookies:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const deleteCookie = async (cookieId) => {
    try {
      // In a real implementation, this would delete the actual cookie
      setCookies(prev => prev.filter(cookie => cookie.id !== cookieId));
      setHarmfulCookies(prev => prev.filter(cookie => cookie.id !== cookieId));
      
      console.log(`Cookie ${cookieId} deleted`);
    } catch (error) {
      console.error('Error deleting cookie:', error);
    }
  };

  const deleteAllHarmful = async () => {
    try {
      const harmfulIds = harmfulCookies.map(cookie => cookie.id);
      setCookies(prev => prev.filter(cookie => !harmfulIds.includes(cookie.id)));
      setHarmfulCookies([]);
      
      console.log(`Deleted ${harmfulIds.length} harmful cookies`);
    } catch (error) {
      console.error('Error deleting harmful cookies:', error);
    }
  };

  useEffect(() => {
    // Initial scan
    generateMockCookies();
  }, []);

  return {
    cookies,
    harmfulCookies,
    isScanning,
    scanCookies,
    deleteCookie,
    deleteAllHarmful
  };
}