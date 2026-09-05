/**
 * USA IP Database - Frontend
 * BILKUL WORKING VERSION
 */

// ✅ CORRECT WORKER URL
const API_URL = 'https://usa-ip-api.mshoaib-archnetix.workers.dev';

class IPDatabase {
    constructor() {
        this.page = 1;
        this.searchQuery = '';
        this.init();
    }

    init() {
        console.log('✅ App Started');
        console.log('📡 Worker URL:', API_URL);
        this.attachListeners();
        this.loadRecords();
        this.loadStats();
    }

    attachListeners() {
        // Upload
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadIP();
        });

        // Search
        document.getElementById('searchBtn').addEventListener('click', () => this.search());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });

        // Clear
        document.getElementById('clearBtn').addEventListener('click', () => this.clearSearch());
    }

    async uploadIP() {
        const ipInput = document.getElementById('ipInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const notification = document.getElementById('uploadNotification');

        const ip = ipInput.value.trim();

        if (!ip) {
            this.showNotification(notification, 'error', '❌ Error: Please enter an IP address');
            return;
        }

        uploadBtn.disabled = true;

        try {
            console.log('📤 Uploading IP:', ip);

            const response = await fetch(`${API_URL}/api/upload-ip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip_address: ip }),
            });

            const data = await response.json();
            console.log('📥 Response:', data);

            if (data.success) {
                this.showNotification(notification, 'success', `✅ ${data.message}`);
                ipInput.value = '';
                
                setTimeout(() => {
                    this.loadRecords();
                    this.loadStats();
                }, 1000);
            } else if (data.status === 'duplicate') {
                this.showNotification(notification, 'error', `⚠️ ${data.message}`);
            } else if (data.status === 'non_usa') {
                this.showNotification(notification, 'error', `🌍 ${data.message}`);
            } else if (data.status === 'invalid') {
                this.showNotification(notification, 'error', `❌ ${data.message}`);
            } else {
                this.showNotification(notification, 'error', `❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error('❌ Upload Error:', error);
            this.showNotification(notification, 'error', `❌ Error: ${error.message}`);
        } finally {
            uploadBtn.disabled = false;
        }
    }

    async loadRecords(page = 1) {
        const tbody = document.getElementById('ipTableBody');
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';

        try {
            const url = new URL(`${API_URL}/api/ips`);
            url.searchParams.append('page', page);
            if (this.searchQuery) url.searchParams.append('search', this.searchQuery);

            console.log('📥 Fetching:', url.toString());

            const response = await fetch(url);
            const data = await response.json();

            console.log('Response:', data);

            if (!data.success) throw new Error(data.message);

            tbody.innerHTML = '';

            if (data.records.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty">No records found</td></tr>';
            } else {
                data.records.forEach(record => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${this.escape(record.ip_address)}</td>
                        <td>${this.escape(record.country)}</td>
                        <td>${this.escape(record.region)}</td>
                        <td>${this.escape(record.city)}</td>
                        <td>${this.escape(record.organization)}</td>
                        <td>${this.escape(record.uploaded_at)}</td>
                    `;
                    tbody.appendChild(row);
                });
            }

            this.paginate(data.pagination);
            this.page = page;
        } catch (error) {
            console.error('Load error:', error);
            tbody.innerHTML = `<tr><td colspan="6" class="empty">❌ ${error.message}</td></tr>`;
        }
    }

    async loadStats() {
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

    search() {
        const searchInput = document.getElementById('searchInput');
        this.searchQuery = searchInput.value.trim();
        this.page = 1;
        this.loadRecords(1);
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.searchQuery = '';
        this.page = 1;
        this.loadRecords(1);
    }

    paginate(pagination) {
        const container = document.getElementById('pagination');
        container.innerHTML = '';

        const { page, total_pages } = pagination;
        if (total_pages <= 1) return;

        if (page > 1) {
            const btn = document.createElement('button');
            btn.textContent = '← Previous';
            btn.onclick = () => this.loadRecords(page - 1);
            container.appendChild(btn);
        }

        const start = Math.max(1, page - 2);
        const end = Math.min(total_pages, page + 2);

        for (let i = start; i <= end; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            if (i === page) {
                btn.classList.add('active');
                btn.disabled = true;
            }
            btn.onclick = () => this.loadRecords(i);
            container.appendChild(btn);
        }

        if (page < total_pages) {
            const btn = document.createElement('button');
            btn.textContent = 'Next →';
            btn.onclick = () => this.loadRecords(page + 1);
            container.appendChild(btn);
        }
    }

    showNotification(container, type, message) {
        container.className = `notification show ${type}`;
        container.textContent = message;

        setTimeout(() => {
            container.classList.remove('show');
        }, 4000);
    }

    escape(text) {
        if (!text) return 'N/A';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    new IPDatabase();
});
