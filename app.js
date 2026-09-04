const WORKER_URL = "https://usa-ip-api.mshoaib-archnetix.workers.dev/";

const form = document.getElementById("ipForm");
const ipInput = document.getElementById("ipAddress");
const uploadButton = document.getElementById("uploadButton");
const message = document.getElementById("message");

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message show ${type}`;
}

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const ip = ipInput.value.trim();

    if (!ip) {
        showMessage("Please enter an IP Address", "warning");
        return;
    }

    uploadButton.disabled = true;
    uploadButton.textContent = "Checking...";

    message.className = "message";

    try {

        const response = await fetch(
            `${WORKER_URL}/api/upload-ip`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    ip_address: ip
                })
            }
        );

        const data = await response.json();

        if (data.status === "uploaded") {

            showMessage(
                "Successfully Uploaded",
                "success"
            );

            ipInput.value = "";

        } else if (data.status === "duplicate") {

            showMessage(
                "Duplicate",
                "error"
            );

        } else if (data.status === "non_usa") {

            showMessage(
                "Only USA IP addresses are allowed",
                "warning"
            );

        } else if (data.status === "invalid") {

            showMessage(
                "Invalid IP Address",
                "error"
            );

        } else {

            showMessage(
                data.message || "Unable to process request",
                "error"
            );
        }

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to connect to server. Please try again.",
            "error"
        );

    } finally {

        uploadButton.disabled = false;
        uploadButton.textContent = "Upload IP";

    }

});
