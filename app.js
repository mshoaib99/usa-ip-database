// IMPORTANT: Apna Worker URL yahan dalna hai
// Jab Worker banayega tab URL milega
const API_URL = 'https://usa-ip-database.mshoaib-archnetix.workers.dev';

class IPDatabaseApp {
    constructor() {
        this.currentPage = 1;
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadIPRecords();
        this.updateDashboardStats();
    }

    setupEventListeners() {
        const uploadBtn = document.getElementById('uploadBtn');
        const ipInput = document.getElementById('ipInput');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.uploadIP());
        }

        if (ipInput) {
            ipInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.uploadIP();
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        }
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
                'Empty Input',
                'Please enter an IP address'
            );
            return;
        }

        uploadBtn.disabled = true;
        const originalText = uploadBtn.textContent;
        uploadBtn.textContent = 'Checking...';

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
                    'Successfully Uploaded',
                    'USA IP address was successfully added to the database.'
                );
                ipInput.value = '';
                uploadBtn.textContent = 'Successfully Uploaded';

                setTimeout(() => {
                    this.loadIPRecords();
                    this.updateDashboardStats();
                }, 1500);
            } else {
                let title = 'Error';
                let message = data.message;
                let type = 'error';

                if (data.status === 'duplicate') {
                    title = 'Duplicate IP';
                    message = 'This IP address already exists in the database.';
                    uploadBtn.textContent = 'Duplicate IP';
                } else if (data.status === 'non_usa') {
                    title = 'Not a USA IP';
                    message = 'This IP address does not belong to the United States.';
                    uploadBtn.textContent = 'Not a USA IP';
                    type = 'warning';
                } else if (data.status === 'invalid') {
                    title = 'Invalid IP Address';
                    message = 'Please enter a valid IP address format.';
                    uploadBtn.textContent = 'Invalid IP Address';
                }

                this.showNotification(notificationContainer, type, title, message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification(
                notificationContainer,
                'error',
                'Error',
                'Unable to process request. Please try again.'
            );
            uploadBtn.textContent = originalText;
        } finally {
            uploadBtn.disabled = false;

            setTimeout(() => {
                if (!uploadBtn.textContent.includes('Successfully') &&
                    !uploadBtn.textContent.includes('Duplicate') &&
                    !uploadBtn.textContent.includes('Not a USA')) {
                    uploadBtn.textContent = originalText;
                }
            }, 3000);
        }
    }

    async loadIPRecords(page = 1) {
        const tableBody = document.getElementById('ipTableBody');
        const paginationContainer = document.getElementById('pagination');

        if (!tableBody) return;

        try {
            const url = new URL(`${API_URL}/api/ips`);
            url.searchParams.append('page', page);

            if (this.searchQuery) {
                url.searchParams.append('search', this.searchQuery);
            }

            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                throw new Error('Failed to load records');
            }

            tableBody.innerHTML = '';

            if (data.records.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No IP records found</p></td></tr>';
            } else {
                data.records.forEach(record => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="ip-address">${this.escapeHtml(record.ip_address)}</td>
                        <td>${this.escapeHtml(record.country)}</td>
                        <td>${this.escapeHtml(record.region)}</td>
                        <td>${this.escapeHtml(record.city)}</td>
                        <td>${this.escapeHtml(record.organization)}</td>
                        <td>${this.escapeHtml(record.uploaded_at)}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            if (paginationContainer) {
                this.updatePagination(
                    paginationContainer,
                    data.pagination.page,
                    data.pagination.total_pages
                );
            }

            this.currentPage = page;
        } catch (error) {
            console.error('Load records error:', error);
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>Failed to load records</p></td></tr>';
        }
    }

    async performSearch() {
        const searchInput = document.getElementById('searchInput');

        if (!searchInput) return;

        this.searchQuery = searchInput.value.trim();
        this.currentPage = 1;
        await this.loadIPRecords(1);
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

    updatePagination(container, currentPage, totalPages) {
        container.innerHTML = '';

        if (totalPages <= 1) return;

        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '← Previous';
            prevBtn.addEventListener('click', () => this.loadIPRecords(currentPage - 1));
            container.appendChild(prevBtn);
        }

        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === currentPage) {
                pageBtn.classList.add('active');
                pageBtn.disabled = true;
            }
            pageBtn.addEventListener('click', () => this.loadIPRecords(i));
            container.appendChild(pageBtn);
        }

        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Next →';
            nextBtn.addEventListener('click', () => this.loadIPRecords(currentPage + 1));
            container.appendChild(nextBtn);
        }
    }

    showNotification(container, type, title, message) {
        if (!container) return;

        const iconMap = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="icon">${iconMap[type]}</div>
            <div class="message">
                <span class="title">${this.escapeHtml(title)}</span>
                <span class="description">${this.escapeHtml(message)}</span>
            </div>
        `;

        container.innerHTML = '';
        container.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new IPDatabaseApp();
});
