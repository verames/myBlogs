import './style.css'

const categories = [
    { id: 'about', label: 'ABOUT', color: 'var(--folder-olive)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
    { id: 'essays', label: 'ESSAYS', color: 'var(--folder-orange)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>` },
    { id: 'journal', label: 'JOURNAL', color: 'var(--folder-slate)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>` },
    { id: 'stories', label: 'STORIES', color: 'var(--folder-gold)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 15h2"/><path d="M12 11h9"/><path d="M12 21h8"/><path d="M12 3h9"/><path d="M12 7h6"/><path d="M3 15h2"/><path d="M3 3h2"/><path d="M3 7h2"/><path d="M5 11H3"/><path d="M5 21H3"/><path d="M7 11h2"/><path d="M7 15h2"/><path d="M7 21h2"/><path d="M7 3h2"/><path d="M7 7h2"/></svg>` },
    { id: 'books', label: 'BOOKS', color: 'var(--folder-indigo)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>` },
    { id: 'paintings', label: 'PAINTINGS', color: 'var(--folder-slate)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.71-.74 1.71-1.67 0-.43-.16-.83-.46-1.13-.29-.29-.48-.7-.48-1.15 0-.93.74-1.68 1.67-1.68H18c2.21 0 4-1.79 4-4 0-4.41-3.59-8-8-8z"/></svg>` }
];

let blogData = {};
let currentCategory = 'about';
let loginAttempts = 0;
let aboutClickCount = 0;
let aboutClickTimeout = null;
/** Cleared on each closePaper so rapid Escape/clicks cannot leave UI stuck */
let paperCloseTimeoutId = null;

async function init() {
    blogData = await loadContent();
    renderSidebar();
    renderMainArea('about');
    setupEventListeners();
}

async function loadContent() {
    try {
        const response = await fetch('/data/content.json');
        return await response.json();
    } catch (error) {
        console.warn('Could not load content', error);
        return {
            about: "Welcome to my shelf. I've been collecting thoughts, stories, and sketches for years.",
            essays: [], journal: [], stories: [], books: [], paintings: []
        };
    }
}

function renderSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.innerHTML = categories.map(cat => `
        <div class="folder-tab ${cat.id === currentCategory ? 'active' : ''}" 
             data-category="${cat.id}" 
             style="--folder-color: ${cat.color}">
            <span class="folder-icon">${cat.icon}</span>
            <span class="folder-label">${cat.label}</span>
        </div>
    `).join('');
}

function renderMainArea(category) {
    const desk = document.querySelector('.main-desk');

    if (category === 'about') {
        desk.innerHTML = `
            <div class="about-me-note">
                <h1>Introduction</h1>
                <p style="font-size: 1.2rem; line-height: 1.6;">${blogData.about}</p>
            </div>
        `;
    } else {
        const items = blogData[category] || [];
        desk.innerHTML = `
            <h2 style="color: #fff; font-family: 'Special Elite'; margin-left: 20px;">${category.toUpperCase()}</h2>
            <div class="file-list">
                ${items.map((item, index) => `
                    <div class="file-card" data-index="${index}" data-cat="${category}">
                        <h4>${item.title}</h4>
                    </div>
                `).join('')}
                ${items.length === 0 ? '<p style="color: #ccc;">No files here...</p>' : ''}
            </div>
        `;
    }
}

function setupEventListeners() {
    document.addEventListener('click', (e) => {
        // Sidebar tabs
        const tab = e.target.closest('.folder-tab');
        if (tab) {
            const cat = tab.dataset.category;

            // 5-click logic for About tab
            if (cat === 'about') {
                aboutClickCount++;
                clearTimeout(aboutClickTimeout);
                aboutClickTimeout = setTimeout(() => { aboutClickCount = 0; }, 3000); // 3 seconds tolerance

                if (aboutClickCount === 5) {
                    aboutClickCount = 0;
                    handleAdminLogin();
                    return;
                }
            } else {
                aboutClickCount = 0;
            }

            currentCategory = cat;
            renderSidebar();
            renderMainArea(currentCategory);
            closePaper();
            return;
        }

        // File cards
        const card = e.target.closest('.file-card');
        if (card) {
            const cat = card.dataset.cat;
            const index = card.dataset.index;
            const item = blogData[cat]?.[index];
            if (item) openPaper(item);
            return;
        }

        // Close paper (×, paper shell, or brown backdrop — not inner .paper-content)
        if (
            e.target.id === 'close-paper' ||
            e.target.id === 'paper-backdrop' ||
            e.target.classList.contains('paper-overlay')
        ) {
            closePaper();
            return;
        }

        // Admin actions
        if (e.target.id === 'close-admin' || e.target.id === 'close-admin-top') {
            toggleAdmin(false);
            return;
        }
        if (e.target.id === 'save-data-btn') {
            downloadJSON();
            return;
        }

        if (e.target.classList.contains('admin-delete-btn')) {
            const catArr = e.target.dataset.cat;
            const idx = e.target.dataset.index;
            blogData[catArr].splice(idx, 1);
            renderAdminPanel();
            renderMainArea(currentCategory);
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePaper();
            toggleAdmin(false);
        }
    });
}

function handleAdminLogin() {
    const promptMsg = "Leave sit by telling me what you love the most ....?";
    const pass = prompt(promptMsg);

    // Obfuscated check for "God and myself" (Base64 encoded)
    // To prevent simple scrapers from seeing the password in plain text.
    if (pass && btoa(pass.trim()) === "R29kIGFuZCBteXNlbGY=") {
        loginAttempts = 0;
        toggleAdmin(true);
    } else if (pass !== null) {
        loginAttempts++;
        if (loginAttempts >= 2) {
            alert('Access Denied: Too many attempts. Resetting trigger.');
            loginAttempts = 0;
            aboutClickCount = 0;
        } else {
            alert('Access Denied: One attempt remaining.');
        }
    }
}

function toggleAdmin(show) {
    const overlay = document.getElementById('admin-overlay');
    overlay.style.display = show ? 'flex' : 'none';
    if (show) renderAdminPanel();
}

function renderAdminPanel() {
    const editor = document.getElementById('admin-editor');
    let html = `
        <div class="admin-scroll-area">
            <div class="admin-section">
                <h3>About Me</h3>
                <textarea id="about-editor" class="admin-input" style="height: 120px; resize: vertical; border: 1px solid #aaa;">${blogData.about}</textarea>
                <div style="margin-top:10px;">
                    <button class="admin-btn" onclick="window.updateAbout()">Save About Text</button>
                </div>
            </div>
    `;

    categories.filter(c => c.id !== 'about').forEach(cat => {
        html += `
            <div class="admin-section">
                <h3>${cat.label} Management</h3>
                <div class="admin-items">
                    ${(blogData[cat.id] || []).map((item, index) => `
                        <div class="admin-item-row" style="border: 1px solid #ccc; background: #fff; padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border-radius: 5px;">
                            <span style="font-weight: bold;">${item.title}</span>
                            <button class="admin-delete-btn" data-cat="${cat.id}" data-index="${index}">Delete</button>
                        </div>
                    `).join('')}
                </div>
                <button class="admin-add-btn" onclick="window.showAddForm('${cat.id}')">+ Add New Entry to ${cat.label}</button>
            </div>
        `;
    });

    html += `</div>`; // Close admin-scroll-area
    editor.innerHTML = html;
}

window.updateAbout = () => {
    blogData.about = document.getElementById('about-editor').value;
    renderMainArea('about');
    alert('About Me updated! Remember to download JSON to save permanently.');
};

window.showAddForm = (catId) => {
    const title = prompt('Enter Title:');
    const date = prompt('Enter Date/Year:');
    const content = prompt('Enter Content:');

    if (title && content) {
        if (!blogData[catId]) blogData[catId] = [];
        blogData[catId].unshift({
            id: Date.now(),
            title,
            date,
            content
        });
        renderAdminPanel();
        renderMainArea(currentCategory);
    }
};

function downloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blogData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "content.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert('New content.json generated! Replace the file in public/data/ with this one.');
}

function openPaper(item) {
    const overlay = document.getElementById('paper-overlay');
    const content = document.querySelector('.paper-content');
    if (paperCloseTimeoutId !== null) {
        clearTimeout(paperCloseTimeoutId);
        paperCloseTimeoutId = null;
    }

    content.innerHTML = `
        <h1>${item.title}</h1>
        <p style="font-style: italic; color: #666;">${item.date || item.year || ''} ${item.author ? ' - ' + item.author : ''}</p>
        <div style="margin-top: 30px;">
            <p>${item.content || item.description || item.review || ''}</p>
        </div>
    `;

    const app = document.getElementById('app');
    app.classList.add('paper-open');
    overlay.style.display = 'block';
    setTimeout(() => overlay.classList.add('active'), 10);
}

function closePaper() {
    const overlay = document.getElementById('paper-overlay');
    const app = document.getElementById('app');
    if (!app.classList.contains('paper-open')) return;

    overlay.classList.remove('active');
    if (paperCloseTimeoutId !== null) {
        clearTimeout(paperCloseTimeoutId);
        paperCloseTimeoutId = null;
    }
    paperCloseTimeoutId = setTimeout(() => {
        paperCloseTimeoutId = null;
        overlay.style.display = 'none';
        app.classList.remove('paper-open');
    }, 400);
}

init();
