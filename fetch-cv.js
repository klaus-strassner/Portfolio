const fs = require('fs');

// 🛑 IMPORTANT: Replace the URL below with your actual LinkedIn profile link!
const LINKEDIN_URL = 'https://www.linkedin.com/in/klaus-strassner/'; 
const API_KEY = process.env.PROXYCURL_API_KEY;

async function fetchCV() {
    console.log("Starting CV fetch...");
    try {
        // use_cache=if-present saves credits by serving recent data if available
        // fallback_to_cache=on-error ensures your site doesn't break if LinkedIn is down
        const response = await fetch(`https://nubela.co/proxycurl/api/v2/linkedin?url=${LINKEDIN_URL}&skills=include&use_cache=if-present&fallback_to_cache=on-error`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        if (!response.ok) {
            // This prints the exact reason it failed into your GitHub Action logs
            throw new Error(`Proxycurl error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Save the response to cv.json
        fs.writeFileSync('cv.json', JSON.stringify(data, null, 2));
        console.log("Successfully updated cv.json!");

    } catch (error) {
        console.error("Failed to fetch CV:", error);
        process.exit(1); // Tell GitHub Actions the script failed
    }
}

fetchCV();