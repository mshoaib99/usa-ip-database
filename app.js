// =====================================================
// Cloudflare Worker URL
// =====================================================
//
// IMPORTANT:
// Replace this URL with your REAL Worker URL.
//
// Example:
// https://usa-ip-api.your-subdomain.workers.dev
//

const API_URL = 'https://usa-ip-api.mshoaib-archnetix.workers.dev/';


// =====================================================
// DOM Elements
// =====================================================

const uploadForm = document.getElementById('uploadForm');
const ipAddressInput = document.getElementById('ipAddress');
const uploadButton = document.getElementById('uploadButton');

const buttonText = document.getElementById('buttonText');
const buttonLoader = document.getElementById('buttonLoader');

const messageBox = document.getElementById('message');


// =====================================================
// Show Message
// =====================================================

function showMessage(message, type = 'error') {

    messageBox.textContent = message;

    messageBox.className = `message ${type}`;

}


// =====================================================
// Hide Message
// =====================================================

function hideMessage() {

    messageBox.textContent = '';

    messageBox.className = 'message hidden';

}


// =====================================================
// Loading State
// =====================================================

function setLoading(isLoading) {

    uploadButton.disabled = isLoading;

    if (isLoading) {

        buttonText.textContent = 'Uploading...';

        buttonLoader.classList.remove('hidden');

    } else {

        buttonText.textContent = 'Upload IP';

        buttonLoader.classList.add('hidden');

    }

}


// =====================================================
// Upload IP
// =====================================================

uploadForm.addEventListener('submit', async function (event) {

    event.preventDefault();

    hideMessage();

    const ipAddress = ipAddressInput.value.trim();


    // Empty field
    if (!ipAddress) {

        showMessage(
            'Please enter an IP address.',
            'error'
        );

        ipAddressInput.focus();

        return;
    }


    // Basic client-side IP validation
    if (!isValidIP(ipAddress)) {

        showMessage(
            'Invalid IP Address.',
            'error'
        );

        ipAddressInput.focus();

        return;
    }


    setLoading(true);


    try {

        const response = await fetch(
            `${API_URL}/api/upload-ip`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    ip_address: ipAddress
                })
            }
        );


        // Try to read JSON response
        let data;

        try {

            data = await response.json();

        } catch (jsonError) {

            throw new Error(
                `Worker returned an invalid response. HTTP ${response.status}`
            );

        }


        // =================================================
        // Success
        // =================================================

        if (response.ok && data.success) {

            showMessage(
                data.message || 'Successfully Uploaded',
                'success'
            );

            // Clear field after successful upload
            ipAddressInput.value = '';

            return;
        }


        // =================================================
        // Duplicate
        // =================================================

        if (data.status === 'duplicate') {

            showMessage(
                data.message || 'Duplicate IP',
                'warning'
            );

            return;
        }


        // =================================================
        // Non-USA
        // =================================================

        if (data.status === 'non_usa') {

            showMessage(
                data.message || 'Not a USA IP',
                'warning'
            );

            return;
        }


        // =================================================
        // Invalid
        // =================================================

        if (data.status === 'invalid') {

            showMessage(
                data.message || 'Invalid IP Address',
                'error'
            );

            return;
        }


        // =================================================
        // Other API error
        // =================================================

        showMessage(
            data.message ||
            `Request failed. HTTP ${response.status}`,
            'error'
        );


    } catch (error) {

        console.error('Upload error:', error);

        showMessage(
            error.message ||
            'Unable to connect to the API.',
            'error'
        );

    } finally {

        setLoading(false);

    }

});


// =====================================================
// IP Validation
// =====================================================

function isValidIP(ip) {

    // IPv4
    const ipv4Regex =
        /^(\d{1,3}\.){3}\d{1,3}$/;

    if (ipv4Regex.test(ip)) {

        const parts = ip.split('.');

        return parts.every(function (part) {

            const number = Number(part);

            return (
                Number.isInteger(number) &&
                number >= 0 &&
                number <= 255
            );

        });

    }


    // IPv6
    const ipv6Regex =
        /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:)((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

    return ipv6Regex.test(ip);

}
