document.addEventListener("DOMContentLoaded", async function () {
    let iframe = document.getElementById("testFrame");
    let button = document.getElementById("generatePoc");
    let loading = document.getElementById("loading");
    let error = document.getElementById("error");

    try {
        // Get the active tab's details
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && tab.url) {
            loading.style.display = "block"; // Show loading indicator
            iframe.src = tab.url; // Load the site for checking Clickjacking

            // Check for X-Frame-Options and CSP headers
            let response = await fetch(tab.url, { method: "HEAD" });
            let headers = response.headers;

            if (headers.get("X-Frame-Options") || headers.get("Content-Security-Policy")) {
                error.textContent = "This site is protected against clickjacking.";
                iframe.style.display = "none"; // Hide iframe if protected
            }
        } else {
            error.textContent = "No active tab detected.";
            iframe.style.display = "none"; // Hide the iframe if no URL
        }

        iframe.onload = () => {
            loading.style.display = "none"; // Hide loading indicator
        };

        iframe.onerror = () => {
            loading.style.display = "none";
            error.textContent = "Failed to load the website.";
            iframe.style.display = "none";
        };

        button.addEventListener("click", async function () {
            if (!tab || !tab.url) {
                alert("No active tab detected!");
                return;
            }

            // Generate PoC HTML in the specified format
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

                        th,
                        td {
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
                    </style>
                </head>
                <body>
                    <table>
                        <tr>
                            <th>
                                Vulnerability Name: Clickjacking
                            </th>
                        </tr>

                        <tr>
                            <th>
                                Vulnerability Rating: Medium
                            </th>
                        </tr>

                        <tr>
                            <td>
                                <span class="bold-font">CVSS:</span> Medium5.4 CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <span class="bold-font">URL:</span> ${tab.url}
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <span class="bold-font">Vulnerability Description:</span> A flaw was found in underscore is (CVE-2022-3260). A web security vulnerability that tricks users into 
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
                                <span class="bold-font">Recommendation:</span> Use X-Frame-Options Header and Framebusting Techniques.
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <span class="bold-font">Proof Of Concept:</span> <br>
                                <span class="bold-font">Step 1)</span> Copy the URL of the website.
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <span class="bold-font">Step 2)</span> Paste the URL in the Clickjacking PoC code (form GitHub) and save the file as “.html”.
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <span class="bold-font">Step 3)</span> Run the file in browser it shows the website’s page. It is Vulnerable.
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `;

            // Create a Blob from the PoC HTML
            let blob = new Blob([pocHtml], { type: "text/html" });
            let url = URL.createObjectURL(blob);

            // Open PoC in a new tab
            chrome.tabs.create({ url: url });

            // Add a button to download the PoC as a PDF
            let downloadButton = document.createElement("button");
            downloadButton.textContent = "Download PoC as PDF";
            downloadButton.style.marginTop = "10px";
            downloadButton.style.width = "100%";
            downloadButton.style.padding = "10px";
            downloadButton.style.backgroundColor = "#28a745";
            downloadButton.style.color = "white";
            downloadButton.style.border = "none";
            downloadButton.style.cursor = "pointer";

            downloadButton.addEventListener("click", async () => {
                // Convert HTML to PDF using jsPDF
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // Add content to the PDF
                doc.setFontSize(16);
                doc.text("Vulnerability Name: Clickjacking", 10, 20);
                doc.text("Vulnerability Rating: Medium", 10, 30);
                doc.text(`CVSS: Medium5.4 CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N`, 10, 40);
                doc.text(`URL: ${tab.url}`, 10, 50);

                doc.setFontSize(12);
                doc.text("Vulnerability Description:", 10, 70);
                doc.text("A flaw was found in underscore is (CVE-2022-3260). A web security vulnerability that tricks users into clicking on hidden or disguised elements on a webpage. This is done by overlaying an invisible or transparent layer on top of the target page, which can be made possible using HTML frames or iframes.", 10, 80, { maxWidth: 180 });

                doc.text("Impact:", 10, 110);
                doc.text("The impact of a clickjacking attack can be severe as it can cause Financial Loss, Data Breach, Reputation Damage, Legal Consequences and so on.", 10, 120, { maxWidth: 180 });

                doc.text("Recommendation:", 10, 140);
                doc.text("Use X-Frame-Options Header and Framebusting Techniques.", 10, 150);

                doc.text("Proof Of Concept:", 10, 170);
                doc.text("Step 1) Copy the URL of the website.", 10, 180);
                doc.text("Step 2) Paste the URL in the Clickjacking PoC code (from GitHub) and save the file as '.html'.", 10, 190);
                doc.text("Step 3) Run the file in browser. It shows the website's page. It is Vulnerable.", 10, 200);

                // Save the PDF
                doc.save("clickjacking_poc.pdf");
            });

            // Append the download button to the popup
            document.body.appendChild(downloadButton);
        });

    } catch (error) {
        console.error("Error in extension:", error);
        loading.style.display = "none";
        error.textContent = "An error occurred. Please try again.";
    }
});