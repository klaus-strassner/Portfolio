const DOM = {
    grid: document.querySelector('#grid'),
    overlay: document.getElementById('overlay'),
    title: document.getElementById('overlayTitle'),
    body: document.getElementById('overlayBody'),
    close: document.getElementById('closeOverlay')
};

const contentData = {};

// --- HELPERS ---
const formatDate = (d) => {
    if (!d?.year) return null;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return d.month ? `${months[d.month - 1]} ${d.year}` : d.year;
};

// --- DATA FETCHING ---
async function initGithub() {
    try {
        const res = await fetch('data/github.json');
        const repos = await res.json();
        const filtered = repos.filter(r => !r.fork).sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

        contentData["PROJECTS"] = `
            <div class="project-grid">
                ${filtered.map(r => `
                    <a href="${r.html_url}" target="_blank" class="project-card">
                        <div>
                            <div class="project-name">${r.name.replace(/-/g, ' ')}</div>
                            <p class="cv-desc" style="font-size:0.9rem">${r.description || 'no description'}</p>
                        </div>
                        <div class="project-meta"><span>● ${r.language || 'Binary'}</span></div>
                    </a>
                `).join('')}
            </div>`;
    } catch (e) { contentData["PROJECTS"] = "Sync failed."; }
}

async function initLiquipedia() {
    try {
        const res = await fetch('data/liquipedia.json');
        const data = await res.json();
        const parser = new DOMParser();
        const rDoc = parser.parseFromString(data.results.parse.text["*"], 'text/html');
        const hDoc = parser.parseFromString(data.profile.parse.text["*"], 'text/html');

        const getInfo = (label) => Array.from(hDoc.querySelectorAll('.infobox-description'))
            .find(el => el.innerText.includes(label))?.nextElementSibling.innerText.trim() || "N/A";

        // Results parsing (A-Tier and B-Tier only)
        const results = Array.from(rDoc.querySelectorAll('.table2__row--body'))
            .map(row => ({
                date: row.cells[0]?.innerText.trim() || "0000",
                name: row.cells[4]?.innerText.trim() || "Unknown",
                place: row.cells[1]?.innerText.trim() || "N/A",
                tier: row.cells[2]?.innerText.trim().toUpperCase() || ""
            }))
            .filter(r => r.tier.includes("A-TIER") || r.tier.includes("B-TIER"))
            .sort((a, b) => b.date.localeCompare(a.date));

        // Team History parsing
        const teams = [];
        hDoc.querySelectorAll('.infobox-center table tr').forEach(tr => {
            const p = tr.querySelector('.th-mono')?.innerText.trim();
            const t = tr.querySelector('td:not(.th-mono)')?.innerText.trim();
            if (p && t) teams.push({ p, t });
        });

        // REVERSE to get newest first, then take top 5
        const newestTeams = teams.reverse().slice(0, 5);

        contentData["ESPORTS"] = `
            <div class="esports-layout">
                <div>
                    <div class="meta-item"><span>STATUS</span><b>${getInfo("Status:")}</b></div>
                    <div class="meta-item"><span>ROLE</span><b>${getInfo("Role:")}</b></div>
                    <div class="meta-item"><span>TEAM</span><b>${getInfo("Team:")}</b></div>
                    <div class="lp-section-header">Recent History</div>
                    ${newestTeams.map(t => `
                        <div class="meta-item">
                            <span>${t.t}</span>
                            <b>${t.p}</b>
                        </div>
                    `).join('')}
                </div>
                <div>
                    <div class="lp-section-header">Major Results</div>
                    <table class="lp-table">
                        <thead>
                            <tr>
                                <th class="col-date">Date</th>
                                <th>Tournament</th>
                                <th class="col-end">Place</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.map(r => `
                                <tr>
                                    <td class="col-date">${r.date}</td>
                                    <td>${r.name}</td>
                                    <td class="col-end">${r.place}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    } catch (e) { 
        console.error("Liquipedia Load Error:", e); 
        contentData["ESPORTS"] = "Failed to load esports data.";
    }
}

async function initLinkedin() {
    try {
        const res = await fetch('data/linkedin.json');
        const [data] = await res.json();
        
        contentData["ABOUT"] = `<p class="cv-desc">${data.summary || data.headline || ''}</p>`;
        contentData["CONTACT"] = `<p class="cv-desc">${data.geoLocationName || 'Vienna, Austria'}<br>Local Time: <span id="vienna-clock" style="color:var(--text)">Loading...</span><br><br><a href="${data.inputUrl}" target="_blank" style="color:inherit">LinkedIn Profile</a></p>`;

        const mapper = (items, type) => `
            <div class="cv-timeline">
                ${items.map(i => `
                    <div class="cv-item">
                        <div class="cv-date">${formatDate(i.timePeriod.startDate)} — ${formatDate(i.timePeriod.endDate) || 'Present'}</div>
                        <div class="cv-title">${type === 'edu' ? i.degreeName : i.title}</div>
                        <div class="cv-subtitle">${type === 'edu' ? i.schoolName : i.company.name}</div>
                        <p class="cv-desc">${i.description || i.fieldOfStudy || ''}</p>
                    </div>`).join('')}
            </div>`;

        if (data.positions) contentData["EXPERIENCE"] = mapper(data.positions, 'exp');
        if (data.educations) contentData["EDUCATION"] = mapper(data.educations, 'edu');
        if (data.skills) {
            const unique = [...new Set(data.skills.map(s => s.name))];
            contentData["SKILLS"] = `<div class="skills-grid">${unique.map(s => `<div class="skill-tag">${s}</div>`).join('')}</div>`;
        }
    } catch (e) { console.warn(e); }
}

// --- UI LOGIC ---
const toggleOverlay = (title = null) => {
    if (title) {
        DOM.title.textContent = title;
        DOM.body.innerHTML = contentData[title] || "Data unavailable.";
        DOM.overlay.classList.add('active');
        history.pushState({ open: true }, title);
    } else {
        DOM.overlay.classList.remove('active');
        if (history.state?.open) history.back();
    }
};

// Events
document.querySelectorAll('.grid-item').forEach(el => el.onclick = () => toggleOverlay(el.dataset.title));
DOM.close.onclick = () => toggleOverlay();
window.onkeydown = (e) => e.key === "Escape" && toggleOverlay();
window.onpopstate = () => DOM.overlay.classList.remove('active');

DOM.grid.onmousemove = (e) => {
    const r = DOM.grid.getBoundingClientRect();
    DOM.grid.style.setProperty('--mouse-x', `${(e.clientX - r.left) / r.width * 100}%`);
    DOM.grid.style.setProperty('--mouse-y', `${(e.clientY - r.top) / r.height * 100}%`);
};

DOM.grid.onmouseenter = () => DOM.grid.style.setProperty('--spotlight-color', '#333');
DOM.grid.onmouseleave = () => {
    DOM.grid.style.setProperty('--spotlight-color', 'var(--line-grey)');
    DOM.grid.style.setProperty('--mouse-x', '-100%');
};

setInterval(() => {
    const el = document.getElementById('vienna-clock');
    if (el) el.textContent = new Date().toLocaleString('en-US', { timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}, 1000);

Promise.all([initLiquipedia(), initLinkedin(), initGithub()]).finally(() => document.body.classList.add('loaded'));