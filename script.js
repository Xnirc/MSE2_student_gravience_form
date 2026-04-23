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
    } else {
        showView('auth-view');
    }
});

// --- UI Helpers ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    if (tab === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// --- Auth Functions ---
async function handleLogin(e) {
    e.preventDefault();
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
            showView('dashboard-view');
            fetchGrievances();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Server error', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
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
        showToast('Server error', 'error');
    }
}

function handleLogout() {
    token = null;
    localStorage.removeItem('token');
    showView('auth-view');
    showToast('Logged out successfully');
}

// --- Grievance Functions ---
async function fetchGrievances(query = '') {
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
        }
    } catch (err) {
        showToast('Failed to fetch grievances', 'error');
    }
}

async function handleSubmitGrievance(e) {
    e.preventDefault();
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
        showToast('Server error', 'error');
    }
}

async function deleteGrievance(id) {
    if (!confirm('Are you sure you want to delete this grievance?')) return;
    
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
        showToast('Server error', 'error');
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
    document.getElementById('edit-status').value = g.status;
    
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

async function handleUpdateGrievance(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('edit-title').value;
    const category = document.getElementById('edit-category').value;
    const description = document.getElementById('edit-desc').value;
    const status = document.getElementById('edit-status').value;

    try {
        const res = await fetch(`${API_URL}/grievances/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, category, description, status })
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
        showToast('Server error', 'error');
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
function renderGrievances() {
    const list = document.getElementById('grievance-list');
    list.innerHTML = '';
    
    if (currentGrievances.length === 0) {
        list.innerHTML = '<p class="text-center text-muted">No grievances found.</p>';
        return;
    }

    currentGrievances.forEach(g => {
        const date = new Date(g.date).toLocaleDateString();
        const badgeClass = g.status === 'Pending' ? 'badge-pending' : 'badge-resolved';
        
        const item = document.createElement('div');
        item.className = 'grievance-item';
        item.innerHTML = `
            <div class="g-header">
                <div class="g-title">${g.title}</div>
                <span class="badge ${badgeClass}">${g.status}</span>
            </div>
            <div class="g-meta">
                <span>Category: ${g.category}</span>
                <span>Date: ${date}</span>
            </div>
            <div class="g-desc">${g.description}</div>
            <div class="g-actions">
                <button class="btn btn-sm btn-outline" onclick="openEditModal('${g._id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteGrievance('${g._id}')">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}
