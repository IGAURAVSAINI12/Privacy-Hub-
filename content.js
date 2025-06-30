// Enhanced Content Script for Real-time Cookie and Tracker Detection
class RealTimeContentMonitor {
    constructor() {
        this.observers = [];
        this.trackedRequests = new Set();
        this.cookieWatcher = null;
        this.lastCookieString = '';
        this.init();
    }

    init() {
        this.setupNetworkMonitoring();
        this.setupDOMObserver();
        this.setupCookieWatcher();
        this.setupPerformanceObserver();
        this.reportPageLoad();
        console.log('Real-time content monitor initialized');
    }

    setupNetworkMonitoring() {
        // Override fetch API
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            this.analyzeNetworkRequest(args[0]);
            return originalFetch.apply(window, args);
        };

        // Override XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            window.contentMonitor?.analyzeNetworkRequest(url);
            return originalXHROpen.apply(this, [method, url, ...rest]);
        };

        // Monitor image loads (tracking pixels)
        const originalImageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
        if (originalImageSrc) {
            Object.defineProperty(HTMLImageElement.prototype, 'src', {
                set: function(value) {
                    window.contentMonitor?.analyzeNetworkRequest(value);
                    originalImageSrc.set.call(this, value);
                },
                get: originalImageSrc.get
            });
        }

        window.contentMonitor = this;
    }

    setupDOMObserver() {
        // Monitor for dynamically added tracking elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.analyzeElement(node);
                    }
                });
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'href']
        });

        this.observers.push(observer);
    }

    setupCookieWatcher() {
        // Watch for cookie changes using polling (more reliable than events)
        this.lastCookieString = document.cookie;
        
        this.cookieWatcher = setInterval(() => {
            const currentCookies = document.cookie;
            if (currentCookies !== this.lastCookieString) {
                this.analyzeCookieChanges(this.lastCookieString, currentCookies);
                this.lastCookieString = currentCookies;
            }
        }, 1000); // Check every second for real-time detection
    }

    setupPerformanceObserver() {
        // Monitor network requests via Performance API
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.entryType === 'resource') {
                            this.analyzeNetworkRequest(entry.name);
                        }
                    });
                });

                observer.observe({ entryTypes: ['resource'] });
                this.observers.push(observer);
            } catch (error) {
                console.log('PerformanceObserver not supported');
            }
        }
    }

    analyzeNetworkRequest(url) {
        if (!url || typeof url !== 'string') return;
        
        try {
            const urlObj = new URL(url, window.location.origin);
            const domain = urlObj.hostname;
            
            if (this.isTrackingDomain(domain) && !this.trackedRequests.has(url)) {
                this.trackedRequests.add(url);
                
                this.reportToBackground('trackerDetected', {
                    type: 'network_request',
                    domain: domain,
                    url: url,
                    timestamp: Date.now(),
                    page: window.location.href,
                    userAgent: navigator.userAgent
                });
            }
        } catch (error) {
            // Invalid URL, ignore
        }
    }

    analyzeElement(element) {
        // Check scripts
        if (element.tagName === 'SCRIPT') {
            if (element.src) {
                this.analyzeNetworkRequest(element.src);
            }
            
            // Check inline scripts for tracking code
            if (element.textContent) {
                this.analyzeInlineScript(element.textContent);
            }
        }

        // Check images (tracking pixels)
        if (element.tagName === 'IMG' && element.src) {
            if (this.isTrackingPixel(element.src)) {
                this.reportToBackground('trackerDetected', {
                    type: 'tracking_pixel',
                    domain: new URL(element.src, window.location.origin).hostname,
                    url: element.src,
                    timestamp: Date.now(),
                    page: window.location.href
                });
            }
        }

        // Check iframes
        if (element.tagName === 'IFRAME' && element.src) {
            this.analyzeNetworkRequest(element.src);
        }

        // Check links
        if (element.tagName === 'A' && element.href) {
            this.analyzeNetworkRequest(element.href);
        }

        // Recursively check children
        if (element.children && element.children.length > 0) {
            Array.from(element.children).forEach(child => {
                this.analyzeElement(child);
            });
        }
    }

    analyzeInlineScript(scriptContent) {
        const trackingPatterns = [
            'google-analytics.com',
            'googletagmanager.com',
            'facebook.com/tr',
            'doubleclick.net',
            'googlesyndication.com',
            'amazon-adsystem.com',
            'gtag(',
            'ga(',
            'fbq(',
            '_gaq'
        ];

        trackingPatterns.forEach(pattern => {
            if (scriptContent.includes(pattern)) {
                this.reportToBackground('trackerDetected', {
                    type: 'inline_script',
                    domain: pattern,
                    timestamp: Date.now(),
                    page: window.location.href,
                    scriptSnippet: scriptContent.substring(0, 200)
                });
            }
        });
    }

    analyzeCookieChanges(oldCookies, newCookies) {
        const oldCookieMap = this.parseCookies(oldCookies);
        const newCookieMap = this.parseCookies(newCookies);
        
        // Find new cookies
        for (const [name, value] of newCookieMap) {
            if (!oldCookieMap.has(name)) {
                this.reportToBackground('cookieDetected', {
                    name: name,
                    value: value,
                    domain: window.location.hostname,
                    timestamp: Date.now(),
                    page: window.location.href,
                    isNew: true,
                    isThirdParty: this.isThirdPartyCookie(name, value)
                });
            }
        }

        // Find deleted cookies
        for (const [name] of oldCookieMap) {
            if (!newCookieMap.has(name)) {
                this.reportToBackground('cookieDeleted', {
                    name: name,
                    domain: window.location.hostname,
                    timestamp: Date.now(),
                    page: window.location.href
                });
            }
        }
    }

    parseCookies(cookieString) {
        const cookies = new Map();
        if (!cookieString) return cookies;
        
        cookieString.split(';').forEach(cookie => {
            const [name, ...valueParts] = cookie.trim().split('=');
            if (name && valueParts.length > 0) {
                cookies.set(name, valueParts.join('='));
            }
        });
        
        return cookies;
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

    isTrackingPixel(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            const pixelPatterns = [
                'pixel', 'beacon', 'track', 'analytics', 'collect',
                'impression', 'view', 'event', 'conversion'
            ];

            return pixelPatterns.some(pattern => 
                urlObj.pathname.includes(pattern) || 
                urlObj.search.includes(pattern) ||
                urlObj.hostname.includes(pattern)
            );
        } catch (error) {
            return false;
        }
    }

    isThirdPartyCookie(name, value) {
        const thirdPartyPatterns = [
            '_ga', '_gid', '_gat', '__utma', '__utmb', '__utmc', '__utmz',
            'fbp', 'fbclid', '_fbp', 'fr', 'datr',
            'IDE', 'DSID', 'FLC', 'AID', 'TAID',
            'uuid', 'uuid2', 'anj', 'sess', 'usersync'
        ];

        return thirdPartyPatterns.some(pattern => 
            name.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    reportToBackground(action, data) {
        try {
            chrome.runtime.sendMessage({
                action: action,
                data: data
            });
        } catch (error) {
            // Extension context might not be available
            console.log('Could not send message to background:', error);
        }
    }

    reportPageLoad() {
        this.reportToBackground('pageLoaded', {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            referrer: document.referrer,
            userAgent: navigator.userAgent
        });

        // Analyze existing elements on page load
        setTimeout(() => {
            this.analyzeElement(document.documentElement);
        }, 1000);
    }

    destroy() {
        // Clean up observers
        this.observers.forEach(observer => {
            if (observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers = [];

        // Clear cookie watcher
        if (this.cookieWatcher) {
            clearInterval(this.cookieWatcher);
            this.cookieWatcher = null;
        }
    }
}

// Initialize content monitor
let contentMonitor;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        contentMonitor = new RealTimeContentMonitor();
    });
} else {
    contentMonitor = new RealTimeContentMonitor();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (contentMonitor) {
        contentMonitor.destroy();
    }
});