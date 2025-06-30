// Enhanced Popup JavaScript with COMPLETELY FIXED MetaMask Detection
class RealTimeChainlinkPrivacyHub {
    constructor() {
        this.isMonitoring = false;
        this.cookies = [];
        this.trackers = [];
        this.privacyScore = 75;
        this.updateInterval = null;
        this.isScanning = false;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupTabs();
        await this.loadData();
        this.updateUI();
        this.startRealTimeUpdates();
        this.setupBackgroundListener();
        
        // Auto-scan cookies on startup
        await this.scanRealCookies();
    }

    setupEventListeners() {
        // MetaMask switch button
        document.getElementById('switchToMetaMaskBtn').addEventListener('click', () => {
            this.openMetaMaskPage();
        });

        // Cookie management
        document.getElementById('scanCookiesBtn').addEventListener('click', () => {
            this.scanRealCookies();
        });

        document.getElementById('deleteHarmfulBtn').addEventListener('click', () => {
            this.deleteHarmfulCookies();
        });

        // Tracker monitoring
        document.getElementById('toggleMonitoringBtn').addEventListener('click', () => {
            this.toggleMonitoring();
        });
    }

    openMetaMaskPage() {
        console.log('🚀 Opening MetaMask connection page...');
        
        // Create the connection page URL
        const connectionPageUrl = chrome.runtime.getURL('connection.html');
        
        // Open in new tab
        chrome.tabs.create({ 
            url: connectionPageUrl,
            active: true 
        });
    }

    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
                
