/**
 * USA IP Database - Upload Only
 */

const API_URL = 'https://usa-ip-api.mshoaib-archnetix.workers.dev';

class UploadIP {
    constructor() {
        console.log('✅ App Started');
        console.log('📡 API:', API_URL);
        this.attachListeners();
    }

    attachListeners() {
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadIP();
        });
    }

    async uploadIP() {
        const ipInput = document.getElementById('ipInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const notification = document.getElementById('uploadNotification');

        const ip = ipInput.value.trim();

        if (!ip) {
            this.showNotification(notification, 'error', '❌ Please enter an IP address');
            return;
        }

        uploadBtn.disabled = true;

        try {
            console.log('📤 Uploading:', ip);

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
                ipInput.focus();
            } else if (data.status === 'duplicate') {
                this.showNotification(notification, 'error', `⚠️ ${data.message}`);
            } else if (data.status === 'non_usa') {
                this.showNotification(notification, 'error', `🌍 ${data.message}`);
            } else if (data.status === 'invalid') {
                this.showNotification(notification, 'error', `❌ ${data.message}`);
            } else {
                this.showNotification(notification, 'error', `❌ ${data.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification(notification, 'error', `❌ ${error.message}`);
        } finally {
            uploadBtn.disabled = false;
        }
    }

    showNotification(container, type, message) {
        container.className = `notification show ${type}`;
        container.textContent = message;

        setTimeout(() => {
            container.classList.remove('show');
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UploadIP();
});
