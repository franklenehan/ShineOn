// Main Application Script for Frank's Cancer Journey
// Handles page-specific functionality and UI interactions

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Application starting...');
    
    // Initialize StorageAPI
    try {
        console.log('📦 Initializing StorageAPI...');
        await StorageAPI.initDB();
        console.log('✅ StorageAPI initialized successfully');
    } catch (error) {
        console.error('❌ StorageAPI initialization failed:', error);
    }
    
    // Initialize page-specific functionality based on current page
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    console.log('📄 Current page:', page);

    // Route to appropriate page handler
    switch(page) {
        case 'index.html':
        case '':
            console.log('🏠 Initializing Index page...');
            initIndexPage();
            break;
        case 'treatments.html':
            console.log('💊 Initializing Treatments page...');
            initTreatmentsPage();
            break;
        case 'tracker.html':
            console.log('📊 Initializing Tracker page...');
            initTrackerPage();
            break;
        case 'future.html':
            console.log('🌟 Initializing Future page...');
            initFuturePage();
            break;
        default:
            console.log('📄 Loading default page...');
            break;
    }
});

// Simple helper: check if user is logged in via get_user.php
async function ensureLoggedInForFocus() {
    try {
        const response = await fetch('get_user.php', { method: 'GET' });
        if (!response.ok) return false;

        const data = await response.json();
        if (data && data.logged_in) {
            return true;
        }
    } catch (e) {
        console.warn('Could not check login state for Today\'s Focus:', e);
    }

    alert('You need to be logged in to record or view your results. Please use the Login button at the top of the page.');
    return false;
}

// Index Page Functionality
async function initIndexPage() {
    console.log('🏠 Index page: Loading components...');
    
    // Initialize daily reflection
    initDailyReflection();

    // Initialize wellbeing progress modal
    initProgressModal();

    // Update quick stats (still using StorageAPI for now)
    await updateQuickStats();

    // Initialize weekly stats chart (7 days of wellbeing ratings)
    await initWeeklyStatsChart();
    
    console.log('✅ Index page initialized');
}

