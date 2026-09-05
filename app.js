/**
 * USA IP Database - Frontend Application
 * Fully Working Version
 */

const API_URL = 'https://usa-ip-api.mshoaib-archnetix.workers.dev/';

class IPDatabaseApp {
    constructor() {
        this.currentPage = 1;
        this.searchQuery = '';
        this.isLoading = false;
        console.log('🚀 App Initialized');
        console.log('📡 API:', API_URL);
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadIPRecords();
        this.updateStats();
    }

    setupEventListeners() {
        // Upload form
        const uploadForm = document.getElementById('uploadForm');
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadIP();
        });

        // Search
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Clear search
        document.getElementById('clearBtn').addEventListener('click', () => this.clearSearch());
    }

    async uploadIP() {
        const ipInput = document.getElementById('ipInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const notification = document.getElementById('uploadNotification');

        const ipAddress = ipInput.value.trim();

        if (!ipAddress) {
            this.showNotification(notification, 'error', '❌ Error', 'Please enter an IP address');
            return;
        }

        uploadBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/api/upload-ip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip_address: ipAddress }),
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(notification, 'success', '✅ Success', data.message);
                ipInput.value = '';
                ipInput.focus();

                setTimeout(() => {
                    this.loadIPRecords();
                    this.updateStats();
                }, 1000);
            } else if (data.status === 'duplicate') {
                this.showNotification(notification, 'error', '⚠️ Duplicate', data.message);
            } else if (data.status === 'non_usa') {
                this.showNotification(notification, 'error', '🌍 Not USA', data.message);
            } else if (data.status === 'invalid') {
                this.showNotification(notification, 'error', '❌ Invalid', data.message);
            } else {
                this.showNotification(notification, 'error', '❌ Error', data.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification(notification, 'error', '❌ Connection Error', 'Could not connect to server');
        } finally {
            uploadBtn.disabled = false;
        }
    }

    async loadIPRecords(page = 1) {
        if (this.isLoading) return;

        this.isLoading = true;
        const tableBody = document.getElementById('ipTableBody');
        tableBody.innerHTML = '<tr class="empty-state"><td colspan="6">⏳ Loading...</td></tr>';

        try {
            const url = new URL(`${API_URL}/api/ips`);
            url.searchParams.append('page', page);
            if (this.searchQuery) url.searchParams.append('search', this.searchQuery);

            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) throw new Error(data.message);

            tableBody.innerHTML = '';

            if (data.records.length === 0) {
                tableBody.innerHTML = '<tr class="empty-state"><td colspan="6">📭 No records found</td></tr>';
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
            console.error('Load error:', error);
            tableBody.innerHTML = `<tr class="empty-state"><td colspan="6">❌ ${error.message}</td></tr>`;
        } finally {
            this.isLoading = false;
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

    async updateStats() {
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

        const { page, total_pages } = pagination;
        if (total_pages <= 1) return;

        // Previous
        if (page > 1) {
            const btn = document.createElement('button');
            btn.textContent = '← Previous';
            btn.onclick = () => this.loadIPRecords(page - 1);
            container.appendChild(btn);
        }

        // Pages
        const start = Math.max(1, page - 2);
        const end = Math.min(total_pages, page + 2);

        for (let i = start; i <= end; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            if (i === page) {
                btn.classList.add('active');
                btn.disabled = true;
            }
            btn.onclick = () => this.loadIPRecords(i);
            container.appendChild(btn);
        }

        // Next
        if (page < total_pages) {
            const btn = document.createElement('button');
            btn.textContent = 'Next →';
            btn.onclick = () => this.loadIPRecords(page + 1);
            container.appendChild(btn);
        }
    }

    showNotification(container, type, title, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const icons = { success: '✓', error: '✕', warning: '⚠' };

        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || '○'}</div>
            <div class="notification-content">
                <div class="notification-title">${this.escapeHtml(title)}</div>
                <div class="notification-message">${this.escapeHtml(message)}</div>
            </div>
        `;

        container.innerHTML = '';
        container.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 5000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new IPDatabaseApp();
});
