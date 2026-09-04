// ===== API CONFIGURATION =====
// Change this to your actual Worker URL
const API_URL = 'https://usa-ip-database.mshoaib-archnetix.workers.dev';

class IPDatabaseApp {
    constructor() {
        this.currentPage = 1;
        this.searchQuery = '';
        this.init();
    }

    init() {
        console.log('🚀 App initialized');
        console.log('📡 API URL:', API_URL);
        this.setupEventListeners();
        this.loadIPRecords();
        this.updateDashboardStats();
    }

    setupEventListeners() {
        // Upload
        document.getElementById('uploadBtn').addEventListener('click', () => this.uploadIP());
        document.getElementById('ipInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.uploadIP();
        });

        // Search
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Clear Search
        document.getElementById('clearBtn').addEventListener('click', () => this.clearSearch());
    }

    async uploadIP() {
        const ipInput = document.getElementById('ipInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const notificationContainer = document.getElementById('uploadNotification');

        const ipAddress = ipInput.value.trim();

        if (!ipAddress) {
            this.showNotification(
                notificationContainer,
                'error',
                '❌ Empty Input',
                'Please enter an IP address'
            );
            return;
        }

        uploadBtn.disabled = true;
        const originalText = uploadBtn.textContent;
        uploadBtn.textContent = 'Uploading...';

        try {
            const response = await fetch(`${API_URL}/api/upload-ip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ip_address: ipAddress })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(
                    notificationContainer,
                    'success',
                    '✅ Successfully Uploaded',
                    `IP ${ipAddress} added to database`
                );
                ipInput.value = '';
                uploadBtn.textContent = '✅ Uploaded!';

                setTimeout(() => {
                    uploadBtn.textContent = originalText;
                    this.loadIPRecords();
                    this.updateDashboardStats();
                }, 2000);
            } else if (data.status === 'duplicate') {
                this.showNotification(
                    notificationContainer,
                    'warning',
                    '⚠️ Duplicate IP',
                    'This IP is already in the database'
                );
                uploadBtn.textContent = '⚠️ Duplicate!';
            } else if (data.status === 'non_usa') {
                this.showNotification(
                    notificationContainer,
                    'error',
                    '❌ Not a USA IP',
                    'This IP does not belong to the United States'
                );
                uploadBtn.textContent = '❌ Non-USA!';
            } else if (data.status === 'invalid') {
                this.showNotification(
                    notificationContainer,
                    'error',
                    '❌ Invalid IP',
                    'Please enter a valid IP address (e.g., 8.8.8.8)'
                );
                uploadBtn.textContent = '❌ Invalid!';
            } else {
                this.showNotification(
                    notificationContainer,
                    'error',
                    '❌ Error',
                    data.message || 'Something went wrong'
                );
                uploadBtn.textContent = '❌ Error!';
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification(
                notificationContainer,
                'error',
                '❌ Connection Error',
                'Unable to reach the server. Please check your internet connection.'
            );
            uploadBtn.textContent = 'Try Again';
        } finally {
            uploadBtn.disabled = false;

            setTimeout(() => {
                if (!uploadBtn.textContent.includes('✅') &&
                    !uploadBtn.textContent.includes('⚠️') &&
                    !uploadBtn.textContent.includes('❌')) {
                    uploadBtn.textContent = originalText;
                }
            }, 3000);
        }
    }

    async loadIPRecords(page = 1) {
        const tableBody = document.getElementById('ipTableBody');

        if (!tableBody) return;

        try {
            const url = new URL(`${API_URL}/api/ips`);
            url.searchParams.append('page', page);
            if (this.searchQuery) url.searchParams.append('search', this.searchQuery);

            tableBody.innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load records');
            }

            tableBody.innerHTML = '';

            if (data.records.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="empty">No records found</td></tr>';
            } else {
                data.records.forEach(record => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${this.escapeHtml(record.ip_address)}</td>
                        <td>${this.escapeHtml(record.country)}</td>
                        <td>${this.escapeHtml(record.region)}</td>
                        <td>${this.escapeHtml(record.city)}</td>
                        <td>${this.escapeHtml(record.organization)}</td>
                        <td>${this.escapeHtml(record.uploaded_at)}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            this.updatePagination(data.pagination);
            this.currentPage = page;
        } catch (error) {
            console.error('Load records error:', error);
            tableBody.innerHTML = `<tr><td colspan="6" class="empty">⚠️ ${error.message}</td></tr>`;
        }
    }

    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        this.searchQuery = searchInput.value.trim();
        this.currentPage = 1;
        await this.loadIPRecords(1);
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.searchQuery = '';
        this.currentPage = 1;
        this.loadIPRecords(1);
    }

    async updateDashboardStats() {
        try {
            const response = await fetch(`${API_URL}/api/stats`);
            const data = await response.json();

            if (data.success) {
                document.getElementById('totalIPsCount').textContent = data.total_ips || '0';
                document.getElementById('todayUploadCount').textContent = data.today_uploads || '0';
                document.getElementById('duplicateCount').textContent = data.duplicate_attempts || '0';
            }
        } catch (error) {
            console.error('Stats error:', error);
        }
    }

    updatePagination(pagination) {
        const container = document.getElementById('pagination');
        container.innerHTML = '';

        if (pagination.total_pages <= 1) return;

        // Previous button
        if (pagination.page > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '← Previous';
            prevBtn.addEventListener('click', () => this.loadIPRecords(pagination.page - 1));
            container.appendChild(prevBtn);
        }

        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.total_pages, pagination.page + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === pagination.page) {
                pageBtn.classList.add('active');
                pageBtn.disabled = true;
            }
            pageBtn.addEventListener('click', () => this.loadIPRecords(i));
            container.appendChild(pageBtn);
        }

        // Next button
        if (pagination.page < pagination.total_pages) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Next →';
            nextBtn.addEventListener('click', () => this.loadIPRecords(pagination.page + 1));
            container.appendChild(nextBtn);
        }
    }

    showNotification(container, type, title, message) {
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getIcon(type)}</div>
            <div class="notification-content">
                <span class="notification-title">${this.escapeHtml(title)}</span>
                <span class="notification-message">${this.escapeHtml(message)}</span>
            </div>
        `;

        container.innerHTML = '';
        container.appendChild(notification);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '!',
            info: 'ℹ'
        };
        return icons[type] || '○';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new IPDatabaseApp();
});
