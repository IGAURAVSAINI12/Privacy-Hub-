// Enhanced Background Service Worker with REAL Cookie Monitoring from Privacy Extension
class RealCookieMonitor {
    constructor() {
        this.isMonitoring = false;
        this.trackers = new Map();
        this.blockedDomains = new Set();
        this.cookieData = new Map();
        this.requestCount = 0;
        this.cookieUpdateInterval = null;
        this.harmfulPatterns = [
            'doubleclick', 'googleadservices', 'facebook', 'googlesyndication',
            'amazon-adsystem', 'adsystem', 'outbrain', 'taboola', 'criteo',
            'scorecardresearch', 'quantserve', '_gads', 'IDE', 'DSID',
            'googletagmanager', 'google-analytics', 'hotjar', 'mixpanel'
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStoredData();
        this.startRealTimeMonitoring();
        this.startCookieMonitoring();
        console.log('Real Cookie Monitor initialized');
    }

    setupEventListeners() {
        // Listen for messages from popup and content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });

        // Monitor web requests for tracking detection
        chrome.webRequest.onBeforeRequest.addListener(
            (details) => this.handleWebRequest(details),
            { urls: ["<all_urls>"] },
            ["requestBody"]
        );

        // Listen for tab updates to refresh cookie data
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
                this.refreshCookiesForTab(tabId, tab.url);
            }
        });

        // REAL CHROME COOKIE API - Listen for cookie changes
        chrome.cookies.onChanged.addListener((changeInfo) => {
            this.handleRealCookieChange(changeInfo);
        });

        // Extension installation
        chrome.runtime.onInstalled.addListener(() => {
            this.initializeExtension();
        });
    }

    async loadStoredData() {
        try {
            const result = await chrome.storage.local.get([
                'isMonitoring', 'blockedDomains', 'trackers', 'cookieData'
            ]);
            
            this.isMonitoring = result.isMonitoring || false;
            this.blockedDomains = new Set(result.blockedDomains || []);
            
            if (result.trackers) {
                result.trackers.forEach(tracker => {
                    this.trackers.set(tracker.id, tracker);
                });
            }
            
            console.log(`Loaded ${this.trackers.size} trackers and ${this.blockedDomains.size} blocked domains`);
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }

    async saveData() {
        try {
            await chrome.storage.local.set({
                isMonitoring: this.isMonitoring,
                blockedDomains: Array.from(this.blockedDomains),
                trackers: Array.from(this.trackers.values()),
                cookieData: Array.from(this.cookieData.values())
            });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    handleMessage(request, sender, sendResponse) {
        console.log('Background received message:', request.action);
        
        switch (request.action) {
            case 'startMonitoring':
                this.startMonitoring();
                sendResponse({ success: true });
                break;
                
            case 'stopMonitoring':
                this.stopMonitoring();
                sendResponse({ success: true });
                break;
                
            case 'getTrackers':
                sendResponse({ trackers: Array.from(this.trackers.values()) });
                break;
                
            case 'getCookies':
                this.getRealCookies().then(cookies => {
                    console.log(`Sending ${cookies.length} cookies to popup`);
                    sendResponse({ cookies });
                }).catch(error => {
                    console.error('Error getting cookies:', error);
                    sendResponse({ cookies: [], error: error.message });
                });
                break;
                
            case 'deleteCookie':
                this.deleteRealCookie(request.cookieId).then(result => {
                    console.log('Delete cookie result:', result);
                    sendResponse(result);
                }).catch(error => {
                    console.error('Error deleting cookie:', error);
                    sendResponse({ success: false, error: error.message });
                });
                break;
                
            case 'deleteHarmfulCookies':
                this.deleteHarmfulCookies().then(result => {
                    console.log('Delete harmful cookies result:', result);
                    sendResponse(result);
                }).catch(error => {
                    console.error('Error deleting harmful cookies:', error);
                    sendResponse({ success: false, error: error.message });
                });
                break;
                
            case 'blockDomain':
                this.blockDomain(request.domain);
                sendResponse({ success: true });
                break;
                
            case 'getPrivacyScore':
                this.calculatePrivacyScore().then(score => {
                    sendResponse({ score });
                }).catch(error => {
                    console.error('Error calculating privacy score:', error);
                    sendResponse({ score: 75 });
                });
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
    }

    // REAL COOKIE MONITORING FUNCTIONS - Using Chrome Cookies API
    async getRealCookies() {
        try {
            console.log('Getting real cookies from Chrome API...');
            
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            let allCookies = [];
            
            if (tab && tab.url && !tab.url.startsWith('chrome://')) {
                const url = new URL(tab.url);
                console.log('Getting cookies for domain:', url.hostname);
                
                // Get cookies for current domain and all subdomains
                const domainCookies = await chrome.cookies.getAll({ domain: url.hostname });
                const subdomainCookies = await chrome.cookies.getAll({ domain: '.' + url.hostname });
                
                // Combine and deduplicate
                allCookies = [...domainCookies, ...subdomainCookies];
                const uniqueCookies = allCookies.filter((cookie, index, self) => 
                    index === self.findIndex(c => c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path)
                );
                
                allCookies = uniqueCookies;
                console.log(`Found ${domainCookies.length} domain cookies, ${subdomainCookies.length} subdomain cookies, ${allCookies.length} unique`);
            } else {
                // If no valid tab, get all cookies from all domains (limited sample)
                allCookies = await chrome.cookies.getAll({});
                console.log(`No active tab, got ${allCookies.length} cookies from all domains`);
            }
            
            const processedCookies = this.processCookies(allCookies);
            console.log(`Processed ${processedCookies.length} cookies`);
            return processedCookies;
        } catch (error) {
            console.error('Error getting real cookies:', error);
            return [];
        }
    }

    processCookies(cookies) {
        return cookies.map(cookie => {
            const cookieId = `${cookie.domain}_${cookie.name}_${cookie.path || '/'}`;
            const processedCookie = {
                ...cookie,
                id: cookieId,
                isHarmful: this.isHarmfulCookie(cookie),
                isTracking: this.isTrackingCookie(cookie),
                isEssential: this.isEssentialCookie(cookie),
                riskFactors: this.getCookieRiskFactors(cookie),
                detectedAt: new Date().toISOString(),
                expirationDate: cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toLocaleDateString() : 'Session',
                purpose: this.getCookiePurpose(cookie)
            };
            
            // Store in our cache
            this.cookieData.set(cookieId, processedCookie);
            
            return processedCookie;
        });
    }

    async handleRealCookieChange(changeInfo) {
        const cookie = changeInfo.cookie;
        const cookieId = `${cookie.domain}_${cookie.name}_${cookie.path || '/'}`;
        
        if (changeInfo.removed) {
            this.cookieData.delete(cookieId);
            console.log(`Cookie removed: ${cookie.name} from ${cookie.domain}`);
        } else {
            const processedCookie = {
                ...cookie,
                id: cookieId,
                isHarmful: this.isHarmfulCookie(cookie),
                isTracking: this.isTrackingCookie(cookie),
                isEssential: this.isEssentialCookie(cookie),
                riskFactors: this.getCookieRiskFactors(cookie),
                detectedAt: new Date().toISOString(),
                expirationDate: cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toLocaleDateString() : 'Session',
                purpose: this.getCookiePurpose(cookie)
            };
            
            this.cookieData.set(cookieId, processedCookie);
            console.log(`Cookie ${changeInfo.removed ? 'removed' : 'added/updated'}: ${cookie.name} from ${cookie.domain}`);
        }

        await this.saveData();
        
        // Update badge if harmful cookie detected
        if (!changeInfo.removed && this.isHarmfulCookie(cookie)) {
            this.updateBadge();
        }
        
        // Notify popup if open
        this.notifyPopup('cookieUpdate', {
            cookie: changeInfo.cookie,
            removed: changeInfo.removed
        });
    }

    async deleteRealCookie(cookieId) {
        try {
            console.log('Attempting to delete cookie:', cookieId);
            
            const cookie = this.cookieData.get(cookieId);
            if (!cookie) {
                console.error('Cookie not found in cache:', cookieId);
                return { success: false, error: 'Cookie not found in cache' };
            }

            console.log('Cookie to delete:', cookie);

            // Construct proper URL for cookie removal
            const protocol = cookie.secure ? 'https://' : 'http://';
            let domain = cookie.domain;
            
            // Handle domain formatting
            if (domain.startsWith('.')) {
                domain = domain.substring(1);
            }
            
            const url = `${protocol}${domain}${cookie.path || '/'}`;
            console.log('Deletion URL:', url);

            const removeDetails = {
                url: url,
                name: cookie.name
            };

            // Add storeId if available
            if (cookie.storeId) {
                removeDetails.storeId = cookie.storeId;
            }

            console.log('Remove details:', removeDetails);

            const removedCookie = await chrome.cookies.remove(removeDetails);
            
            if (removedCookie) {
                this.cookieData.delete(cookieId);
                await this.saveData();
                console.log(`Successfully deleted cookie: ${cookie.name} from ${cookie.domain}`);
                return { success: true };
            } else {
                console.error('Chrome API returned null for cookie removal');
                return { success: false, error: 'Cookie removal failed - cookie may not exist or be protected' };
            }
        } catch (error) {
            console.error('Error deleting cookie:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteHarmfulCookies() {
        try {
            console.log('Starting harmful cookie deletion process...');
            
            const cookies = await this.getRealCookies();
            const harmfulCookies = cookies.filter(cookie => cookie.isHarmful);
            let deletedCount = 0;
            let errors = [];

            console.log(`Found ${harmfulCookies.length} harmful cookies to delete`);

            for (const cookie of harmfulCookies) {
                try {
                    console.log(`Deleting harmful cookie: ${cookie.name} from ${cookie.domain}`);
                    
                    const protocol = cookie.secure ? 'https://' : 'http://';
                    let domain = cookie.domain;
                    
                    if (domain.startsWith('.')) {
                        domain = domain.substring(1);
                    }
                    
                    const url = `${protocol}${domain}${cookie.path || '/'}`;
                    
                    const removeDetails = {
                        url: url,
                        name: cookie.name
                    };

                    if (cookie.storeId) {
                        removeDetails.storeId = cookie.storeId;
                    }

                    const removedCookie = await chrome.cookies.remove(removeDetails);
                    
                    if (removedCookie) {
                        this.cookieData.delete(cookie.id);
                        deletedCount++;
                        console.log(`Successfully deleted harmful cookie: ${cookie.name}`);
                    } else {
                        const errorMsg = `Failed to delete ${cookie.name} - may be protected`;
                        errors.push(errorMsg);
                        console.warn(errorMsg);
                    }
                } catch (error) {
                    const errorMsg = `${cookie.name}: ${error.message}`;
                    console.error(`Error deleting cookie ${cookie.name}:`, error);
                    errors.push(errorMsg);
                }
            }

            await this.saveData();
            this.updateBadge();
            
            const result = { 
                success: true, 
                deletedCount,
                totalHarmful: harmfulCookies.length,
                errors: errors.length > 0 ? errors : null
            };
            
            console.log('Harmful cookie deletion completed:', result);
            return result;
        } catch (error) {
            console.error('Error in deleteHarmfulCookies:', error);
            return { success: false, error: error.message };
        }
    }

    startCookieMonitoring() {
        // Refresh cookie data every 3 seconds for real-time updates
        this.cookieUpdateInterval = setInterval(async () => {
            if (this.isMonitoring) {
                await this.getRealCookies();
                this.updateBadge();
            }
        }, 3000);
        
        console.log('Cookie monitoring started');
    }

    async refreshCookiesForTab(tabId, url) {
        if (!url || url.startsWith('chrome://')) return;

        try {
            const urlObj = new URL(url);
            const cookies = await chrome.cookies.getAll({ domain: urlObj.hostname });
            
            cookies.forEach(cookie => {
                const cookieId = `${cookie.domain}_${cookie.name}_${cookie.path || '/'}`;
                const processedCookie = {
                    ...cookie,
                    id: cookieId,
                    isHarmful: this.isHarmfulCookie(cookie),
                    isTracking: this.isTrackingCookie(cookie),
                    isEssential: this.isEssentialCookie(cookie),
                    riskFactors: this.getCookieRiskFactors(cookie),
                    detectedAt: new Date().toISOString(),
                    expirationDate: cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toLocaleDateString() : 'Session',
                    purpose: this.getCookiePurpose(cookie)
                };
                
                this.cookieData.set(cookieId, processedCookie);
            });

            await this.saveData();
            console.log(`Refreshed ${cookies.length} cookies for ${urlObj.hostname}`);
        } catch (error) {
            console.error('Error refreshing cookies:', error);
        }
    }

    handleWebRequest(details) {
        if (!this.isMonitoring) return;

        try {
            const url = new URL(details.url);
            const domain = url.hostname;
            
            this.requestCount++;

            // Check if this is a tracking request
            if (this.isTrackingDomain(domain)) {
                this.recordTracker(domain, details);
                
                // Block if domain is in blocklist
                if (this.blockedDomains.has(domain)) {
                    console.log(`Blocked request to: ${domain}`);
                    return { cancel: true };
                }
            }
        } catch (error) {
            // Invalid URL, ignore
        }
    }

    isTrackingDomain(domain) {
        const trackingDomains = [
            'google-analytics.com', 'googletagmanager.com', 'doubleclick.net',
            'facebook.com', 'connect.facebook.net', 'amazon-adsystem.com',
            'googlesyndication.com', 'outbrain.com', 'taboola.com', 'criteo.com',
            'scorecardresearch.com', 'quantserve.com', 'adsystem.amazon.com',
            'googleadservices.com', 'bing.com', 'yahoo.com', 'twitter.com',
            'linkedin.com', 'pinterest.com', 'hotjar.com', 'mixpanel.com', 'segment.com'
        ];

        return trackingDomains.some(tracker => 
            domain.includes(tracker) || tracker.includes(domain)
        );
    }

    recordTracker(domain, details, type = 'network_request') {
        const trackerId = domain;
        
        if (this.trackers.has(trackerId)) {
            const tracker = this.trackers.get(trackerId);
            tracker.requests++;
            tracker.lastSeen = new Date().toISOString();
        } else {
            const tracker = {
                id: trackerId,
                name: this.getTrackerName(domain),
                domain: domain,
                type: this.getTrackerType(domain),
                riskLevel: this.getTrackerRiskLevel(domain),
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                requests: 1,
                blocked: this.blockedDomains.has(domain),
                detectionType: type,
                dataCollected: this.getTrackerDataTypes(domain)
            };
            
            this.trackers.set(trackerId, tracker);
        }

        this.saveData();
        
        // Notify popup of new tracker
        this.notifyPopup('trackerUpdate', {
            tracker: this.trackers.get(trackerId)
        });
    }

    getTrackerName(domain) {
        const trackerNames = {
            'google-analytics.com': 'Google Analytics',
            'googletagmanager.com': 'Google Tag Manager',
            'doubleclick.net': 'DoubleClick',
            'facebook.com': 'Facebook Pixel',
            'connect.facebook.net': 'Facebook SDK',
            'amazon-adsystem.com': 'Amazon Advertising',
            'googlesyndication.com': 'Google AdSense',
            'outbrain.com': 'Outbrain',
            'taboola.com': 'Taboola',
            'criteo.com': 'Criteo',
            'googleadservices.com': 'Google Ads'
        };

        for (const [key, name] of Object.entries(trackerNames)) {
            if (domain.includes(key)) return name;
        }

        return domain.charAt(0).toUpperCase() + domain.slice(1);
    }

    getTrackerType(domain) {
        if (domain.includes('analytics') || domain.includes('tag')) return 'analytics';
        if (domain.includes('ads') || domain.includes('doubleclick') || domain.includes('adsystem')) return 'advertising';
        if (domain.includes('facebook') || domain.includes('twitter') || domain.includes('linkedin')) return 'social';
        if (domain.includes('fingerprint')) return 'fingerprinting';
        return 'other';
    }

    getTrackerRiskLevel(domain) {
        const highRiskDomains = ['doubleclick.net', 'facebook.com', 'criteo.com', 'outbrain.com', 'taboola.com'];
        const mediumRiskDomains = ['google-analytics.com', 'googletagmanager.com', 'amazon-adsystem.com'];
        
        if (highRiskDomains.some(d => domain.includes(d))) return 'high';
        if (mediumRiskDomains.some(d => domain.includes(d))) return 'medium';
        return 'low';
    }

    getTrackerDataTypes(domain) {
        const dataTypes = {
            'google-analytics.com': ['Page views', 'User interactions', 'Device info', 'Location'],
            'facebook.com': ['Social interactions', 'Profile data', 'Custom events', 'Conversions'],
            'doubleclick.net': ['Browsing history', 'Ad interactions', 'Demographics', 'Interests'],
            'amazon-adsystem.com': ['Shopping behavior', 'Product views', 'Purchase history']
        };

        for (const [key, data] of Object.entries(dataTypes)) {
            if (domain.includes(key)) return data;
        }

        return ['User behavior', 'Page interactions'];
    }

    isHarmfulCookie(cookie) {
        return this.harmfulPatterns.some(pattern => 
            cookie.name.toLowerCase().includes(pattern) || 
            cookie.domain.toLowerCase().includes(pattern)
        );
    }

    isTrackingCookie(cookie) {
        const trackingPatterns = [
            'analytics', 'tracking', '_ga', '_gid', 'utm_', 'fbp', 'fbclid',
            '_gat', '__utma', '__utmb', '__utmc', '__utmz', '_hjid', 'gtm'
        ];
        
        return trackingPatterns.some(pattern => 
            cookie.name.toLowerCase().includes(pattern)
        );
    }

    isEssentialCookie(cookie) {
        const essentialPatterns = [
            'session', 'auth', 'login', 'csrf', 'preferences', 'consent',
            'security', 'cart', 'checkout', 'lang', 'theme', 'user'
        ];
        
        return essentialPatterns.some(pattern => 
            cookie.name.toLowerCase().includes(pattern)
        );
    }

    getCookieRiskFactors(cookie) {
        const riskFactors = [];
        
        if (this.isHarmfulCookie(cookie)) {
            riskFactors.push('Associated with known tracking network');
        }
        
        if (cookie.domain.startsWith('.')) {
            riskFactors.push('Third-party cookie (cross-site tracking)');
        }
        
        if (!cookie.httpOnly) {
            riskFactors.push('Accessible via JavaScript (XSS risk)');
        }
        
        if (!cookie.secure && !cookie.domain.includes('localhost')) {
            riskFactors.push('Not secure (can be intercepted)');
        }
        
        if (cookie.sameSite === 'none' || !cookie.sameSite) {
            riskFactors.push('No SameSite protection');
        }
        
        return riskFactors;
    }

    getCookiePurpose(cookie) {
        if (this.isHarmfulCookie(cookie)) {
            return 'Cross-site tracking and advertising';
        }
        if (this.isTrackingCookie(cookie)) {
            return 'Analytics and user tracking';
        }
        if (this.isEssentialCookie(cookie)) {
            return 'Essential website functionality';
        }
        return 'General website functionality';
    }

    async calculatePrivacyScore() {
        const cookies = await this.getRealCookies();
        const harmfulCount = cookies.filter(c => c.isHarmful).length;
        const trackingCount = cookies.filter(c => c.isTracking).length;
        const trackerCount = Array.from(this.trackers.values()).filter(t => !t.blocked).length;
        
        let score = 100;
        score -= harmfulCount * 10;
        score -= trackingCount * 5;
        score -= trackerCount * 8;
        
        return Math.max(0, Math.min(100, score));
    }

    updateBadge() {
        const harmfulCount = Array.from(this.cookieData.values()).filter(c => c.isHarmful).length;
        const trackerCount = this.trackers.size;
        const totalThreats = harmfulCount + trackerCount;
        
        if (totalThreats > 0) {
            chrome.action.setBadgeText({ text: totalThreats.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#f56565' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
    }

    startRealTimeMonitoring() {
        // Start periodic updates
        setInterval(async () => {
            if (this.isMonitoring) {
                await this.saveData();
                this.updateBadge();
            }
        }, 5000);
    }

    startMonitoring() {
        this.isMonitoring = true;
        this.saveData();
        
        chrome.action.setBadgeText({ text: 'ON' });
        chrome.action.setBadgeBackgroundColor({ color: '#48bb78' });
        
        console.log('Real-time monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        this.saveData();
        
        chrome.action.setBadgeText({ text: '' });
        
        console.log('Real-time monitoring stopped');
    }

    blockDomain(domain) {
        this.blockedDomains.add(domain);
        this.saveData();
        
        if (this.trackers.has(domain)) {
            this.trackers.get(domain).blocked = true;
        }
        
        console.log(`Blocked domain: ${domain}`);
    }

    notifyPopup(type, data) {
        // Try to send message to popup (will fail silently if popup is closed)
        chrome.runtime.sendMessage({
            action: 'backgroundUpdate',
            type: type,
            data: data
        }).catch(() => {
            // Popup not open, ignore
        });
    }

    initializeExtension() {
        console.log('Chainlink Privacy Hub extension installed with REAL cookie monitoring');
        
        chrome.action.setBadgeText({ text: '' });
        
        // Start monitoring by default
        this.isMonitoring = true;
        this.saveData();
        
        // Initialize storage
        chrome.storage.local.set({
            isMonitoring: true,
            trackers: [],
            cookieData: [],
            privacyScore: 75
        });
    }
}

// Initialize background service
new RealCookieMonitor();