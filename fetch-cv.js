const fs = require('fs');

const LINKEDIN_URL = 'https://www.linkedin.com/in/klaus-strassner/';
const API_KEY = process.env.PROXYCURL_API_KEY; 

async function fetchCV() {
    console.log("Starting CV fetch via Enrich Layer v2...");
    
    // Official documentation says use /api/v2/profile and 'profile_url'
    const params = new URLSearchParams({
        'profile_url': LINKEDIN_URL,
        'fallback_to_cache': 'on-error',
        'use_cache': 'if-present',
        'skills': 'include'
    });

    const apiUrl = `https://enrichlayer.com/api/v2/profile?${params.toString()}`;
    
    console.log(`Requesting: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Enrich Layer error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        
        // Save the result to cv.json
        fs.writeFileSync('cv.json', JSON.stringify(data, null, 2));
        console.log("✅ Successfully updated cv.json!");

    } catch (error) {
        console.error("❌ Failed to fetch CV:", error.message);
        process.exit(1);
    }
}

fetchCV();