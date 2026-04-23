// NOTE: Change this URL to your actual Render backend URL after deployment
const API_URL = 'https://mse2-student-gravience-form.onrender.com/api'; 
// const API_URL = 'http://localhost:5000/api'; // For local testing

// --- State Management ---
let token = localStorage.getItem('token');
let currentGrievances = [];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        showView('dashboard-view');
        fetchGrievances();
        renderNavActions();
    } else {
        showView('auth-view');
        renderNavActions();
    }
});

// --- UI Helpers ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    
    // Animate hero text on auth view load
    if(viewId === 'auth-view') {
        document.querySelector('.hero-text').classList.add('fade-in');
        document.querySelector('.auth-box-wrapper').classList.add('fade-in');
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    const title = document.getElementById('auth-title');
    if (tab === 'login') {
        title.innerText = 'Welcome Back';
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    } else {
        title.innerText = 'Create Account';
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgSpan = document.getElementById('toast-msg');
    const icon = toast.querySelector('i');
    
    msgSpan.textContent = message;
    
    // Reset classes
    toast.className = 'toast';
    
    if (type === 'success') {
        toast.classList.add('success');
        icon.className = 'fa-solid fa-circle-check';
    } else {
        toast.classList.add('error');
        icon.className = 'fa-solid fa-circle-exclamation';
    }
    
    // Remove hidden entirely to manage with opacity/transform via class 'show'
    toast.classList.remove('hidden');
    
    // Force reflow
    void toast.offsetWidth;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

function renderNavActions() {
    const navActions = document.getElementById('nav-actions');
    if (token) {
        navActions.innerHTML = `<button onclick="handleLogout()" class="btn btn-outline btn-sm"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</button>`;
    } else {
        navActions.innerHTML = ``;
    }
}

function scrollToSubmit() {
    document.getElementById('submit-section').scrollIntoView({ behavior: 'smooth' });
}

// --- Auth Functions ---
async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    btn.disabled = true;

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            showToast('Login successful!');
            renderNavActions();
            showView('dashboard-view');
            fetchGrievances();
            document.getElementById('login-form').reset();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Server connection failed', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';
    btn.disabled = true;

    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Registration successful! Please login.');
            switchTab('login');
            document.getElementById('register-form').reset();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Server connection failed', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function handleLogout() {
    token = null;
    localStorage.removeItem('token');
    renderNavActions();
    showView('auth-view');
    showToast('Logged out successfully');
}

// --- Grievance Functions ---
async function fetchGrievances(query = '') {
    const list = document.getElementById('grievance-list');
    list.innerHTML = '<div class="loader text-center py-4"><i class="fa-solid fa-spinner fa-spin fa-2x text-primary"></i></div>';

    try {
        let url = `${API_URL}/grievances`;
        if (query) url += `/search?title=${encodeURIComponent(query)}`;
        
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401 || res.status === 403) {
            handleLogout();
            return showToast('Session expired. Please login again.', 'error');
        }

        const data = await res.json();
        if (res.ok) {
            currentGrievances = data;
            renderGrievances();
        } else {
            showToast(data.message, 'error');
            list.innerHTML = '<p class="text-center text-muted">Failed to load grievances.</p>';
        }
    } catch (err) {
        showToast('Failed to fetch grievances', 'error');
        list.innerHTML = '<p class="text-center text-muted">Network error.</p>';
    }
}

async function handleSubmitGrievance(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
    btn.disabled = true;

    const title = document.getElementById('g-title').value;
    const category = document.getElementById('g-category').value;
    const description = document.getElementById('g-desc').value;

    try {
        const res = await fetch(`${API_URL}/grievances`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, category, description })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Grievance submitted successfully!');
            document.getElementById('grievance-form').reset();
            fetchGrievances();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Server connection failed', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function deleteGrievance(id) {
    if (!confirm('Are you sure you want to delete this grievance? This action cannot be undone.')) return;
    
    try {
        const res = await fetch(`${API_URL}/grievances/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            showToast('Grievance deleted!');
            fetchGrievances();
        } else {
            const data = await res.json();
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Server connection failed', 'error');
    }
}

// --- Edit Modal Functions ---
function openEditModal(id) {
    const g = currentGrievances.find(item => item._id === id);
    if (!g) return;

    document.getElementById('edit-id').value = g._id;
    document.getElementById('edit-title').value = g.title;
    document.getElementById('edit-category').value = g.category;
    document.getElementById('edit-desc').value = g.description;
    
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

async function handleUpdateGrievance(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('edit-title').value;
    const category = document.getElementById('edit-category').value;
    const description = document.getElementById('edit-desc').value;

    try {
        const res = await fetch(`${API_URL}/grievances/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // Note: Since this is a student portal, we shouldn't let them update status.
            body: JSON.stringify({ title, category, description })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Grievance updated successfully!');
            closeEditModal();
            fetchGrievances();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Server connection failed', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- Search ---
let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = document.getElementById('search-input').value;
        fetchGrievances(query);
    }, 500);
}

// --- Rendering ---
function getCategoryIcon(category) {
    switch(category) {
        case 'Academic': return '<i class="fa-solid fa-book"></i>';
        case 'Hostel': return '<i class="fa-solid fa-building"></i>';
        case 'Transport': return '<i class="fa-solid fa-bus"></i>';
        default: return '<i class="fa-solid fa-gear"></i>';
    }
}

function renderGrievances() {
    const list = document.getElementById('grievance-list');
    list.innerHTML = '';
    
    if (currentGrievances.length === 0) {
        list.innerHTML = `
            <div class="text-center py-4 text-muted fade-in" style="padding: 2rem;">
                <i class="fa-regular fa-folder-open fa-3x mb-3" style="color: #cbd5e1;"></i>
                <p>No grievances found. You're all caught up!</p>
            </div>
        `;
        return;
    }

    currentGrievances.forEach((g, index) => {
        const date = new Date(g.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const badgeClass = g.status === 'Pending' ? 'badge-pending' : 'badge-resolved';
        const statusIcon = g.status === 'Pending' ? '<i class="fa-regular fa-clock"></i>' : '<i class="fa-regular fa-circle-check"></i>';
        
        const item = document.createElement('div');
        item.className = 'grievance-item';
        item.style.animationDelay = `${index * 0.1}s`;
        item.innerHTML = `
            <div class="g-header">
                <div class="g-title">${g.title}</div>
                <span class="badge ${badgeClass}">${statusIcon} ${g.status}</span>
            </div>
            <div class="g-meta">
                <span>${getCategoryIcon(g.category)} ${g.category}</span>
                <span><i class="fa-regular fa-calendar"></i> ${date}</span>
            </div>
            <div class="g-desc">${g.description}</div>
            <div class="g-actions">
                <button class="btn btn-sm btn-outline" onclick="openEditModal('${g._id}')" title="Edit"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteGrievance('${g._id}')" title="Delete"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}