// Weekly Stats Chart (last 7 days of wellbeing ratings)
async function initWeeklyStatsChart() {
    const canvas = document.getElementById('adherence-chart');
    if (!canvas || typeof Chart === 'undefined') {
        console.warn('📉 Weekly stats chart: canvas or Chart.js not available');
        return;
    }

    try {
        const res = await fetch('progress-weekly.php');
        if (!res.ok) {
            console.error('❌ Failed to load weekly progress data');
            return;
        }

        const data = await res.json();
        if (!data || !data.success) {
            console.error('❌ Weekly progress response invalid:', data);
            return;
        }

        const labels = data.labels || [];
        const series = data.series || {};

        // Use short day labels for x-axis (e.g., Mon, Tue) while preserving order
        const dayLabels = labels.map(d => {
            const dt = new Date(d + 'T00:00:00');
            return dt.toLocaleDateString(undefined, { weekday: 'short' });
        });

        const ctx = canvas.getContext('2d');

        const datasets = [
            {
                key: 'overall_wellbeing',
                label: 'Overall wellbeing',
                borderColor: '#1f77b4',
                backgroundColor: 'rgba(31, 119, 180, 0.15)'
            },
            {
                key: 'mood_emotional',
                label: 'Mood / Emotional state',
                borderColor: '#ff7f0e',
                backgroundColor: 'rgba(255, 127, 14, 0.15)'
            },
            {
                key: 'energy_fatigue',
                label: 'Energy / Fatigue',
                borderColor: '#2ca02c',
                backgroundColor: 'rgba(44, 160, 44, 0.15)'
            },
            {
                key: 'pain_discomfort',
                label: 'Pain / Discomfort',
                borderColor: '#d62728',
                backgroundColor: 'rgba(214, 39, 40, 0.15)'
            },
            {
                key: 'mental_clarity',
                label: 'Mental clarity',
                borderColor: '#9467bd',
                backgroundColor: 'rgba(148, 103, 189, 0.15)'
            },
            {
                key: 'sleep_quality',
                label: 'Sleep quality',
                borderColor: '#8c564b',
                backgroundColor: 'rgba(140, 86, 75, 0.15)'
            },
            {
                key: 'feeling_supported',
                label: 'Feeling supported',
                borderColor: '#e377c2',
                backgroundColor: 'rgba(227, 119, 194, 0.15)'
            },
            {
                key: 'hope_meaning',
                label: 'Hope / Meaning',
                borderColor: '#17becf',
                backgroundColor: 'rgba(23, 190, 207, 0.15)'
            }
        ].map(def => ({
            label: def.label,
            data: (series[def.key] || []).map(v => (v === null ? null : Number(v))),
            borderColor: def.borderColor,
            backgroundColor: def.backgroundColor,
            tension: 0.3,
            spanGaps: true,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 4,
        }));

        // Destroy any existing chart instance attached to this canvas to avoid duplicates
        if (canvas._weeklyChartInstance) {
            canvas._weeklyChartInstance.destroy();
        }

        canvas._weeklyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dayLabels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            // Show full date + value in tooltip
                            title: (items) => {
                                const index = items[0].dataIndex;
                                return labels[index] || '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 1,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Rating (1–5)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Last 7 days'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Error initializing weekly stats chart:', error);
    }
}

// Wellbeing Progress (Today) Functionality
function initProgressModal() {
    const openBtn = document.getElementById('open-progress-modal-btn');
    const modalEl = document.getElementById('progressModal');
    const saveBtn = document.getElementById('save-progress-btn');
    const saveStatus = document.getElementById('progress-save-status');

    if (!openBtn || !modalEl || !saveBtn) {
        return; // Not on this page or modal not present
    }

    const modal = new bootstrap.Modal(modalEl);

    // Helper: get today's date as YYYY-MM-DD
    function getTodayISO() {
        return new Date().toISOString().split('T')[0];
    }

    // Render rating scales with 1–5 emoji-style buttons
    function renderRatingScales() {
        const scales = modalEl.querySelectorAll('.rating-scale');
        scales.forEach(scale => {
            const field = scale.getAttribute('data-field');
            if (!field) return;

            const labels = ['Very low', 'Low', 'Okay', 'Good', 'Excellent'];
            const icons  = ['emoji-frown', 'emoji-expressionless', 'emoji-neutral', 'emoji-smile', 'emoji-laughing'];

            let html = '<div class="btn-group" role="group" aria-label="' + field + ' rating">';
            for (let i = 1; i <= 5; i++) {
                const icon = icons[i - 1];
                html += `
                    <button type="button" class="btn btn-light btn-sm rating-option" data-value="${i}">
                        <i class="bi bi-${icon}"></i>
                    </button>
                `;
            }
            html += '</div>';
            html += '<div class="d-flex justify-content-between mt-1 small text-muted"><span>Low</span><span>High</span></div>';

            scale.innerHTML = html;

            const options = scale.querySelectorAll('.rating-option');
            options.forEach(btn => {
                btn.addEventListener('click', function () {
                    const value = this.getAttribute('data-value');
                    scale.setAttribute('data-value', value);

                    options.forEach(o => o.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        });
    }

    // Set current values into scales
    function applyRatings(ratings) {
        const scales = modalEl.querySelectorAll('.rating-scale');
        scales.forEach(scale => {
            const field = scale.getAttribute('data-field');
            const val = ratings && ratings[field] ? parseInt(ratings[field], 10) : 0;
            scale.setAttribute('data-value', val > 0 ? String(val) : '');

            const options = scale.querySelectorAll('.rating-option');
            options.forEach(btn => {
                const btnVal = parseInt(btn.getAttribute('data-value'), 10);
                if (val === btnVal) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        });
    }

    async function loadTodayProgress() {
        const today = getTodayISO();
        try {
            const res = await fetch(`progress-get.php?date=${encodeURIComponent(today)}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data && data.success) {
                applyRatings(data.ratings);
            }
        } catch (e) {
            console.error('Error loading today\'s progress:', e);
        }
    }

    // Check whether there are already saved ratings for today
    async function hasTodayProgress() {
        const today = getTodayISO();
        try {
            const res = await fetch(`progress-get.php?date=${encodeURIComponent(today)}`);
            if (!res.ok) return false;
            const data = await res.json();
            if (!data || !data.success || !data.ratings) return false;

            const ratings = data.ratings;
            for (const key in ratings) {
                if (Object.prototype.hasOwnProperty.call(ratings, key)) {
                    const val = ratings[key];
                    if (val !== null && val !== undefined) {
                        return true;
                    }
                }
            }
        } catch (e) {
            console.warn('Error checking today\'s progress:', e);
        }
        return false;
    }

    async function saveTodayProgress() {
        const today = getTodayISO();
        const scales = modalEl.querySelectorAll('.rating-scale');
        const payload = new URLSearchParams();
        payload.append('date', today);

        let allValid = true;

        scales.forEach(scale => {
            const field = scale.getAttribute('data-field');
            const value = parseInt(scale.getAttribute('data-value') || '0', 10);
            if (!field || value < 1 || value > 5) {
                allValid = false;
            } else {
                payload.append(field, String(value));
            }
        });

        if (!allValid) {
            if (saveStatus) {
                saveStatus.textContent = 'Please choose a score from 1 to 5 for each question.';
                saveStatus.classList.remove('text-success');
                saveStatus.classList.add('text-danger');
            }
            return;
        }

        try {
            saveBtn.disabled = true;
            if (saveStatus) {
                saveStatus.textContent = 'Saving...';
                saveStatus.classList.remove('text-danger');
                saveStatus.classList.add('text-muted');
            }

            const res = await fetch('progress-save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: payload.toString(),
            });

            const data = await res.json();
            if (data && data.success) {
                if (saveStatus) {
                    saveStatus.textContent = 'Saved.';
                    saveStatus.classList.remove('text-danger', 'text-muted');
                    saveStatus.classList.add('text-success');
                }
                setTimeout(() => {
                    modal.hide();
                    if (saveStatus) saveStatus.textContent = '';
                }, 800);
            } else {
                if (saveStatus) {
                    saveStatus.textContent = (data && data.message) || 'Error saving ratings.';
                    saveStatus.classList.remove('text-muted', 'text-success');
                    saveStatus.classList.add('text-danger');
                }
            }
        } catch (e) {
            console.error('Error saving today\'s progress:', e);
            if (saveStatus) {
                saveStatus.textContent = 'Error saving ratings.';
                saveStatus.classList.remove('text-muted', 'text-success');
                saveStatus.classList.add('text-danger');
            }
        } finally {
            saveBtn.disabled = false;
        }
    }

    // Initial render of rating buttons
    renderRatingScales();

    // Open modal and load current values (login required)
    openBtn.addEventListener('click', async function () {
        const ok = await ensureLoggedInForFocus();
        if (!ok) return;

        const alreadyDone = await hasTodayProgress();
        if (alreadyDone) {
            alert('Your wellness stats are already complete for today. Please come back tomorrow to complete them again.');
            return;
        }

        await loadTodayProgress();
        if (saveStatus) saveStatus.textContent = '';
        modal.show();
    });

    // Save handler
    saveBtn.addEventListener('click', function () {
        saveTodayProgress();
    });
}

// Daily Reflection Functionality (backed by database, one per day)
function initDailyReflection() {
    const reflectionTextarea = document.getElementById('daily-reflection');
    const saveReflectionBtn = document.getElementById('save-reflection-btn');
    const reflectionStatus = document.getElementById('reflection-status');
    const pastBtn = document.getElementById('past-reflections-btn');
    const pastPanel = document.getElementById('past-reflections-panel');
    const datePicker = document.getElementById('reflection-date-picker');

    if (!reflectionTextarea) return;

    // Helper: format today as YYYY-MM-DD
    function getTodayISO() {
        return new Date().toISOString().split('T')[0];
    }

    // Track whether we are viewing a past reflection (read-only mode)
    let viewingPast = false;
    let viewingDate = getTodayISO();

    function setStatus(message, type) {
        if (!reflectionStatus) return;
        reflectionStatus.textContent = message;
        reflectionStatus.classList.remove('text-muted', 'text-success', 'text-danger');
        if (type === 'success') {
            reflectionStatus.classList.add('text-success');
        } else if (type === 'error') {
            reflectionStatus.classList.add('text-danger');
        } else {
            reflectionStatus.classList.add('text-muted');
        }
    }

    async function loadReflectionForDate(dateStr) {
        try {
            const res = await fetch(`reflections-get.php?date=${encodeURIComponent(dateStr)}`);
            if (!res.ok) {
                console.error('Failed to load reflection for date', dateStr);
                return;
            }
            const data = await res.json();
            if (!data || !data.success) {
                return;
            }

            const reflection = data.reflection;
            if (reflection && reflection.content) {
                reflectionTextarea.value = reflection.content;
                setStatus(`Viewing reflection from ${dateStr}${dateStr === getTodayISO() ? ' (today)' : ''}.`, 'success');
            } else {
                reflectionTextarea.value = '';
                setStatus(`No reflection saved for ${dateStr}.`, 'muted');
            }
        } catch (error) {
            console.error('Error loading reflection:', error);
        }
    }

    async function saveTodayReflection() {
        const today = getTodayISO();
        const content = reflectionTextarea.value.trim();

        if (!content) {
            setStatus('Reflection cannot be empty.', 'error');
            return;
        }

        try {
            setStatus('Saving...', 'muted');
            if (saveReflectionBtn) {
                saveReflectionBtn.disabled = true;
            }

            const payload = new URLSearchParams();
            payload.append('date', today);
            payload.append('content', content);

            const res = await fetch('reflections-save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: payload.toString(),
            });

            const data = await res.json();
            if (data && data.success) {
                setStatus('Reflection saved for today.', 'success');
            } else {
                setStatus((data && data.message) || 'Error saving reflection.', 'error');
            }
        } catch (error) {
            console.error('Error saving reflection:', error);
            setStatus('Error saving reflection.', 'error');
        } finally {
            if (saveReflectionBtn) {
                saveReflectionBtn.disabled = false;
            }
        }
    }

    // Auto-load today's reflection on page load
    loadReflectionForDate(viewingDate);

    // Save button handler (login required)
    if (saveReflectionBtn) {
        saveReflectionBtn.addEventListener('click', async function () {
            const ok = await ensureLoggedInForFocus();
            if (!ok) return;

            if (viewingPast) {
                setStatus('You can only edit today\'s reflection. Use the date picker to view past entries.', 'error');
                return;
            }

            saveTodayReflection();
        });
    }

    // Past reflections button toggles the panel (login required)
    if (pastBtn && pastPanel && datePicker) {
        pastBtn.addEventListener('click', async function () {
            const ok = await ensureLoggedInForFocus();
            if (!ok) return;

            const isHidden = pastPanel.classList.contains('d-none');
            if (isHidden) {
                pastPanel.classList.remove('d-none');
                datePicker.value = viewingDate;
            } else {
                pastPanel.classList.add('d-none');
            }
        });

        // Date picker change: load selected date and toggle read-only state
        datePicker.addEventListener('change', function () {
            const selected = this.value;
            if (!selected) return;
            viewingDate = selected;
            const isToday = selected === getTodayISO();
            viewingPast = !isToday;
            reflectionTextarea.readOnly = viewingPast;
            loadReflectionForDate(selected);
        });
    }
}

// Update Quick Stats (from database per logged-in user)
async function updateQuickStats() {
    const completedChecklistsEl = document.getElementById('completed-checklists-today');
    const totalCheckinsEl = document.getElementById('total-checkins');
    const activeTreatmentsEl = document.getElementById('active-treatments');
    const totalSupplementsEl = document.getElementById('total-supplements');
    const daysTrackedEl = document.getElementById('days-tracked');

    // If the Quick Stats card isn’t on this page, nothing to do
    if (!completedChecklistsEl && !totalCheckinsEl && !activeTreatmentsEl && !totalSupplementsEl && !daysTrackedEl) {
        return;
    }

    try {
        const res = await fetch('stats-get.php');
        if (!res.ok) {
            console.error('❌ Failed to load quick stats');
            return;
        }

        const payload = await res.json();
        if (!payload || !payload.success) {
            console.error('❌ Quick stats response invalid:', payload);
            return;
        }

        const data = payload.data || {};

        if (completedChecklistsEl) {
            completedChecklistsEl.textContent = (data.checklists_complete != null) ? String(data.checklists_complete) : '0';
        }

        if (totalCheckinsEl) {
            totalCheckinsEl.textContent = (data.total_check_ins != null) ? String(data.total_check_ins) : '0';
        }

        if (activeTreatmentsEl) {
            activeTreatmentsEl.textContent = (data.active_treatments != null) ? String(data.active_treatments) : '0';
        }

        if (totalSupplementsEl) {
            totalSupplementsEl.textContent = (data.total_supplements != null) ? String(data.total_supplements) : '0';
        }

        if (daysTrackedEl) {
            daysTrackedEl.textContent = (data.days_tracked != null) ? String(data.days_tracked) : '0';
        }
    } catch (error) {
        console.error('❌ Error loading quick stats:', error);
    }
}

// Weekly Adherence Chart
async function initWeeklyAdherenceChart() {
    console.log('📊 Initializing weekly adherence chart...');
    
    const canvas = document.getElementById('adherence-chart');
    if (!canvas) {
        console.warn('⚠️ Adherence chart canvas not found');
        return;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js not loaded');
        return;
    }
    
    try {
        // Get last 7 days
        const dates = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        console.log('📅 Chart dates:', dates);
        
        // Get all checklist dates from storage
        const allChecklistDates = await StorageAPI.listChecklistDates();
        console.log('📋 All checklist dates:', allChecklistDates);
        
        // Calculate adherence for each day
        const adherenceData = [];
        for (const dateStr of dates) {
            if (allChecklistDates.includes(dateStr)) {
                const checklist = await StorageAPI.getChecklist(dateStr);
                if (checklist && checklist.supplements && checklist.supplements.length > 0) {
                    const total = checklist.supplements.length;
                    const completed = checklist.supplements.filter(s => s.completed).length;
                    const percentage = Math.round((completed / total) * 100);
                    adherenceData.push(percentage);
                    console.log(`📊 ${dateStr}: ${completed}/${total} = ${percentage}%`);
                } else {
                    adherenceData.push(0);
                    console.log(`📊 ${dateStr}: No supplements`);
                }
            } else {
                adherenceData.push(0);
                console.log(`📊 ${dateStr}: No checklist`);
            }
        }
        
        // Calculate weekly average
        const validDays = adherenceData.filter(val => val > 0);
        const average = validDays.length > 0 
            ? Math.round(validDays.reduce((sum, val) => sum + val, 0) / validDays.length)
            : 0;
        console.log(`📊 Weekly average: ${average}%`);
        
        // Update average badge
        const weeklyAverageEl = document.getElementById('weekly-average');
        if (weeklyAverageEl) {
            weeklyAverageEl.textContent = `${average}%`;
        }
        
        // Format dates for display (e.g., "Mon", "Tue")
        const labels = dates.map(dateStr => {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });
        
        // Create gradient
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(95, 168, 168, 0.8)');   // Teal
        gradient.addColorStop(1, 'rgba(74, 144, 164, 0.2)');   // Blue
        
        // Create chart
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Adherence %',
                    data: adherenceData,
                    backgroundColor: gradient,
                    borderColor: '#5FA8A8',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#5FA8A8',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#4A90A4',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                return `Adherence: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            font: {
                                size: 12
                            },
                            color: '#6c757d'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#6c757d'
                        },
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        
        console.log('✅ Weekly adherence chart created');
        
        // Store chart instance for potential updates
        window.adherenceChart = chart;
        
    } catch (error) {
        console.error('❌ Error creating adherence chart:', error);
    }
}

// Treatments Page Functionality
function initTreatmentsPage() {
    const treatmentForm = document.getElementById('treatment-form');
    const saveTreatmentBtn = document.getElementById('save-treatment-btn');
    const treatmentModal = document.getElementById('treatmentModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const exportBtn = document.getElementById('export-treatments-btn');
    const addTreatmentBtn = document.getElementById('add-treatment-btn');

    // My Supplements (master list) elements on Treatments page
    const masterForm = document.getElementById('master-supplement-form');
    const masterIdInput = document.getElementById('master-supplement-id');
    const masterNameInput = document.getElementById('master-supplement-name');
    const masterDoseInput = document.getElementById('master-supplement-dose');
    const masterNotesInput = document.getElementById('master-supplement-notes');
    const masterSaveBtn = document.getElementById('master-save-supplement-btn');
    const masterSaveLabel = document.getElementById('master-supplement-save-label');
    const masterTableBody = document.getElementById('master-supplements-body');
    let masterSupplements = [];

    let treatmentModalInstance, deleteModalInstance;
    let editingIndex = -1;
    let deleteIndex = -1;
    
    // Initialize Bootstrap modals
    if (treatmentModal) {
        treatmentModalInstance = new bootstrap.Modal(treatmentModal);
    }
    if (deleteConfirmModal) {
        deleteModalInstance = new bootstrap.Modal(deleteConfirmModal);
    }
    
    // Load and display treatments in table from backend
    async function loadTreatmentsTable() {
        let treatments = [];
        try {
            const response = await fetch('treatments-list.php', { method: 'GET' });
            if (!response.ok) {
                throw new Error('Failed to load treatments');
            }
            const data = await response.json();
            if (data && data.success && Array.isArray(data.treatments)) {
                treatments = data.treatments;
            } else {
                console.warn('Unexpected treatments-list response:', data);
            }
        } catch (error) {
            console.error('❌ Error loading treatments from server:', error);
        }
        const tbody = document.getElementById('treatments-table-body');
        const countEl = document.getElementById('total-treatments-count');
        
        if (countEl) {
            countEl.textContent = treatments.length;
        }
        
        if (treatments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-5">
                        <i class="bi bi-clipboard-plus" style="font-size: 3rem;"></i>
                        <p class="mt-2">No treatments recorded yet. Click "Add Treatment" to get started.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort by date (newest first)
        const sortedTreatments = [...treatments].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let html = '';
        sortedTreatments.forEach((treatment) => {
            const id = treatment.id;
            
            html += `
                <tr>
                    <td>${formatDate(treatment.date)}</td>
                    <td>
                        <span class="badge bg-primary">${treatment.type}</span>
                    </td>
                    <td>${treatment.clinic || '<span class="text-muted">—</span>'}</td>
                    <td>
                        <div class="treatment-notes">
                            ${treatment.notes ? truncateText(treatment.notes, 100) : '<span class="text-muted">No notes</span>'}
                        </div>
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-primary edit-treatment" data-id="${id}" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger delete-treatment" data-id="${id}" title="Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Attach event listeners
        attachTableEventListeners();
    }
    
    // Attach event listeners to table buttons
    function attachTableEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-treatment').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openEditModal(id);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-treatment').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openDeleteModal(id);
            });
        });
    }
    
    // Open modal for adding new treatment (login required)
    if (addTreatmentBtn) {
        addTreatmentBtn.addEventListener('click', async function() {
            const ok = await ensureLoggedInForFocus();
            if (!ok) return;

            if (!treatmentModalInstance) return;

            resetForm();
            editingIndex = -1;
            document.getElementById('treatmentModalLabel').innerHTML = '<i class="bi bi-clipboard-plus me-2"></i>Add Treatment';
            treatmentModalInstance.show();
        });
    }
    
    // Open modal for editing treatment
    async function openEditModal(id) {
        try {
            const response = await fetch('treatments-list.php', { method: 'GET' });
            const data = await response.json();
            const treatments = (data && data.success && Array.isArray(data.treatments)) ? data.treatments : [];
            const treatment = treatments.find(t => String(t.id) === String(id));

            if (!treatment) return;

            editingIndex = id;

            // Populate form
            document.getElementById('treatment-id').value = id;
            document.getElementById('treatment-date').value = treatment.date;
            document.getElementById('treatment-type').value = treatment.type;
            document.getElementById('treatment-clinic').value = treatment.clinic || '';
            document.getElementById('treatment-notes').value = treatment.notes || '';
            document.getElementById('treatment-attachments').value = treatment.attachments || '';

            // Update modal title
            document.getElementById('treatmentModalLabel').innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Treatment';

            // Show modal
            treatmentModalInstance.show();
        } catch (error) {
            console.error('❌ Error loading treatment for edit:', error);
            showAlert('Error loading treatment for editing.', 'danger');
        }
    }
    
    // Save treatment (add or edit)
    if (saveTreatmentBtn) {
        saveTreatmentBtn.addEventListener('click', function() {
            if (!validateForm()) {
                return;
            }
            
            // Build payload from the actual form so all fields are included
            const form = document.getElementById('treatment-form');
            const formData = new FormData(form);

            // Only send id when actually editing an existing DB record (id > 0)
            if (typeof editingIndex === 'number' && editingIndex > 0) {
                formData.set('id', editingIndex);
            } else {
                formData.delete('id');
            }

            // Convert to URL-encoded for PHP $_POST
            const params = new URLSearchParams(formData);

            fetch('treatments-save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            })
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    showAlert(editingIndex ? 'Treatment updated successfully!' : 'Treatment added successfully!', 'success');
                    loadTreatmentsTable();
                    treatmentModalInstance.hide();
                    resetForm();
                } else {
                    showAlert((data && data.message) || 'Error saving treatment.', 'danger');
                }
            })
            .catch(err => {
                console.error('❌ Error saving treatment:', err);
                showAlert('Error saving treatment.', 'danger');
            });
        });
    }
    
    // Form validation
    function validateForm() {
        const form = document.getElementById('treatment-form');
        
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return false;
        }
        
        return true;
    }
    
    // Reset form
    function resetForm() {
        const form = document.getElementById('treatment-form');
        if (form) {
            form.reset();
            form.classList.remove('was-validated');
        }
        editingIndex = -1;
    }
    
    // Open delete confirmation modal
    function openDeleteModal(id) {
        deleteIndex = id;
        deleteModalInstance.show();
    }
    
    // Confirm delete
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (deleteIndex) {
                const params = new URLSearchParams();
                params.append('id', deleteIndex);

                fetch('treatments-delete.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                })
                .then(res => res.json())
                .then(data => {
                    if (data && data.success) {
                        loadTreatmentsTable();
                        deleteModalInstance.hide();
                        showAlert('Treatment deleted successfully.', 'info');
                        deleteIndex = -1;
                    } else {
                        showAlert((data && data.message) || 'Error deleting treatment.', 'danger');
                    }
                })
                .catch(err => {
                    console.error('❌ Error deleting treatment:', err);
                    showAlert('Error deleting treatment.', 'danger');
                });
            }
        });
    }
    
    // Export to CSV
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const treatments = Storage.load('treatmentRecords') || [];
            
            if (treatments.length === 0) {
                showAlert('No treatments to export.', 'warning');
                return;
            }
            
            // Create CSV content
            const headers = ['Date', 'Treatment Type', 'Clinic/Location', 'Outcome/Notes', 'Attachments'];
            const csvRows = [headers.join(',')];
            
            treatments.forEach(treatment => {
                const row = [
                    treatment.date,
                    `"${treatment.type}"`,
                    `"${treatment.clinic || ''}"`,
                    `"${(treatment.notes || '').replace(/"/g, '""')}"`,
                    `"${treatment.attachments || ''}"`
                ];
                csvRows.push(row.join(','));
            });
            
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `treatment-records-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showAlert('Treatments exported successfully!', 'success');
        });
    }
    
    // Truncate text helper
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // Initial load
    loadTreatmentsTable();

    // --- Initialise My Supplements master list on Treatments page (if present) ---
    async function loadMasterSupplementsForTreatments() {
        const masterTableBody = document.getElementById('master-supplements-body');
        if (!masterTableBody) return;

        try {
            const response = await fetch('supplements-list.php', { method: 'GET' });
            if (!response.ok) {
                throw new Error('Network error loading supplements list');
            }

            const data = await response.json();
            if (!data || !data.success || !Array.isArray(data.supplements)) {
                throw new Error('Invalid supplements-list response');
            }

            const masterSupplements = data.supplements;

            if (masterSupplements.length === 0) {
                masterTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted py-3">
                            <i class="bi bi-info-circle me-1"></i>No supplements saved yet. Add your regular supplements above.
                        </td>
                    </tr>
                `;
                return;
            }

            let rowsHtml = '';
            masterSupplements.forEach(s => {
                rowsHtml += `
                    <tr data-id="${s.id}">
                        <td>${s.name ? s.name : ''}</td>
                        <td>${s.dosage ? s.dosage : ''}</td>
                        <td>${s.notes ? s.notes : ''}</td>
                        <td class="text-end">
                            <button type="button" class="btn btn-sm btn-outline-primary me-1 master-edit-btn" data-id="${s.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger master-delete-btn" data-id="${s.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            masterTableBody.innerHTML = rowsHtml;

            // Wire up edit/delete buttons
            masterTableBody.querySelectorAll('.master-edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const sup = masterSupplements.find(s => String(s.id) === String(id));
                    if (!sup) return;

                    const masterIdInput = document.getElementById('master-supplement-id');
                    const masterNameInput = document.getElementById('master-supplement-name');
                    const masterDoseInput = document.getElementById('master-supplement-dose');
                    const masterNotesInput = document.getElementById('master-supplement-notes');
                    const masterSaveLabel = document.getElementById('master-supplement-save-label');

                    if (masterIdInput) masterIdInput.value = sup.id;
                    if (masterNameInput) masterNameInput.value = sup.name || '';
                    if (masterDoseInput) masterDoseInput.value = sup.dosage || '';
                    if (masterNotesInput) masterNotesInput.value = sup.notes || '';
                    if (masterSaveLabel) masterSaveLabel.textContent = 'Update';
                });
            });

            masterTableBody.querySelectorAll('.master-delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (!id) return;
                    if (!confirm('Are you sure you want to delete this supplement from your list?')) return;

                    const params = new URLSearchParams();
                    params.append('id', id);

                    try {
                        const res = await fetch('supplements-delete.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: params.toString()
                        });
                        const result = await res.json();
                        if (result && result.success) {
                            showAlert('Supplement removed from your list.', 'info');
                            await loadMasterSupplementsForTreatments();
                        } else {
                            showAlert((result && result.message) || 'Error deleting supplement.', 'danger');
                        }
                    } catch (err) {
                        console.error('❌ Error deleting supplement:', err);
                        showAlert('Error deleting supplement.', 'danger');
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error loading master supplements:', error);
            masterTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-3">
                        <i class="bi bi-info-circle me-1"></i>You need to be logged in to view your supplements.
                    </td>
                </tr>
            `;
        }
    }

    function clearMasterFormForTreatments() {
        if (masterIdInput) masterIdInput.value = '';
        if (masterNameInput) masterNameInput.value = '';
        if (masterDoseInput) masterDoseInput.value = '';
        if (masterNotesInput) masterNotesInput.value = '';
        if (masterSaveLabel) masterSaveLabel.textContent = 'Add';
    }

    if (masterSaveBtn && masterForm) {
        masterSaveBtn.addEventListener('click', async function () {
            const ok = await ensureLoggedInForFocus();
            if (!ok) return;

            const masterNameInput = document.getElementById('master-supplement-name');
            const masterDoseInput = document.getElementById('master-supplement-dose');
            const masterNotesInput = document.getElementById('master-supplement-notes');
            const masterIdInput = document.getElementById('master-supplement-id');

            if (!masterNameInput || !masterDoseInput) return;

            const name = masterNameInput.value.trim();
            const dosage = masterDoseInput.value.trim();
            const notes = masterNotesInput ? masterNotesInput.value.trim() : '';
            const id = masterIdInput ? masterIdInput.value.trim() : '';

            if (!name || !dosage) {
                showAlert('Please enter supplement name and dosage.', 'warning');
                return;
            }

            const params = new URLSearchParams();
            params.append('name', name);
            params.append('dosage', dosage);
            if (notes) params.append('notes', notes);
            if (id) params.append('id', id);

            try {
                masterSaveBtn.disabled = true;

                const res = await fetch('supplements-save.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                });

                const data = await res.json();
                if (data && data.success) {
                    showAlert(id ? 'Supplement updated.' : 'Supplement added.', 'success');
                    clearMasterFormForTreatments();
                    await loadMasterSupplementsForTreatments();
                } else {
                    showAlert((data && data.message) || 'Error saving supplement.', 'danger');
                }
            } catch (err) {
                console.error('❌ Error saving supplement:', err);
                showAlert('Error saving supplement.', 'danger');
            } finally {
                masterSaveBtn.disabled = false;
            }
        });
    }

    // Load supplements into the My Supplements card when on Treatments page
    loadMasterSupplementsForTreatments();
}

// Tracker Page Functionality
async function initTrackerPage() {
    console.log('📊 Initializing Tracker page...');
    
    const datePicker = document.getElementById('date-picker');
    const supplementList = document.getElementById('supplement-list');
    const saveDayBtn = document.getElementById('save-day-btn');
    const selectedDateDisplay = document.getElementById('selected-date-display');

    // Master supplements (per-user) DOM elements
    const masterForm = document.getElementById('master-supplement-form');
    const masterIdInput = document.getElementById('master-supplement-id');
    const masterNameInput = document.getElementById('master-supplement-name');
    const masterDoseInput = document.getElementById('master-supplement-dose');
    const masterNotesInput = document.getElementById('master-supplement-notes');
    const masterSaveBtn = document.getElementById('master-save-supplement-btn');
    const masterSaveLabel = document.getElementById('master-supplement-save-label');
    const masterTableBody = document.getElementById('master-supplements-body');
    let masterSupplements = [];
    
    let currentDate = new Date().toISOString().split('T')[0];
    console.log('📅 Current date:', currentDate);
    
    // Set default date to today
    if (datePicker) {
        datePicker.value = currentDate;
        updateDateDisplay(currentDate);
    }
    
    // Update date display
    function updateDateDisplay(dateStr) {
        if (!selectedDateDisplay) return;
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date().toISOString().split('T')[0];
        
        if (dateStr === today) {
            selectedDateDisplay.textContent = 'Today';
        } else {
            selectedDateDisplay.textContent = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        console.log('📅 Date display updated:', selectedDateDisplay.textContent);
    }
    
    // --- Master Supplements (per-user list) ---

    async function loadMasterSupplements() {
        if (!masterTableBody) return;

        try {
            const response = await fetch('supplements-list.php', { method: 'GET' });
            if (!response.ok) {
                throw new Error('Network error loading supplements list');
            }

            const data = await response.json();
            if (!data || !data.success || !Array.isArray(data.supplements)) {
                throw new Error('Invalid supplements-list response');
            }

            masterSupplements = data.supplements;

            if (masterSupplements.length === 0) {
                masterTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted py-3">
                            <i class="bi bi-info-circle me-1"></i>No supplements saved yet. Add your regular supplements above.
                        </td>
                    </tr>
                `;
                return;
            }

            let rowsHtml = '';
            masterSupplements.forEach(s => {
                rowsHtml += `
                    <tr data-id="${s.id}">
                        <td>${s.name ? s.name : ''}</td>
                        <td>${s.dosage ? s.dosage : ''}</td>
                        <td>${s.notes ? s.notes : ''}</td>
                        <td class="text-end">
                            <button type="button" class="btn btn-sm btn-outline-primary me-1 master-edit-btn" data-id="${s.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger master-delete-btn" data-id="${s.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            masterTableBody.innerHTML = rowsHtml;

            // Wire up edit/delete buttons
            masterTableBody.querySelectorAll('.master-edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const sup = masterSupplements.find(s => String(s.id) === String(id));
                    if (!sup) return;

                    if (masterIdInput) masterIdInput.value = sup.id;
                    if (masterNameInput) masterNameInput.value = sup.name || '';
                    if (masterDoseInput) masterDoseInput.value = sup.dosage || '';
                    if (masterNotesInput) masterNotesInput.value = sup.notes || '';
                    if (masterSaveLabel) masterSaveLabel.textContent = 'Update';
                });
            });

            masterTableBody.querySelectorAll('.master-delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (!id) return;
                    if (!confirm('Are you sure you want to delete this supplement from your list?')) return;

                    const params = new URLSearchParams();
                    params.append('id', id);

                    try {
                        const res = await fetch('supplements-delete.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: params.toString()
                        });
                        const result = await res.json();
                        if (result && result.success) {
                            showAlert('Supplement removed from your list.', 'info');
                            clearMasterForm();
                            await loadMasterSupplements();
                        } else {
                            showAlert((result && result.message) || 'Error deleting supplement.', 'danger');
                        }
                    } catch (err) {
                        console.error('❌ Error deleting supplement:', err);
                        showAlert('Error deleting supplement.', 'danger');
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error loading master supplements:', error);
            masterTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger py-3">
                        <i class="bi bi-exclamation-triangle me-1"></i>Error loading supplements list
                    </td>
                </tr>
            `;
        }
    }

    function clearMasterForm() {
        if (masterIdInput) masterIdInput.value = '';
        if (masterNameInput) masterNameInput.value = '';
        if (masterDoseInput) masterDoseInput.value = '';
        if (masterNotesInput) masterNotesInput.value = '';
        if (masterSaveLabel) masterSaveLabel.textContent = 'Add';
    }

    if (masterSaveBtn && masterForm && masterTableBody) {
        masterSaveBtn.addEventListener('click', async function () {
            const ok = await ensureLoggedInForFocus();
            if (!ok) return;

            if (!masterForm.checkValidity()) {
                masterForm.classList.add('was-validated');
                return;
            }

            const name = masterNameInput.value.trim();
            const dosage = masterDoseInput.value.trim();
            const notes = masterNotesInput ? masterNotesInput.value.trim() : '';
            const id = masterIdInput ? masterIdInput.value.trim() : '';

            if (!name || !dosage) {
                showAlert('Please enter supplement name and dosage.', 'warning');
                return;
            }

            const params = new URLSearchParams();
            params.append('name', name);
            params.append('dosage', dosage);
            if (notes) params.append('notes', notes);
            if (id) params.append('id', id);

            try {
                masterSaveBtn.disabled = true;

                const res = await fetch('supplements-save.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                });

                const data = await res.json();
                if (data && data.success) {
                    showAlert(id ? 'Supplement updated.' : 'Supplement added.', 'success');
                    clearMasterForm();
                    await loadMasterSupplements();
                } else {
                    showAlert((data && data.message) || 'Error saving supplement.', 'danger');
                }
            } catch (err) {
                console.error('❌ Error saving supplement:', err);
                showAlert('Error saving supplement.', 'danger');
            } finally {
                masterSaveBtn.disabled = false;
            }
        });
    }

    // --- Daily checklist code ---

    // Date picker change event
    if (datePicker) {
        datePicker.addEventListener('change', async function() {
            currentDate = this.value;
            console.log('📅 Date changed to:', currentDate);
            updateDateDisplay(currentDate);
            await loadSupplementsForDate(currentDate);
        });
    }
    
    // Load supplements for a specific date (from DB-backed checklist endpoints)
    async function loadSupplementsForDate(dateStr) {
        console.log(`📥 Loading supplements for date: ${dateStr}`);
        
        try {
            const response = await fetch(`checklist-get.php?date=${encodeURIComponent(dateStr)}`, { method: 'GET' });
            if (!response.ok) {
                throw new Error('Network error loading checklist');
            }

            const data = await response.json();
            console.log('📋 Checklist loaded:', data);

            const supplements = (data && data.success && Array.isArray(data.items)) ? data.items : [];
            
            if (!supplementList) return;

            if (supplements.length === 0) {
                supplementList.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-clipboard-check" style="font-size: 3rem;"></i>
                        <p class="mt-2">No supplements added yet. Use the My Supplements section above to define your regular supplements.</p>
                    </div>
                `;
                updateStats(supplements);
                console.log('ℹ️ No supplements for this date');
                return;
            }
        
            let html = '';
            supplements.forEach((supplement, index) => {
                html += createSupplementItemHTML(supplement, index);
            });
            
            supplementList.innerHTML = html;
            console.log(`✅ Rendered ${supplements.length} supplements`);
            
            // Add event listeners
            attachSupplementEventListeners();
            updateStats(supplements);
        } catch (error) {
            console.error('❌ Error loading supplements:', error);
            if (supplementList) {
                supplementList.innerHTML = '<p class="text-danger">Error loading supplements. Please try again.</p>';
            }
        }
    }
    
    // Create supplement item HTML
    function createSupplementItemHTML(supplement, index) {
        return `
            <div class="supplement-item ${supplement.completed ? 'completed' : ''}" data-index="${index}">
                <div class="d-flex align-items-start">
                    <div class="form-check me-3">
                        <input 
                            class="form-check-input supplement-checkbox" 
                            type="checkbox" 
                            id="supplement-${index}" 
                            data-index="${index}"
                            ${supplement.completed ? 'checked' : ''}
                        >
                    </div>
                    <div class="flex-grow-1">
                        <label for="supplement-${index}" class="supplement-name">${supplement.name}</label>
                        <div class="supplement-dose">${supplement.dosage || supplement.dose || ''}</div>
                        <textarea 
                            class="supplement-notes-field form-control mt-2" 
                            rows="2" 
                            placeholder="Add notes for this supplement..."
                            data-index="${index}"
                        >${supplement.notes || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Attach event listeners to supplement items
    function attachSupplementEventListeners() {
        // Checkbox listeners
        document.querySelectorAll('.supplement-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const index = parseInt(this.getAttribute('data-index'));
                toggleSupplementCompletion(index);
            });
        });
        
        // Notes field listeners
        document.querySelectorAll('.supplement-notes-field').forEach(field => {
            field.addEventListener('blur', function() {
                const index = parseInt(this.getAttribute('data-index'));
                updateSupplementNotes(index, this.value);
            });
        });
        
    }
    
    // Helper to save the current checklist state back to the server
    async function saveCurrentChecklist() {
        if (!supplementList) return;

        const items = [];
        const itemNodes = supplementList.querySelectorAll('.supplement-item');
        itemNodes.forEach(node => {
            const index = parseInt(node.getAttribute('data-index'));
            const checkbox = node.querySelector('.supplement-checkbox');
            const notesField = node.querySelector('.supplement-notes-field');

            const nameEl = node.querySelector('.supplement-name');
            const doseEl = node.querySelector('.supplement-dose');

            const item = {
                name: nameEl ? nameEl.textContent : '',
                dosage: doseEl ? doseEl.textContent : '',
                notes: notesField ? notesField.value : '',
                completed: checkbox ? checkbox.checked : false
            };

            items.push(item);
        });

        const params = new URLSearchParams();
        params.append('date', currentDate);
        params.append('items', JSON.stringify(items));

        try {
            const res = await fetch('checklist-save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });
            const data = await res.json();
            if (!data || !data.success) {
                console.warn('Checklist save returned non-success:', data);
            }
        } catch (err) {
            console.error('❌ Error saving checklist:', err);
        }
    }

    // Toggle supplement completion
    async function toggleSupplementCompletion(index) {
        console.log(`🔄 Toggling supplement ${index} for date ${currentDate}`);
        await saveCurrentChecklist();
        await loadSupplementsForDate(currentDate);
    }
    
    // Update supplement notes
    async function updateSupplementNotes(index, notes) {
        console.log(`📝 Updating notes for supplement ${index}`);
        await saveCurrentChecklist();
    }

    // Save day button
    if (saveDayBtn) {
        saveDayBtn.addEventListener('click', async function() {
            console.log(`💾 Saving checklist for ${currentDate}...`);
            
            try {
                await saveCurrentChecklist();
                console.log('✅ Checklist saved');
                showAlert('Day saved successfully!', 'success');
            } catch (error) {
                console.error('❌ Error saving day:', error);
                showAlert('Error saving day', 'danger');
            }
        });
    }
    
    // Update statistics
    function updateStats(supplements) {
        const total = supplements.length;
        const completed = supplements.filter(s => s.completed).length;
        const pending = total - completed;
        
        const totalEl = document.getElementById('total-supplements-count');
        const completedEl = document.getElementById('completed-supplements-count');
        const pendingEl = document.getElementById('pending-supplements-count');
        
        if (totalEl) totalEl.textContent = total;
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = pending;
    }
    
    // Load and display saved dates list
    async function loadSavedDatesList() {
        console.log('📅 Loading saved dates list...');
        
        const savedDatesList = document.getElementById('saved-dates-list');
        const savedDatesCount = document.getElementById('saved-dates-count');
        
        if (!savedDatesList) return;
        
        try {
            // Get all checklist dates from server
            const res = await fetch('checklist-dates.php', { method: 'GET' });
            if (!res.ok) {
                throw new Error('Network error loading checklist dates');
            }

            const data = await res.json();
            const dates = (data && data.success && Array.isArray(data.dates)) ? data.dates : [];
            console.log('📋 Found saved dates:', dates);
            
            // Update count
            if (savedDatesCount) {
                savedDatesCount.textContent = dates.length;
            }
            
            // If no dates, show empty state
            if (dates.length === 0) {
                savedDatesList.innerHTML = `
                    <div class="list-group-item text-center text-muted py-4">
                        <i class="bi bi-calendar-x" style="font-size: 2rem;"></i>
                        <p class="mb-0 mt-2 small">No saved checklists yet</p>
                    </div>
                `;
                console.log('ℹ️ No saved dates to display');
                return;
            }
            
            // Sort dates in descending order (most recent first)
            dates.sort((a, b) => new Date(b) - new Date(a));
            
            // Build the list HTML
            let html = '';
            const today = new Date().toISOString().split('T')[0];
            
            for (const dateStr of dates) {
                const date = new Date(dateStr + 'T00:00:00');
                const isToday = dateStr === today;
                const isSelected = dateStr === currentDate;
                
                // Format date for display
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const year = date.getFullYear();
                const currentYear = new Date().getFullYear();
                const displayYear = year !== currentYear ? `, ${year}` : '';
                
                // Get checklist to show supplement count
                const checklist = await StorageAPI.getChecklist(dateStr);
                const supplementCount = checklist?.supplements?.length || 0;
                const completedCount = checklist?.supplements?.filter(s => s.completed).length || 0;
                
                html += `
                    <button 
                        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${isSelected ? 'active' : ''}"
                        data-date="${dateStr}"
                        onclick="window.loadDateFromList('${dateStr}')"
                    >
                        <div class="d-flex flex-column align-items-start">
                            <div class="fw-bold">
                                ${dayName}, ${monthDay}${displayYear}
                                ${isToday ? '<span class="badge bg-primary ms-2">Today</span>' : ''}
                            </div>
                            <small class="text-muted">
                                ${supplementCount} supplement${supplementCount !== 1 ? 's' : ''}
                                ${supplementCount > 0 ? `· ${completedCount}/${supplementCount} done` : ''}
                            </small>
                        </div>
                        <i class="bi bi-chevron-right"></i>
                    </button>
                `;
            }
            
            savedDatesList.innerHTML = html;
            console.log(`✅ Rendered ${dates.length} saved dates`);
            
        } catch (error) {
            console.error('❌ Error loading saved dates:', error);
            savedDatesList.innerHTML = `
                <div class="list-group-item text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                    <p class="mb-0 mt-2 small">Error loading saved dates</p>
                </div>
            `;
        }
    }
    
    // Global function to load date from list (called by onclick)
    window.loadDateFromList = async function(dateStr) {
        console.log('📅 Loading date from list:', dateStr);
        currentDate = dateStr;
        
        // Update date picker
        if (datePicker) {
            datePicker.value = dateStr;
        }
        
        // Update display
        updateDateDisplay(dateStr);
        
        // Load supplements for this date
        await loadSupplementsForDate(dateStr);
        
        // Refresh the dates list to update active state
        await loadSavedDatesList();
    };
    
    // Refresh dates button
    const refreshDatesBtn = document.getElementById('refresh-dates-btn');
    if (refreshDatesBtn) {
        refreshDatesBtn.addEventListener('click', async function() {
            console.log('🔄 Refreshing saved dates list...');
            this.disabled = true;
            this.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i>';
            
            await loadSavedDatesList();
            
            this.disabled = false;
            this.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
            console.log('✅ Dates list refreshed');
        });
    }
    
    // Initial load
    await loadMasterSupplements();
    await loadSupplementsForDate(currentDate);
    await loadSavedDatesList();
    console.log('✅ Tracker page initialized');
}

// Future Page Functionality
function initFuturePage() {
    const visionNotes = document.getElementById('vision-notes');
    const saveVisionBtn = document.getElementById('save-vision-btn');
    const visionSaveStatus = document.getElementById('vision-save-status');
    const newGoalInput = document.getElementById('new-goal-input');
    const addGoalBtn = document.getElementById('add-goal-btn');
    const goalsList = document.getElementById('goals-list');
    const planTitleInput = document.getElementById('plan-title-input');
    const planCategoryInput = document.getElementById('plan-category-input');
    const planPriorityInput = document.getElementById('plan-priority-input');
    const planNotesInput = document.getElementById('plan-notes-input');
    const addPlanBtn = document.getElementById('add-plan-btn');
    const recoveryPlansList = document.getElementById('recovery-plans-list');
    
    // Load vision notes
    function loadVisionNotes() {
        const futureData = Storage.load('futureData') || {};
        if (visionNotes && futureData.visionNotes) {
            visionNotes.value = futureData.visionNotes;
        }
    }
    
    // Save vision notes with auto-save
    let visionTimeout;
    if (visionNotes) {
        visionNotes.addEventListener('input', function() {
            clearTimeout(visionTimeout);
            visionSaveStatus.textContent = 'Typing...';
            visionSaveStatus.className = 'text-muted';
            
            visionTimeout = setTimeout(() => {
                saveVisionNotes();
                visionSaveStatus.textContent = 'Auto-saved ✓';
                visionSaveStatus.className = 'text-success';
                
                setTimeout(() => {
                    visionSaveStatus.textContent = 'Auto-saves as you type';
                    visionSaveStatus.className = 'text-muted';
                }, 2000);
            }, 1000);
        });
    }
    
    // Manual save vision
    if (saveVisionBtn) {
        saveVisionBtn.addEventListener('click', function() {
            saveVisionNotes();
            showAlert('Vision notes saved!', 'success');
        });
    }
    
    function saveVisionNotes() {
        const futureData = Storage.load('futureData') || {};
        futureData.visionNotes = visionNotes.value;
        Storage.save('futureData', futureData);
    }
    
    // Load and display life goals
    function loadGoals() {
        const futureData = Storage.load('futureData') || {};
        const goals = futureData.lifeGoals || [];
        
        if (goals.length === 0) {
            goalsList.innerHTML = '<p class="text-muted text-center py-3">No goals yet. Add your first goal above!</p>';
            return;
        }
        
        let html = '';
        goals.forEach((goal, index) => {
            html += `
                <div class="goal-item ${goal.completed ? 'completed' : ''}" data-index="${index}">
                    <div class="d-flex align-items-center">
                        <input 
                            class="form-check-input me-3 goal-checkbox" 
                            type="checkbox" 
                            data-index="${index}"
                            ${goal.completed ? 'checked' : ''}
                        >
                        <div class="flex-grow-1">
                            <div class="goal-text">${goal.text}</div>
                            ${goal.completedAt ? `<small class="text-muted">Completed: ${formatDateTime(goal.completedAt)}</small>` : ''}
                        </div>
                        <button class="btn btn-sm btn-outline-danger delete-goal" data-index="${index}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        goalsList.innerHTML = html;
        attachGoalEventListeners();
    }
    
    // Attach event listeners to goals
    function attachGoalEventListeners() {
        document.querySelectorAll('.goal-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const index = parseInt(this.getAttribute('data-index'));
                toggleGoalCompletion(index);
            });
        });
        
        document.querySelectorAll('.delete-goal').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteGoal(index);
            });
        });
    }
    
    // Add new goal
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', addNewGoal);
    }
    
    if (newGoalInput) {
        newGoalInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addNewGoal();
            }
        });
    }
    
    function addNewGoal() {
        const text = newGoalInput.value.trim();
        if (!text) return;
        
        const futureData = Storage.load('futureData') || {};
        if (!futureData.lifeGoals) futureData.lifeGoals = [];
        
        futureData.lifeGoals.push({
            text,
            completed: false,
            createdAt: new Date().toISOString()
        });
        
        Storage.save('futureData', futureData);
        newGoalInput.value = '';
        loadGoals();
        showAlert('Goal added!', 'success');
    }
    
    // Toggle goal completion
    function toggleGoalCompletion(index) {
        const futureData = Storage.load('futureData') || {};
        if (!futureData.lifeGoals || !futureData.lifeGoals[index]) return;
        
        futureData.lifeGoals[index].completed = !futureData.lifeGoals[index].completed;
        
        if (futureData.lifeGoals[index].completed) {
            futureData.lifeGoals[index].completedAt = new Date().toISOString();
        } else {
            delete futureData.lifeGoals[index].completedAt;
        }
        
        Storage.save('futureData', futureData);
        loadGoals();
    }
    
    // Delete goal
    function deleteGoal(index) {
        if (!confirm('Are you sure you want to delete this goal?')) return;
        
        const futureData = Storage.load('futureData') || {};
        if (!futureData.lifeGoals) return;
        
        futureData.lifeGoals.splice(index, 1);
        Storage.save('futureData', futureData);
        loadGoals();
        showAlert('Goal deleted.', 'info');
    }
    
    // Load and display recovery plans
    function loadRecoveryPlans() {
        const futureData = Storage.load('futureData') || {};
        const plans = futureData.recoveryPlans || [];
        
        updatePlanStats(plans);
        
        if (plans.length === 0) {
            recoveryPlansList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-clipboard-heart" style="font-size: 2.5rem;"></i>
                    <p class="mt-2">No plans yet. Add your first post-recovery plan above!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        plans.forEach((plan, index) => {
            const priorityClass = `plan-priority-${plan.priority.toLowerCase()}`;
            html += `
                <div class="recovery-plan-item ${plan.completed ? 'completed' : ''}" data-index="${index}">
                    <div class="d-flex align-items-start mb-2">
                        <input 
                            class="form-check-input me-3 mt-1 plan-checkbox" 
                            type="checkbox" 
                            data-index="${index}"
                            ${plan.completed ? 'checked' : ''}
                        >
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="plan-title mb-0">${plan.title}</h6>
                                <button class="btn btn-sm btn-outline-danger delete-plan" data-index="${index}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                            <div class="mb-2">
                                <span class="plan-category-badge badge bg-secondary">${plan.category}</span>
                                <span class="ms-2 ${priorityClass}">
                                    <i class="bi bi-flag-fill"></i> ${plan.priority}
                                </span>
                            </div>
                            ${plan.notes ? `<p class="mb-2 small text-muted">${plan.notes}</p>` : ''}
                            ${plan.completed && plan.completedAt ? 
                                `<div class="plan-completed-badge">
                                    <i class="bi bi-check-circle me-1"></i>
                                    Completed: ${formatDateTime(plan.completedAt)}
                                </div>` : 
                                `<small class="plan-timestamp">Added: ${formatDateTime(plan.createdAt)}</small>`
                            }
                        </div>
                    </div>
                </div>
            `;
        });
        
        recoveryPlansList.innerHTML = html;
        attachPlanEventListeners();
    }
    
    // Attach event listeners to plans
    function attachPlanEventListeners() {
        document.querySelectorAll('.plan-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const index = parseInt(this.getAttribute('data-index'));
                togglePlanCompletion(index);
            });
        });
        
        document.querySelectorAll('.delete-plan').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deletePlan(index);
            });
        });
    }
    
    // Add new recovery plan
    if (addPlanBtn) {
        addPlanBtn.addEventListener('click', function() {
            const title = planTitleInput.value.trim();
            if (!title) {
                showAlert('Please enter a plan title.', 'warning');
                return;
            }
            
            const futureData = Storage.load('futureData') || {};
            if (!futureData.recoveryPlans) futureData.recoveryPlans = [];
            
            futureData.recoveryPlans.push({
                title,
                category: planCategoryInput.value,
                priority: planPriorityInput.value,
                notes: planNotesInput.value.trim(),
                completed: false,
                createdAt: new Date().toISOString()
            });
            
            Storage.save('futureData', futureData);
            
            // Clear form
            planTitleInput.value = '';
            planNotesInput.value = '';
            planCategoryInput.selectedIndex = 0;
            planPriorityInput.selectedIndex = 1;
            
            loadRecoveryPlans();
            showAlert('Plan added successfully!', 'success');
        });
    }
    
    // Toggle plan completion
    function togglePlanCompletion(index) {
        const futureData = Storage.load('futureData') || {};
        if (!futureData.recoveryPlans || !futureData.recoveryPlans[index]) return;
        
        futureData.recoveryPlans[index].completed = !futureData.recoveryPlans[index].completed;
        
        if (futureData.recoveryPlans[index].completed) {
            futureData.recoveryPlans[index].completedAt = new Date().toISOString();
            showAlert('🎉 Congratulations on completing this plan!', 'success');
        } else {
            delete futureData.recoveryPlans[index].completedAt;
        }
        
        Storage.save('futureData', futureData);
        loadRecoveryPlans();
    }
    
    // Delete plan
    function deletePlan(index) {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        
        const futureData = Storage.load('futureData') || {};
        if (!futureData.recoveryPlans) return;
        
        futureData.recoveryPlans.splice(index, 1);
        Storage.save('futureData', futureData);
        loadRecoveryPlans();
        showAlert('Plan deleted.', 'info');
    }
    
    // Update statistics
    function updatePlanStats(plans) {
        const total = plans.length;
        const completed = plans.filter(p => p.completed).length;
        const pending = total - completed;
        
        const totalEl = document.getElementById('total-plans-count');
        const completedEl = document.getElementById('completed-plans-count');
        const pendingEl = document.getElementById('pending-plans-count');
        
        if (totalEl) totalEl.textContent = total;
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = pending;
    }
    
    // Format date and time
    function formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Initial load
    loadVisionNotes();
    loadGoals();
    loadRecoveryPlans();
}

// Utility Functions

// Format date to YYYY-MM-DD
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show alert message
function showAlert(message, type = 'info') {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.alert-dismissible');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.role = 'alert';
    alertDiv.style.zIndex = '1050';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 3000);
}