                // Refresh data when switching to specific tabs
                if (targetTab === 'cookies') {
                    this.loadRealCookies();
                } else if (targetTab === 'trackers') {
                    this.loadTrackers();
                }
            });
        });
    }

    setupBackgroundListener() {
        // Listen for real-time updates from background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'backgroundUpdate') {
                this.handleBackgroundUpdate(request.type, request.data);
            }
        });
    }

    handleBackgroundUpdate(type, data) {
        switch (type) {
            case 'cookieUpdate':
                this.loadRealCookies();
                break;
            case 'trackerUpdate':
                this.loadTrackers();
                break;
        }
    }

    async loadData() {
        await Promise.all([
            this.loadRealCookies(),
            this.loadTrackers(),
            this.loadPrivacyScore(),
            this.loadMonitoringStatus()
        ]);
    }

    async loadRealCookies() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getCookies' });
            this.cookies = response.cookies || [];
            this.updateCookiesUI();
            console.log(`Loaded ${this.cookies.length} real cookies from Chrome API`);
        } catch (error) {
            console.error('Error loading real cookies:', error);
            this.showError('Failed to load cookies');
        }
    }

    async loadTrackers() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getTrackers' });
            this.trackers = response.trackers || [];
            this.updateTrackersUI();
        } catch (error) {
            console.error('Error loading trackers:', error);
        }
    }

    async loadPrivacyScore() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getPrivacyScore' });
            this.privacyScore = response.score || 75;
            this.updatePrivacyScore();
        } catch (error) {
            console.error('Error loading privacy score:', error);
        }
    }

    async loadMonitoringStatus() {
        try {
            const result = await chrome.storage.local.get(['isMonitoring']);
            this.isMonitoring = result.isMonitoring || false;
            this.updateMonitoringUI();
        } catch (error) {
            console.error('Error loading monitoring status:', error);
        }
    }

    async scanRealCookies() {
        if (this.isScanning) return;
        
        const scanBtn = document.getElementById('scanCookiesBtn');
        const originalText = scanBtn.textContent;
        
        this.isScanning = true;
        scanBtn.textContent = 'Scanning...';
        scanBtn.disabled = true;
        
        try {
            console.log('Starting real cookie scan...');
            
            const response = await chrome.runtime.sendMessage({ action: 'getCookies' });
            
            if (response && response.cookies) {
                this.cookies = response.cookies;
                this.updateCookiesUI();
                
                const harmfulCount = this.cookies.filter(c => c.isHarmful).length;
                const trackingCount = this.cookies.filter(c => c.isTracking).length;
                
                this.showSuccess(`Scan complete! Found ${this.cookies.length} cookies (${harmfulCount} harmful, ${trackingCount} tracking)`);
            } else {
                this.showError('No response from background script');
            }
        } catch (error) {
            console.error('Cookie scan error:', error);
            this.showError('Failed to scan cookies: ' + error.message);
        } finally {
            this.isScanning = false;
            scanBtn.textContent = originalText;
            scanBtn.disabled = false;
        }
    }

    async deleteHarmfulCookies() {
        const deleteBtn = document.getElementById('deleteHarmfulBtn');
        const originalText = deleteBtn.textContent;
        
        deleteBtn.textContent = 'Deleting...';
        deleteBtn.disabled = true;
        
        try {
            const response = await chrome.runtime.sendMessage({ action: 'deleteHarmfulCookies' });
            
            if (response && response.success) {
                await this.loadRealCookies();
                await this.loadPrivacyScore();
                
                let message = `Successfully deleted ${response.deletedCount}`;
                if (response.totalHarmful) {
                    message += ` of ${response.totalHarmful} harmful cookies`;
                }
                if (response.errors && response.errors.length > 0) {
                    message += ` (${response.errors.length} errors)`;
                }
                
                this.showSuccess(message);
            } else {
                const errorMsg = response?.error || 'Unknown error occurred';
                this.showError('Failed to delete harmful cookies: ' + errorMsg);
            }
        } catch (error) {
            console.error('Delete harmful cookies error:', error);
            this.showError('Error deleting harmful cookies: ' + error.message);
        } finally {
            deleteBtn.textContent = originalText;
            deleteBtn.disabled = false;
        }
    }

    async deleteSingleCookie(cookieId) {
        try {
            const response = await chrome.runtime.sendMessage({ 
                action: 'deleteCookie', 
                cookieId: cookieId 
            });
            
            if (response && response.success) {
                this.cookies = this.cookies.filter(c => c.id !== cookieId);
                this.updateCookiesUI();
                this.showSuccess('Cookie deleted successfully');
            } else {
                const errorMsg = response?.error || 'Unknown error occurred';
                this.showError('Failed to delete cookie: ' + errorMsg);
            }
        } catch (error) {
            console.error('Single cookie deletion error:', error);
            this.showError('Error deleting cookie: ' + error.message);
        }
    }

    async toggleMonitoring() {
        try {
            const action = this.isMonitoring ? 'stopMonitoring' : 'startMonitoring';
            await chrome.runtime.sendMessage({ action });
            
            this.isMonitoring = !this.isMonitoring;
            await chrome.storage.local.set({ isMonitoring: this.isMonitoring });
            
            this.updateMonitoringUI();
            this.showSuccess(`Real-time monitoring ${this.isMonitoring ? 'started' : 'stopped'}`);
        } catch (error) {
            this.showError('Failed to toggle monitoring');
        }
    }

    updateUI() {
        this.updatePrivacyScore();
        this.updateCookiesUI();
        this.updateTrackersUI();
        this.updateMonitoringUI();
    }

    updatePrivacyScore() {
        const scoreValue = document.getElementById('scoreValue');
        const scoreLabel = document.getElementById('scoreLabel');
        
        scoreValue.textContent = Math.round(this.privacyScore);
        
        if (this.privacyScore >= 80) {
            scoreLabel.textContent = 'Excellent';
        } else if (this.privacyScore >= 60) {
            scoreLabel.textContent = 'Good';
        } else {
            scoreLabel.textContent = 'Needs Attention';
        }
    }

    updateCookiesUI() {
        const totalCookies = document.getElementById('totalCookies');
        const harmfulCookies = document.getElementById('harmfulCookies');
        const trackingCookies = document.getElementById('trackingCookies');
        const cookiesList = document.getElementById('cookiesList');
        
        const harmfulCount = this.cookies.filter(c => c.isHarmful).length;
        const trackingCount = this.cookies.filter(c => c.isTracking).length;
        
        totalCookies.textContent = this.cookies.length;
        harmfulCookies.textContent = harmfulCount;
        trackingCookies.textContent = trackingCount;
        
        if (this.cookies.length === 0) {
            cookiesList.innerHTML = '<div class="empty-state">No cookies found. Visit a website and click "Scan" to see real cookies from Chrome API.</div>';
            return;
        }
        
        const html = this.cookies.slice(0, 20).map(cookie => `
            <div class="list-item ${cookie.isHarmful ? 'harmful' : cookie.isTracking ? 'tracking' : ''}">
                <div class="item-info">
                    <div class="item-name">${this.escapeHtml(cookie.name)}</div>
                    <div class="item-details">${this.escapeHtml(cookie.domain)}${cookie.riskFactors && cookie.riskFactors.length > 0 ? ` • ${cookie.riskFactors.length} risk factors` : ''}</div>
                    ${cookie.expirationDate ? `<div class="item-details">Expires: ${cookie.expirationDate}</div>` : ''}
                    ${cookie.purpose ? `<div class="item-details">Purpose: ${this.escapeHtml(cookie.purpose)}</div>` : ''}
                </div>
                <div class="item-actions">
                    ${cookie.isHarmful ? '<span class="btn-small btn-danger">Harmful</span>' : ''}
                    ${cookie.isTracking && !cookie.isHarmful ? '<span class="btn-small" style="background: #ffa500; color: white;">Tracking</span>' : ''}
                    ${cookie.isEssential ? '<span class="btn-small" style="background: #48bb78; color: white;">Essential</span>' : ''}
                    <button class="btn-small btn-danger delete-cookie-btn" data-cookie-id="${this.escapeHtml(cookie.id)}">Delete</button>
                </div>
            </div>
        `).join('');
        
        cookiesList.innerHTML = html;
        
        // Add event listeners for delete buttons
        const deleteButtons = cookiesList.querySelectorAll('.delete-cookie-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cookieId = btn.getAttribute('data-cookie-id');
                this.deleteSingleCookie(cookieId);
            });
        });
    }

    updateTrackersUI() {
        const totalTrackers = document.getElementById('totalTrackers');
        const blockedTrackers = document.getElementById('blockedTrackers');
        const highRiskTrackers = document.getElementById('highRiskTrackers');
        const trackersList = document.getElementById('trackersList');
        
        const blockedCount = this.trackers.filter(t => t.blocked).length;
        const highRiskCount = this.trackers.filter(t => t.riskLevel === 'high').length;
        
        totalTrackers.textContent = this.trackers.length;
        blockedTrackers.textContent = blockedCount;
        highRiskTrackers.textContent = highRiskCount;
        
        if (this.trackers.length === 0) {
            trackersList.innerHTML = '<div class="empty-state">No trackers detected. Start monitoring and visit websites to detect real trackers.</div>';
            return;
        }
        
        const html = this.trackers.slice(0, 8).map(tracker => `
            <div class="list-item ${tracker.riskLevel === 'high' ? 'harmful' : ''}">
                <div class="item-info">
                    <div class="item-name">${this.escapeHtml(tracker.name)}</div>
                    <div class="item-details">${this.escapeHtml(tracker.domain)} • ${tracker.requests} requests • ${tracker.type}</div>
                    <div class="item-details">First seen: ${new Date(tracker.firstSeen).toLocaleTimeString()}</div>
                </div>
                <div class="item-actions">
                    <span class="btn-small ${tracker.riskLevel === 'high' ? 'btn-danger' : tracker.riskLevel === 'medium' ? 'btn-secondary' : 'btn-secondary'}">${tracker.riskLevel.toUpperCase()}</span>
                    ${!tracker.blocked ? 
                        `<button class="btn-small btn-danger block-tracker-btn" data-domain="${this.escapeHtml(tracker.domain)}">Block</button>` : 
                        '<span class="btn-small" style="background: #48bb78; color: white;">Blocked</span>'
                    }
                </div>
            </div>
        `).join('');
        
        trackersList.innerHTML = html;
        
        // Add event listeners for block buttons
        const blockButtons = trackersList.querySelectorAll('.block-tracker-btn');
        blockButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const domain = btn.getAttribute('data-domain');
                this.blockTracker(domain);
            });
        });
    }

    async blockTracker(domain) {
        try {
            await chrome.runtime.sendMessage({ action: 'blockDomain', domain });
            this.loadTrackers();
            this.showSuccess(`Blocked ${domain}`);
        } catch (error) {
            this.showError('Error blocking tracker');
        }
    }

    updateMonitoringUI() {
        const toggleBtn = document.getElementById('toggleMonitoringBtn');
        const statusIndicator = document.getElementById('statusIndicator');
        
        if (this.isMonitoring) {
            toggleBtn.textContent = 'Stop Monitoring';
            toggleBtn.classList.remove('btn-primary');
            toggleBtn.classList.add('btn-danger');
            statusIndicator.querySelector('.status-text').textContent = 'Active';
            statusIndicator.querySelector('.status-dot').style.background = '#48bb78';
        } else {
            toggleBtn.textContent = 'Start Monitoring';
            toggleBtn.classList.remove('btn-danger');
            toggleBtn.classList.add('btn-primary');
            statusIndicator.querySelector('.status-text').textContent = 'Inactive';
            statusIndicator.querySelector('.status-dot').style.background = '#a0aec0';
        }
    }

    startRealTimeUpdates() {
        // Update data every 5 seconds for real-time monitoring
        this.updateInterval = setInterval(async () => {
            if (this.isMonitoring) {
                await this.loadData();
            }
        }, 5000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${type === 'error' ? '#f56565' : '#48bb78'};
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 1000;
            font-size: 12px;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    }
}

// Initialize the extension when popup loads
document.addEventListener('DOMContentLoaded', () => {
    window.privacyHub = new RealTimeChainlinkPrivacyHub();
});