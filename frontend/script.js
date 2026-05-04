// Dynamically set API URL based on environment
const NODE_API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : window.location.origin + '/api';

// --- TOAST NOTIFICATIONS ---
window.showToast = function(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Wait for CSS transition
    }, 3000);
}

// --- GLOBAL AUTH UI CHECK ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('omnidata_token');
    if (!token) {
        // If not logged in, hide protected links across all pages
        document.querySelectorAll('.nav-links a[href="dashboard.html"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('#logout-btn').forEach(el => el.style.display = 'none');
    }
});

// --- THEME TOGGLE LOGIC ---
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('omnidata_theme') || 'dark';

if (currentTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if(themeToggle) themeToggle.textContent = '🌙';
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('omnidata_theme', 'dark');
            themeToggle.textContent = '☀️';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('omnidata_theme', 'light');
            themeToggle.textContent = '🌙';
        }
    });
}

// --- LOGIN PAGE LOGIC ---
if (document.getElementById('login-form')) {
    let authMode = 'login'; // can be 'login' or 'register'
    const toggleBtn = document.getElementById('toggle-auth-mode');
    const submitBtn = document.getElementById('auth-submit-btn').querySelector('.btn-text');
    const titleText = document.querySelector('.login-card h2');
    const subtitleText = document.querySelector('.login-card p.subtitle');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const submitBtnSpan = document.getElementById('auth-submit-btn').querySelector('.btn-text');
            if (authMode === 'login') {
                authMode = 'register';
                titleText.textContent = 'Create Account';
                subtitleText.textContent = 'Register securely to access Count Data.';
                if (submitBtnSpan) submitBtnSpan.textContent = 'REGISTER & INITIALIZE';
                toggleBtn.textContent = 'Already have an account? Log in securely.';
            } else {
                authMode = 'login';
                titleText.textContent = 'Welcome Back';
                subtitleText.textContent = 'Authenticate to access the prediction engine.';
                if (submitBtnSpan) submitBtnSpan.textContent = 'INITIALIZE SYSTEM';
                toggleBtn.textContent = 'Need an account? Create one securely.';
            }
        });
    }

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const btnSpan = document.getElementById('auth-submit-btn').querySelector('.btn-text');
        const originalText = btnSpan.textContent;
        
        if (authMode === 'register') {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/;
            if (!passwordRegex.test(password)) {
                showToast('Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.', 'error');
                return;
            }
        }

        btnSpan.textContent = 'AUTHENTICATING...';

        try {
            const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
            const res = await fetch(`${NODE_API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('omnidata_token', data.token);
                localStorage.setItem('omnidata_user', data.username);
                window.location.href = 'dashboard.html';
            } else {
                showToast(data.error || 'Authentication failed', 'error');
                btnSpan.textContent = originalText;
            }
        } catch (error) {
            console.error(error);
            showToast('Server is down. Is Node.js running on port 5000?', 'error');
            btnSpan.textContent = originalText;
        }
    });
}

// --- DASHBOARD LOGIC ---
if (document.getElementById('prediction-form')) {
    // Auth Check
    const token = localStorage.getItem('omnidata_token');
    if (!token) {
        window.location.href = 'index.html';
    }

    // Set Welcome User
    const username = localStorage.getItem('omnidata_user');
    if (username) {
        const welcomeBadge = document.getElementById('welcome-badge');
        if (welcomeBadge) {
            welcomeBadge.textContent = `Welcome, ${username}`;
            welcomeBadge.style.textTransform = 'uppercase';
        }
    }

    // Fetch History on load
    fetchHistory();

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('omnidata_token');
        localStorage.removeItem('omnidata_user');
        window.location.href = 'index.html';
    });

    // --- RANGE SLIDER LOGIC ---
    const sliderIds = ['age', 'streaming_hours', 'gaming_hours', 'social_media_hours', 'wifi_ratio', 'weekend_usage_ratio'];
    sliderIds.forEach(id => {
        const el = document.getElementById(id);
        const valEl = document.getElementById(id + '_val');
        if(el && valEl) {
            el.addEventListener('input', () => {
                valEl.textContent = el.value;
            });
        }
    });

    // --- QUICK PROFILES LOGIC ---
    const profiles = {
        student: { age: 20, streaming_hours: 4.0, gaming_hours: 3.5, social_media_hours: 5.0, wifi_ratio: 0.8, weekend_usage_ratio: 0.4, calls_made: 50, sms_sent: 120, estimated_salary: 0, background_data_mb: 500, telecom_partner: "Reliance Jio", city: "Delhi" },
        worker: { age: 35, streaming_hours: 1.5, gaming_hours: 0.5, social_media_hours: 1.5, wifi_ratio: 0.9, weekend_usage_ratio: 0.2, calls_made: 300, sms_sent: 40, estimated_salary: 120000, background_data_mb: 200, telecom_partner: "Airtel", city: "Bangalore" },
        gamer: { age: 24, streaming_hours: 3.0, gaming_hours: 8.0, social_media_hours: 2.0, wifi_ratio: 0.95, weekend_usage_ratio: 0.5, calls_made: 30, sms_sent: 10, estimated_salary: 40000, background_data_mb: 800, telecom_partner: "Airtel", city: "Mumbai" }
    };

    document.querySelectorAll('.quick-profile-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const profileId = e.target.getAttribute('data-profile');
            const data = profiles[profileId];
            if(!data) return;
            
            Object.keys(data).forEach(key => {
                const el = document.getElementById(key);
                if(el) {
                    el.value = data[key];
                    if (sliderIds.includes(key)) {
                        document.getElementById(key + '_val').textContent = data[key];
                    }
                }
            });
            showToast("Profile loaded successfully!", "success");
        });
    });

    // 1. Prediction API Submission
    // --- BASELINE COMPARISON LOGIC ---
    let currentBaseline = null;
    const pinBaselineBtn = document.getElementById('pin-baseline-btn');
    const clearBaselineBtn = document.getElementById('clear-baseline-btn');
    const baselineDeltaEl = document.getElementById('baseline-delta');

    if (pinBaselineBtn) {
        pinBaselineBtn.addEventListener('click', () => {
            const currentVal = parseFloat(document.getElementById('data-value').textContent);
            if (!isNaN(currentVal) && currentVal > 0) {
                currentBaseline = currentVal;
                pinBaselineBtn.textContent = '📍 Baseline Set';
                pinBaselineBtn.style.background = 'var(--accent-purple)';
                pinBaselineBtn.style.color = 'white';
                clearBaselineBtn.style.display = 'inline-block';
                showToast(`Baseline pinned at ${currentBaseline} GB`, 'success');
                baselineDeltaEl.style.display = 'none'; // hide until next predict
            } else {
                showToast('Run a prediction first before pinning.', 'error');
            }
        });
    }

    if (clearBaselineBtn) {
        clearBaselineBtn.addEventListener('click', () => {
            currentBaseline = null;
            pinBaselineBtn.textContent = '📌 Pin Baseline';
            pinBaselineBtn.style.background = 'rgba(59, 130, 246, 0.1)';
            pinBaselineBtn.style.color = 'var(--accent-blue)';
            clearBaselineBtn.style.display = 'none';
            baselineDeltaEl.style.display = 'none';
            showToast('Baseline cleared.', 'success');
        });
    }

    // --- PREDICTION LOGIC ---
    const form = document.getElementById('prediction-form');
    const resultBox = document.getElementById('prediction-result');
    const dataValue = document.getElementById('data-value');
    const predictBtn = document.getElementById('predict-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            telecom_partner: document.getElementById('telecom_partner').value,
            gender: document.getElementById('gender').value,
            age: parseInt(document.getElementById('age').value),
            city: document.getElementById('city').value,
            num_dependents: parseInt(document.getElementById('num_dependents').value),
            estimated_salary: parseFloat(document.getElementById('estimated_salary').value),
            calls_made: parseInt(document.getElementById('calls_made').value),
            sms_sent: parseInt(document.getElementById('sms_sent').value),
            streaming_hours: parseFloat(document.getElementById('streaming_hours').value),
            gaming_hours: parseFloat(document.getElementById('gaming_hours').value),
            social_media_hours: parseFloat(document.getElementById('social_media_hours').value),
            wifi_ratio: parseFloat(document.getElementById('wifi_ratio').value),
            weekend_usage_ratio: parseFloat(document.getElementById('weekend_usage_ratio').value),
            background_data_mb: parseFloat(document.getElementById('background_data_mb').value),
            auto_update: parseInt(document.getElementById('auto_update').value)
        };

        // Form Validation Constraints
        const totalScreenTime = payload.streaming_hours + payload.gaming_hours + payload.social_media_hours;
        if (totalScreenTime > 24) {
            showToast('Validation Error: The sum of Streaming, Gaming, and Social Media hours cannot exceed 24 hours per day.', 'error');
            return;
        }

        if (payload.estimated_salary < 0 || payload.estimated_salary > 10000000) {
            showToast('Validation Error: Estimated salary must be between ₹0 and ₹1,00,00,000 (1 Crore).', 'error');
            return;
        }

        const originalText = predictBtn.innerHTML;
        predictBtn.innerHTML = '<span class="loading-pulse">⚡ Analyzing Neural Model...</span>';
        predictBtn.style.opacity = '0.8';

        try {
            // Call Node API which routes to FastAPI and saves to MongoDB
            let response;
            let data;
            let retries = 4; // Try up to 4 times (max 40 seconds of waiting)
            
            while (retries > 0) {
                response = await fetch(`${NODE_API_URL}/predict`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                // Render returns 502/504 when upstream is booting
                if (response.status === 502 || response.status === 504) {
                    retries--;
                    if (retries > 0) {
                        predictBtn.innerHTML = '<span class="loading-pulse">☕ Waking up AI Engine (this takes ~30s)...</span>';
                        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds before next try
                        continue;
                    }
                }
                
                data = await response.json();
                break;
            }

            predictBtn.innerHTML = originalText;

            if (response.ok) {
                resultBox.classList.remove('hidden');
                animateValue("data-value", 0, data.predicted_data_used_gb, 1500);
                
                // Compare with Baseline
                if (currentBaseline !== null && baselineDeltaEl) {
                    const diff = data.predicted_data_used_gb - currentBaseline;
                    baselineDeltaEl.style.display = 'block';
                    if (diff > 0) {
                        baselineDeltaEl.innerHTML = `<span style="color: #ef4444;">⬆️ +${diff.toFixed(2)} GB vs Baseline</span>`;
                    } else if (diff < 0) {
                        baselineDeltaEl.innerHTML = `<span style="color: var(--accent-green);">⬇️ ${diff.toFixed(2)} GB vs Baseline</span>`;
                    } else {
                        baselineDeltaEl.innerHTML = `<span style="color: var(--text-secondary);">➖ No change vs Baseline</span>`;
                    }
                }
                
                // Render XAI
                const xaiContainer = document.getElementById('xai-container');
                const xaiList = document.getElementById('xai-list');
                if (data.explanations && data.explanations.length > 0) {
                    xaiContainer.style.display = 'block';
                    xaiList.innerHTML = data.explanations.map(exp => `
                        <div style="font-size: 0.85rem; padding: 6px; border-left: 3px solid ${exp.effect === 'positive' ? 'var(--accent-pink)' : (exp.effect === 'negative' ? 'var(--accent-green)' : 'var(--text-muted)')};">
                            <strong>${exp.feature}</strong>: ${exp.text}
                        </div>
                    `).join('');
                } else {
                    xaiContainer.style.display = 'none';
                }



                // Refresh History & Live Charts
                fetchHistory();
                if (typeof fetchAndRenderAnalytics === 'function') {
                    fetchAndRenderAnalytics().catch(() => {});
                }
            } else {
                showToast('Prediction Error: ' + (data.error || data.detail || 'Unknown error'), 'error');
            }
            
        } catch (error) {
            console.error(error);
            // Only show this error if not a 502 retry issue
            if (error.name !== 'SyntaxError') {
                showToast('Failed to connect to the Node Backend (Port 5000). Ensure it is running.', 'error');
            }
            predictBtn.innerHTML = originalText;
        } finally {
            predictBtn.style.opacity = '1';
        }
    });

    async function fetchHistory() {
        try {
            const historyContainer = document.getElementById('history-list');
            if (historyContainer) {
                historyContainer.innerHTML = `
                    <div class="history-item skeleton"><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>
                    <div class="history-item skeleton"><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>
                    <div class="history-item skeleton"><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>
                `;
            }

            const response = await fetch(`${NODE_API_URL}/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const history = await response.json();
            window.currentHistoryData = history; // Save for export
            
            if (historyContainer && response.ok) {
                historyContainer.innerHTML = '';
                if (history.length === 0) {
                    historyContainer.innerHTML = '<p class="text-xs">No prediction history found.</p>';
                }
                history.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'history-item';
                    div.innerHTML = `
                        <div>
                            <strong>${new Date(item.timestamp).toLocaleString()}</strong><br>
                            <span class="text-xs">Partner: ${item.inputs.telecom_partner} | Age: ${item.inputs.age}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="text-green" style="font-weight: bold;">
                                ${item.predicted_data_used_gb.toFixed(2)} GB
                            </div>
                            <button class="delete-record-btn" data-id="${item._id}" style="background: none; border: none; cursor: pointer; color: #dc3545; font-size: 1.1rem; opacity: 0.8; transition: 0.2s;" title="Delete Record">✖️</button>
                        </div>
                    `;
                    historyContainer.appendChild(div);
                });

                // Attach event listeners for delete buttons
                document.querySelectorAll('.delete-record-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.target.getAttribute('data-id');
                        if (confirm("Delete this prediction record?")) {
                            try {
                                const response = await fetch(`${NODE_API_URL}/history/${id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (response.ok) {
                                    fetchHistory();
                                    if (typeof fetchAndRenderAnalytics === 'function') fetchAndRenderAnalytics();
                                    showToast("Record deleted successfully.");
                                } else {
                                    showToast("Failed to delete record.", 'error');
                                }
                            } catch (err) {
                                console.error("Error deleting record", err);
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    }

    // CSV Export Logic
    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!window.currentHistoryData || window.currentHistoryData.length === 0) {
                showToast("No history to export.", 'error');
                return;
            }

            // Define CSV headers
            const headers = ['Timestamp', 'Telecom Partner', 'Gender', 'Age', 'City', 'Salary', 'Predicted Data (GB)'];
            
            // Map JSON data to CSV rows
            const csvRows = window.currentHistoryData.map(item => {
                return [
                    new Date(item.timestamp).toISOString(),
                    item.inputs.telecom_partner,
                    item.inputs.gender,
                    item.inputs.age,
                    item.inputs.city,
                    item.inputs.estimated_salary,
                    item.predicted_data_used_gb.toFixed(2)
                ].join(',');
            });

            // Combine headers and rows
            const csvString = [headers.join(','), ...csvRows].join('\n');
            
            // Create a Blob and trigger download
            const blob = new Blob([csvString], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'countdata_prediction_report.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    function animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = (progress * (end - start) + start).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1});
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1});
            }
        };
        window.requestAnimationFrame(step);
    }

    // 2. Initialize Visual Charts (Live Dynamic Data from MongoDB)
    Chart.defaults.color = '#8b8f9e';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    let scatterChart, barChart, radarChart;

    async function fetchAndRenderAnalytics() {
        try {
            const response = await fetch(`${NODE_API_URL}/history/analytics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return;
            const data = await response.json();

            // Scatter Chart (Salary vs Data)
            const scatterCtx = document.getElementById('scatterChart').getContext('2d');
            if (scatterChart) scatterChart.destroy();
            scatterChart = new Chart(scatterCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Customers',
                        data: data.scatterData.length > 0 ? data.scatterData : [{x: 0, y: 0}],
                        backgroundColor: '#3B82F6',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { color: '#2A2A35' }, title: {display: true, text: 'Salary'} },
                        y: { grid: { color: '#2A2A35' }, title: {display: true, text: 'Data (MB)'} }
                    },
                    plugins: { legend: { display: false } }
                }
            });

            // Bar Chart (Salary Brackets)
            const barCtx = document.getElementById('barChart').getContext('2d');
            if (barChart) barChart.destroy();
            const barLabels = data.salaryData.map(d => d._id === "150k+" ? "150k+" : `${d._id / 1000}k`);
            const barValues = data.salaryData.map(d => d.avgData);
            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: barLabels.length > 0 ? barLabels : ['No Data'],
                    datasets: [{
                        data: barValues.length > 0 ? barValues : [0],
                        backgroundColor: ['#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#3B82F6'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: '#2A2A35' } }
                    },
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Avg Data: ${c.raw.toFixed(2)} GB` } } }
                }
            });

            // Radar Chart (Data by City)
            const radarCtx = document.getElementById('radarChart').getContext('2d');
            if (radarChart) radarChart.destroy();
            const radarLabels = data.cityData.map(d => d._id);
            const radarValues = data.cityData.map(d => d.avgData);
            radarChart = new Chart(radarCtx, {
                type: 'radar',
                data: {
                    labels: radarLabels.length > 0 ? radarLabels : ['No Data'],
                    datasets: [{
                        label: 'Avg Data (GB)',
                        data: radarValues.length > 0 ? radarValues : [0],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3B82F6',
                        pointBackgroundColor: '#3B82F6',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: '#2A2A35' },
                            grid: { color: '#2A2A35' },
                            pointLabels: { color: '#A0A0A0', font: { size: 11 } },
                            ticks: { display: false }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        }
    }

    // Call it on load
    fetchAndRenderAnalytics();

    // Manual Refresh Button Logic
    const refreshChartsBtn = document.getElementById('refresh-charts-btn');
    if (refreshChartsBtn) {
        refreshChartsBtn.addEventListener('click', () => {
            const originalText = refreshChartsBtn.textContent;
            refreshChartsBtn.textContent = '🔄 Refreshing...';
            refreshChartsBtn.style.opacity = '0.7';
            
            fetchAndRenderAnalytics().then(() => {
                setTimeout(() => {
                    refreshChartsBtn.textContent = originalText;
                    refreshChartsBtn.style.opacity = '1';
                }, 500); // Small delay for visual feedback
            });
        });
    }

    // Clear Data Button Logic (Top Dashboard)
    const clearGraphsBtn = document.getElementById('clear-graphs-btn');
    const clearHistoryListBtn = document.getElementById('clear-history-list-btn');
    
    async function handleClearHistory(btnElement) {
        if (confirm("Are you sure you want to delete all prediction history? This will clear the charts and log.")) {
            try {
                const originalText = btnElement.textContent;
                btnElement.textContent = '🗑️ Clearing...';
                
                const response = await fetch(`${NODE_API_URL}/history/clear`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    fetchHistory();
                    fetchAndRenderAnalytics();
                    const valEl = document.getElementById('data-value');
                    if (valEl) valEl.textContent = '0';
                    const xaiEl = document.getElementById('xai-container');
                    if (xaiEl) xaiEl.style.display = 'none';
                    showToast("History cleared successfully.");
                } else {
                    showToast("Failed to clear history.", 'error');
                }
                btnElement.textContent = originalText;
            } catch (error) {
                console.error("Clear error", error);
                showToast("Error clearing history.", 'error');
            }
        }
    }

    if (clearGraphsBtn) clearGraphsBtn.addEventListener('click', () => handleClearHistory(clearGraphsBtn));
    if (clearHistoryListBtn) clearHistoryListBtn.addEventListener('click', () => handleClearHistory(clearHistoryListBtn));
}
