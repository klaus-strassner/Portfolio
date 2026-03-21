const fs = require('fs');

// 🛑 Ensure this is your actual profile URL
const LINKEDIN_URL = 'https://www.linkedin.com/in/klaus-strassner/';
const API_KEY = process.env.ENRICH_LAYER_API_KEY; // Change secret name in GitHub if needed

async function fetchCV() {
    console.log("Starting CV fetch via Enrich Layer...");
    try {
        const response = await fetch(`https://api.enrichlayer.com/v1/enrich?url=${encodeURIComponent(LINKEDIN_URL)}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Enrich Layer error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Enrich Layer usually wraps data in a 'profile' object
        // We save the whole thing to cv.json
        fs.writeFileSync('cv.json', JSON.stringify(data, null, 2));
        console.log("Successfully updated cv.json!");

    } catch (error) {
        console.error("Failed to fetch CV:", error);
        process.exit(1);
    }
}

fetchCV();