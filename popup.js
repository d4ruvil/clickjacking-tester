document.addEventListener("DOMContentLoaded", async function () {
    let iframe = document.getElementById("testFrame");
    let button = document.getElementById("generatePoc");
    let loading = document.getElementById("loading");
    let error = document.getElementById("error");

    // Hide button initially until we determine vulnerability
    button.style.display = "none";

    try {
        // Get the active tab's details
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && tab.url) {
            loading.style.display = "block"; // Show loading indicator
            iframe.src = tab.url; // Load the site for checking Clickjacking

            // Check for X-Frame-Options and CSP headers
            let response;
            try {
                response = await fetch(tab.url, { method: "HEAD", mode: "no-cors" });
            } catch (e) {
                console.log("Couldn't fetch headers directly due to CORS");
            }

            // Check headers if we got a response
            if (response && response.headers) {
                let headers = response.headers;
                if (headers.get("X-Frame-Options") || 
                    (headers.get("Content-Security-Policy") && headers.get("Content-Security-Policy").includes("frame-ancestors"))) {
                    error.textContent = "This site is protected against clickjacking.";
                    iframe.style.display = "none";
                    button.style.display = "none";
                    loading.style.display = "none";
                    return;
                }
            }
        } else {
            error.textContent = "No active tab detected.";
            iframe.style.display = "none";
            button.style.display = "none";
            loading.style.display = "none";
            return;
        }

        iframe.onload = () => {
            loading.style.display = "none";
            
            // Additional check for frame busting scripts
            try {
                let frameDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (frameDoc && frameDoc.body) {
                    // Check for common frame busting techniques
                    if (frameDoc.body.innerHTML.includes("frame busting") || 
                        frameDoc.body.innerHTML.includes("framebuster") ||
                        frameDoc.body.innerHTML.includes("clickjacking") ||
                        frameDoc.body.innerHTML.includes("deny") ||
                        frameDoc.body.innerHTML.includes("sameorigin")) {
                        error.textContent = "This site is protected against clickjacking.";
                        iframe.style.display = "none";
                        button.style.display = "none";
                        return;
                    }
                    
                    // If we get here, site might be vulnerable
                    button.style.display = "block";
                }
            } catch (e) {
                // Cross-origin frame, can't access content - assume vulnerable
                button.style.display = "block";
            }
        };

        iframe.onerror = () => {
            loading.style.display = "none";
            error.textContent = "Failed to load the website. This may indicate protection against framing.";
            iframe.style.display = "none";
            button.style.display = "none";
        };

        // Generate PoC button handler
        button.addEventListener("click", async function () {
            if (!tab || !tab.url) {
                alert("No active tab detected!");
                return;
            }

            // Generate PoC HTML
            let pocHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clickjacking PoC</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            background-color: #f4f4f4;
            padding: 20px;
            font-size: 12px;
        }
        .container {
            max-width: 800px;
            margin: auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
        }
        th, td {
            border: 2px solid #000;
            padding: 8px;
            text-align: left;
            font-family: 'Times New Roman', Times, serif;
            font-size: 20px;
        }
        th {
            background-color: #FFD700;
            color: black;
            font-weight: bold;
            font-size: 24px;
        }
        .bold-font {
            font-weight: bold;
            color: #000000;
        }
        iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.5;
            z-index: 1;
        }
        .overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2;
            background: rgba(255, 0, 0, 0.5);
            padding: 20px;
            color: white;
            font-weight: bold;
            border: 2px solid red;
        }
    </style>
</head>
<body>
    <div class="container">
        <table>
            <tr>
                <th>Vulnerability Name: Clickjacking</th>
            </tr>
            <tr>
                <th>Vulnerability Rating: Medium</th>
            </tr>
            <tr>
                <td><span class="bold-font">CVSS:</span> Medium5.4 CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N</td>
            </tr>
            <tr>
                <td><span class="bold-font">URL:</span> ${tab.url}</td>
            </tr>
            <tr>
                <td>
                    <span class="bold-font">Vulnerability Description:</span> A web security vulnerability that tricks users into 
                    clicking on hidden or disguised elements on a webpage. This is done by overlaying an invisible or
                    transparent layer on top of the target page, which can be made possible using HTML frames or iframes.
                </td>
            </tr>
            <tr>
                <td>
                    <span class="bold-font">Impact:</span> The impact of a clickjacking attack can be severe as it can cause Financial Loss, Data Breach,
                    Reputation Damage, Legal Consequences and so on.
                </td>
            </tr>
            <tr>
                <td>
                    <span class="bold-font">Recommendation:</span> Use X-Frame-Options Header with DENY or SAMEORIGIN, or Content-Security-Policy with frame-ancestors directive.
                </td>
            </tr>
            <tr>
                <td>
                    <span class="bold-font">Proof Of Concept:</span> <br>
                    <div style="position: relative; height: 300px; border: 1px solid #000;">
                        <iframe src="${tab.url}"></iframe>
                        <div class="overlay">This is a clickjacking overlay. Users might click here thinking it's safe.</div>
                    </div>
                    <p><span class="bold-font">Instructions:</span></p>
                    <ol>
                        <li>The iframe above shows the target website at 50% opacity</li>
                        <li>The red overlay demonstrates where an attacker might place invisible clickable elements</li>
                        <li>Users would unknowingly interact with the underlying page</li>
                    </ol>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
            `;

            // Create a Blob from the PoC HTML
            let blob = new Blob([pocHtml], { type: "text/html" });
            let url = URL.createObjectURL(blob);

            // Open PoC in a new tab
            chrome.tabs.create({ url: url });
        });

    } catch (error) {
        console.error("Error in extension:", error);
        loading.style.display = "none";
        error.textContent = "An error occurred. Please try again.";
        button.style.display = "none";
    }
});
