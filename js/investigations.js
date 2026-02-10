/**
 * ========================================
 * Investigations Module
 * Handles research tracking and documentation
 * ========================================
 */

console.log('🔬 Investigations module loading...');

// Global variables
let allResearch = [];
let filteredResearch = [];
let selectedResearchIds = new Set();
let currentEditId = null;
// Storage key is made user-specific once we know the logged-in user id
let researchStorageKey = 'research';

document.addEventListener('DOMContentLoaded', async function() {
    // Only initialize if on investigations page
    if (!document.getElementById('research-table')) {
        return;
    }

    console.log('🔬 Initializing Investigations page...');

    const addResearchBtn = document.getElementById('add-research-btn');

    // Helper: when not logged in, show login-required state and gate Add Research button
    function showLoggedOutState() {
        const tbody = document.getElementById('research-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-5">
                        <i class="bi bi-info-circle" style="font-size: 3rem;"></i>
                        <p class="mt-3 mb-0">You need to be logged in to view and manage your investigations.</p>
                    </td>
                </tr>
            `;
        }

        // Reset stats
        const totalEl = document.getElementById('total-research-count');
        const highPriorityEl = document.getElementById('high-priority-count');
        const reviewedEl = document.getElementById('reviewed-count');
        const categoriesEl = document.getElementById('categories-count');
        const showingEl = document.getElementById('showing-count');
        const totalCountEl = document.getElementById('total-count');
        const exportBtn = document.getElementById('export-research-btn');

        if (totalEl) totalEl.textContent = '0';
        if (highPriorityEl) highPriorityEl.textContent = '0';
        if (reviewedEl) reviewedEl.textContent = '0';
        if (categoriesEl) categoriesEl.textContent = '0';
        if (showingEl) showingEl.textContent = '0';
        if (totalCountEl) totalCountEl.textContent = '0';
        if (exportBtn) exportBtn.classList.add('d-none');

        if (addResearchBtn) {
            addResearchBtn.addEventListener('click', function (e) {
                e.preventDefault();
                alert('You need to be logged in to add research investigations. Please use the Login button at the top of the page.');
            });
        }
    }

    // Check login state via get_user.php
    let loggedIn = false;
    let currentUserId = null;
    try {
        const response = await fetch('get_user.php', { method: 'GET' });
        if (response.ok) {
            const data = await response.json();
            loggedIn = !!(data && data.logged_in);

            if (loggedIn && data.user && (data.user.id !== undefined && data.user.id !== null)) {
                // Use a per-user storage key so investigations are scoped to the logged-in ShineOn user
                currentUserId = data.user.id;
                researchStorageKey = `research_user_${currentUserId}`;
            }
        }
    } catch (e) {
        console.warn('Could not check login state for investigations:', e);
    }

    if (!loggedIn) {
        console.log('🔒 User not logged in: showing login-required state for Investigations');
        showLoggedOutState();
        return;
    }

    // Wait for StorageAPI
    if (typeof StorageAPI === 'undefined') {
        console.error('❌ StorageAPI not available');
        return;
    }

    // When logged in, wire Add Research button to open the modal via JS
    if (addResearchBtn) {
        addResearchBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const modalEl = document.getElementById('addResearchModal');
            if (!modalEl || typeof bootstrap === 'undefined' || !bootstrap.Modal) return;
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });
    }

    await initInvestigationsPage();

    console.log('✅ Investigations page initialized');
});

/**
 * Initialize Investigations Page
 */
async function initInvestigationsPage() {
    // Load research data
    await loadResearch();
    
    // Initialize event listeners
    initEventListeners();
    
    // Update statistics
    updateStatistics();
    
    // Render table
    renderResearchTable();
}

/**
 * Load research from storage (per logged-in user)
 */
async function loadResearch() {
    console.log('📥 Loading research data...');
    
    try {
        // Get research from storage (using metadata store) for the current user
        let stored = await StorageAPI.getMetadata(researchStorageKey);
        // Metadata may be returned as a JSON string or already-parsed value
        let parsed = stored;
        if (typeof stored === 'string') {
            try {
                parsed = JSON.parse(stored);
            } catch (e) {
                console.error('❌ Failed to parse research metadata JSON, defaulting to []:', e);
                parsed = [];
            }
        }

        // If the per-user key is empty, attempt a one-time migration from the legacy shared key 'research'
        if ((!parsed || (Array.isArray(parsed) && parsed.length === 0))) {
            try {
                const legacy = await StorageAPI.getMetadata('research');
                let legacyParsed = legacy;
                if (typeof legacy === 'string') {
                    try {
                        legacyParsed = JSON.parse(legacy);
                    } catch (e) {
                        console.error('❌ Failed to parse legacy research JSON:', e);
                        legacyParsed = [];
                    }
                }
                if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
                    console.log(`🔁 Migrating ${legacyParsed.length} legacy research entries to per-user key ${researchStorageKey}`);
                    parsed = legacyParsed;
                    // Save immediately under the new per-user key so future loads use it
                    await StorageAPI.saveMetadata(researchStorageKey, parsed);
                }
            } catch (migrationError) {
                console.warn('⚠️ Legacy research migration skipped due to error:', migrationError);
            }
        }

        allResearch = Array.isArray(parsed) ? parsed : [];
        filteredResearch = [...allResearch];
        
        console.log(`✅ Loaded ${allResearch.length} research entries`);
    } catch (error) {
        console.error('❌ Error loading research:', error);
        allResearch = [];
        filteredResearch = [];
    }
}

/**
 * Save research to storage (per logged-in user)
 */
async function saveResearch() {
    console.log('💾 Saving research data...');
    
    try {
        // Persist research for this specific user key only
        await StorageAPI.saveMetadata(researchStorageKey, allResearch);
        console.log('✅ Research data saved');
    } catch (error) {
        console.error('❌ Error saving research:', error);
        throw error;
    }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Save research button
    const saveBtn = document.getElementById('save-research-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveResearch);
    }
    
    // Search input - real-time filtering in modal
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', updateFilterPreview);
    }
    
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', updateFilterPreview);
    }
    
    // Priority filter
    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) {
        priorityFilter.addEventListener('change', updateFilterPreview);
    }
    
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', updateFilterPreview);
    }
    
    // Rating filter
    const ratingFilter = document.getElementById('rating-filter');
    if (ratingFilter) {
        ratingFilter.addEventListener('change', updateFilterPreview);
    }
    
    // Clear filters
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Apply filters when modal closes
    const searchFilterModal = document.getElementById('searchFilterModal');
    if (searchFilterModal) {
        searchFilterModal.addEventListener('hidden.bs.modal', function() {
            applyFilters();
            updateActiveFilterBadges();
        });
    }
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }
    
    // Delete selected
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
    }
    
    // Export CSV
    const exportBtn = document.getElementById('export-research-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportResearchCSV);
    }
    
    // Edit from view modal
    const editFromViewBtn = document.getElementById('edit-from-view-btn');
    if (editFromViewBtn) {
        editFromViewBtn.addEventListener('click', handleEditFromView);
    }
    
    // Reset form when modal is hidden
    const addModal = document.getElementById('addResearchModal');
    if (addModal) {
        addModal.addEventListener('hidden.bs.modal', resetForm);
    }
}

/**
 * Handle save research
 */
async function handleSaveResearch() {
    console.log('💾 Saving research entry...');
    
    const form = document.getElementById('research-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const saveBtn = document.getElementById('save-research-btn');
    const originalText = saveBtn.innerHTML;
    
    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
        
        // Get form data
        const researchData = {
            id: currentEditId || Date.now(),
            title: document.getElementById('research-title').value.trim(),
            category: document.getElementById('research-category').value,
            priority: document.getElementById('research-priority').value,
            status: document.getElementById('research-status').value,
            rating: document.getElementById('research-rating').value,
            source: document.getElementById('research-source').value.trim(),
            contact: document.getElementById('research-contact').value.trim(),
            phone: document.getElementById('research-phone').value.trim(),
            location: document.getElementById('research-location').value.trim(),
            notes: document.getElementById('research-notes').value.trim(),
            tags: document.getElementById('research-tags').value.trim(),
            dateAdded: currentEditId ? 
                allResearch.find(r => r.id === currentEditId)?.dateAdded : 
                new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Add or update
        if (currentEditId) {
            const index = allResearch.findIndex(r => r.id === currentEditId);
            if (index !== -1) {
                allResearch[index] = researchData;
                console.log('✅ Research entry updated:', researchData.title);
            }
        } else {
            allResearch.push(researchData);
            console.log('✅ Research entry added:', researchData.title);
        }
        
        // Save to storage
        await saveResearch();
        
        // Update UI
        applyFilters();
        updateStatistics();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addResearchModal'));
        modal.hide();
        
        // Show success message
        showAlert(`Research entry ${currentEditId ? 'updated' : 'added'} successfully!`, 'success');
        
    } catch (error) {
        console.error('❌ Error saving research:', error);
        showAlert('Error saving research entry', 'danger');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

/**
 * Render research table
 */
function renderResearchTable() {
    console.log(`📊 Rendering ${filteredResearch.length} research entries...`);
    
    const tbody = document.getElementById('research-table-body');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // If no research, show empty state
    if (filteredResearch.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                    <p class="mt-3">No research entries found. ${allResearch.length > 0 ? 'Try adjusting your filters.' : 'Click "Add Research" to get started.'}</p>
                </td>
            </tr>
        `;
        updateCounts();
        return;
    }
    
    // Sort by date (newest first)
    const sortedResearch = [...filteredResearch].sort((a, b) => 
        new Date(b.dateAdded) - new Date(a.dateAdded)
    );
    
    // Render rows
    sortedResearch.forEach(research => {
        const row = createResearchRow(research);
        tbody.appendChild(row);
    });
    
    updateCounts();
    console.log('✅ Table rendered');
}

/**
 * Create research table row
 */
function createResearchRow(research) {
    const tr = document.createElement('tr');
    tr.dataset.id = research.id;
    
    // Priority badge color
    const priorityColors = {
        'High': 'danger',
        'Medium': 'warning',
        'Low': 'secondary'
    };
    
    // Status badge color
    const statusColors = {
        'To Review': 'secondary',
        'Reviewing': 'info',
        'Reviewed': 'success',
        'Pursuing': 'primary',
        'On Hold': 'warning',
        'Not Suitable': 'dark'
    };
    
    // Format date
    const dateAdded = new Date(research.dateAdded);
    const formattedDate = dateAdded.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Rating stars
    const rating = research.rating ? '⭐'.repeat(parseInt(research.rating)) : '-';
    
    tr.innerHTML = `
        <td>
            <input type="checkbox" class="form-check-input research-checkbox" data-id="${research.id}" ${selectedResearchIds.has(research.id) ? 'checked' : ''}>
        </td>
        <td>
            <strong>${escapeHtml(research.title)}</strong>
            ${research.location ? `<br><small class="text-muted"><i class="bi bi-geo-alt"></i> ${escapeHtml(research.location)}</small>` : ''}
        </td>
        <td>
            <span class="badge bg-light text-dark">${escapeHtml(research.category)}</span>
        </td>
        <td>
            <span class="badge bg-${priorityColors[research.priority] || 'secondary'}">${escapeHtml(research.priority)}</span>
        </td>
        <td>
            <span class="badge bg-${statusColors[research.status] || 'secondary'}">${escapeHtml(research.status)}</span>
        </td>
        <td>
            <small>${formattedDate}</small>
        </td>
        <td>
            <span title="${research.rating ? research.rating + ' stars' : 'Not rated'}">${rating}</span>
        </td>
        <td>
            <div class="btn-group btn-group-sm" role="group">
                <button class="btn investigation-view-btn" onclick="viewResearchDetails(${research.id})" title="View Details">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn investigation-edit-btn" onclick="editResearch(${research.id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="deleteResearch(${research.id})" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Add checkbox event listener
    const checkbox = tr.querySelector('.research-checkbox');
    checkbox.addEventListener('change', handleCheckboxChange);
    
    return tr;
}

/**
 * View research details
 */
window.viewResearchDetails = function(id) {
    console.log('👁️ Viewing research details:', id);
    
    const research = allResearch.find(r => r.id === id);
    if (!research) return;
    
    const content = document.getElementById('view-details-content');
    if (!content) return;
    
    // Format date
    const dateAdded = new Date(research.dateAdded).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Rating stars
    const rating = research.rating ? '⭐'.repeat(parseInt(research.rating)) : 'Not rated';
    
    // Tags
    const tags = research.tags ? research.tags.split(',').map(tag => 
        `<span class="badge bg-secondary me-1">${escapeHtml(tag.trim())}</span>`
    ).join('') : '<span class="text-muted">No tags</span>';
    
    content.innerHTML = `
        <div class="row g-3">
            <div class="col-12">
                <h4>${escapeHtml(research.title)}</h4>
            </div>
            
            <div class="col-md-6">
                <strong>Category:</strong><br>
                <span class="badge bg-light text-dark">${escapeHtml(research.category)}</span>
            </div>
            
            <div class="col-md-3">
                <strong>Priority:</strong><br>
                <span class="badge bg-${research.priority === 'High' ? 'danger' : research.priority === 'Medium' ? 'warning' : 'secondary'}">
                    ${escapeHtml(research.priority)}
                </span>
            </div>
            
            <div class="col-md-3">
                <strong>Status:</strong><br>
                <span class="badge bg-info">${escapeHtml(research.status)}</span>
            </div>
            
            <div class="col-md-6">
                <strong>Rating:</strong><br>
                ${rating}
            </div>
            
            <div class="col-md-6">
                <strong>Date Added:</strong><br>
                ${dateAdded}
            </div>
            
            ${research.source ? `
                <div class="col-12">
                    <strong>Source:</strong><br>
                    <a href="${escapeHtml(research.source)}" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(research.source)} <i class="bi bi-box-arrow-up-right"></i>
                    </a>
                </div>
            ` : ''}
            
            ${research.location ? `
                <div class="col-12">
                    <strong>Location:</strong><br>
                    <i class="bi bi-geo-alt"></i> ${escapeHtml(research.location)}
                </div>
            ` : ''}
            
            ${research.contact ? `
                <div class="col-md-6">
                    <strong>Contact Person:</strong><br>
                    ${escapeHtml(research.contact)}
                </div>
            ` : ''}
            
            ${research.phone ? `
                <div class="col-md-6">
                    <strong>Phone:</strong><br>
                    <a href="tel:${escapeHtml(research.phone)}">${escapeHtml(research.phone)}</a>
                </div>
            ` : ''}
            
            ${research.notes ? `
                <div class="col-12">
                    <strong>Notes:</strong>
                    <div class="p-3 bg-light rounded mt-2">
                        ${escapeHtml(research.notes).replace(/\n/g, '<br>')}
                    </div>
                </div>
            ` : ''}
            
            <div class="col-12">
                <strong>Tags:</strong><br>
                ${tags}
            </div>
        </div>
    `;
    
    // Store current ID for edit button
    currentEditId = id;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewDetailsModal'));
    modal.show();
};

/**
 * Edit research
 */
window.editResearch = function(id) {
    console.log('✏️ Editing research:', id);
    
    const research = allResearch.find(r => r.id === id);
    if (!research) return;
    
    // Set current edit ID
    currentEditId = id;
    
    // Populate form
    document.getElementById('research-title').value = research.title;
    document.getElementById('research-category').value = research.category;
    document.getElementById('research-priority').value = research.priority;
    document.getElementById('research-status').value = research.status;
    document.getElementById('research-rating').value = research.rating || '';
    document.getElementById('research-source').value = research.source || '';
    document.getElementById('research-contact').value = research.contact || '';
    document.getElementById('research-phone').value = research.phone || '';
    document.getElementById('research-location').value = research.location || '';
    document.getElementById('research-notes').value = research.notes || '';
    document.getElementById('research-tags').value = research.tags || '';
    
    // Update modal title
    document.getElementById('addResearchModalLabel').innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Research Entry';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addResearchModal'));
    modal.show();
};

/**
 * Delete research
 */
window.deleteResearch = async function(id) {
    console.log('🗑️ Deleting research:', id);
    
    const research = allResearch.find(r => r.id === id);
    if (!research) return;
    
    if (!confirm(`Are you sure you want to delete "${research.title}"?`)) {
        return;
    }
    
    try {
        // Remove from array
        allResearch = allResearch.filter(r => r.id !== id);
        
        // Save to storage
        await saveResearch();
        
        // Update UI
        applyFilters();
        updateStatistics();
        
        console.log('✅ Research deleted');
        showAlert('Research entry deleted', 'info');
        
    } catch (error) {
        console.error('❌ Error deleting research:', error);
        showAlert('Error deleting research entry', 'danger');
    }
};

/**
 * Apply filters
 */
function applyFilters() {
    console.log('🔍 Applying filters...');
    
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const ratingFilter = document.getElementById('rating-filter')?.value || '';
    
    filteredResearch = allResearch.filter(research => {
        // Search filter
        const matchesSearch = !searchTerm || 
            research.title.toLowerCase().includes(searchTerm) ||
            research.category.toLowerCase().includes(searchTerm) ||
            (research.notes && research.notes.toLowerCase().includes(searchTerm)) ||
            (research.location && research.location.toLowerCase().includes(searchTerm)) ||
            (research.tags && research.tags.toLowerCase().includes(searchTerm));
        
        // Category filter
        const matchesCategory = !categoryFilter || research.category === categoryFilter;
        
        // Priority filter
        const matchesPriority = !priorityFilter || research.priority === priorityFilter;
        
        // Status filter
        const matchesStatus = !statusFilter || research.status === statusFilter;
        
        // Rating filter (minimum rating)
        const matchesRating = !ratingFilter || 
            (research.rating && parseInt(research.rating) >= parseInt(ratingFilter));
        
        return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesRating;
    });
    
    console.log(`✅ Filtered to ${filteredResearch.length} entries`);
    renderResearchTable();
}

/**
 * Update filter preview in modal
 */
function updateFilterPreview() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const ratingFilter = document.getElementById('rating-filter')?.value || '';
    
    const previewCount = allResearch.filter(research => {
        const matchesSearch = !searchTerm || 
            research.title.toLowerCase().includes(searchTerm) ||
            research.category.toLowerCase().includes(searchTerm) ||
            (research.notes && research.notes.toLowerCase().includes(searchTerm)) ||
            (research.location && research.location.toLowerCase().includes(searchTerm)) ||
            (research.tags && research.tags.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryFilter || research.category === categoryFilter;
        const matchesPriority = !priorityFilter || research.priority === priorityFilter;
        const matchesStatus = !statusFilter || research.status === statusFilter;
        const matchesRating = !ratingFilter || 
            (research.rating && parseInt(research.rating) >= parseInt(ratingFilter));
        
        return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesRating;
    }).length;
    
    const countEl = document.getElementById('filter-results-count');
    if (countEl) {
        countEl.textContent = previewCount;
    }
}

/**
 * Update active filter badges
 */
function updateActiveFilterBadges() {
    const searchTerm = document.getElementById('search-input').value;
    const categoryFilter = document.getElementById('category-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const ratingFilter = document.getElementById('rating-filter')?.value || '';
    
    const activeFiltersDisplay = document.getElementById('active-filters-display');
    const searchBadge = document.getElementById('search-filter-badge');
    const categoryBadge = document.getElementById('category-filter-badge');
    const priorityBadge = document.getElementById('priority-filter-badge');
    
    let hasActiveFilters = false;
    
    // Search badge
    if (searchTerm) {
        searchBadge.style.display = 'inline-block';
        document.getElementById('search-filter-text').textContent = searchTerm;
        hasActiveFilters = true;
    } else {
        searchBadge.style.display = 'none';
    }
    
    // Category badge
    if (categoryFilter) {
        categoryBadge.style.display = 'inline-block';
        document.getElementById('category-filter-text').textContent = categoryFilter;
        hasActiveFilters = true;
    } else {
        categoryBadge.style.display = 'none';
    }
    
    // Priority badge
    if (priorityFilter) {
        priorityBadge.style.display = 'inline-block';
        document.getElementById('priority-filter-text').textContent = priorityFilter;
        hasActiveFilters = true;
    } else {
        priorityBadge.style.display = 'none';
    }
    
    // Show/hide active filters display
    if (activeFiltersDisplay) {
        activeFiltersDisplay.style.display = hasActiveFilters ? 'block' : 'none';
    }
}

/**
 * Clear filters
 */
function clearFilters() {
    console.log('🔄 Clearing filters...');
    
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('priority-filter').value = '';
    
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) statusFilter.value = '';
    
    const ratingFilter = document.getElementById('rating-filter');
    if (ratingFilter) ratingFilter.value = '';
    
    updateFilterPreview();
    applyFilters();
    updateActiveFilterBadges();
}

/**
 * Clear search filter
 */
window.clearSearchFilter = function() {
    document.getElementById('search-input').value = '';
    applyFilters();
    updateActiveFilterBadges();
};

/**
 * Clear category filter
 */
window.clearCategoryFilter = function() {
    document.getElementById('category-filter').value = '';
    applyFilters();
    updateActiveFilterBadges();
};

/**
 * Clear priority filter
 */
window.clearPriorityFilter = function() {
    document.getElementById('priority-filter').value = '';
    applyFilters();
    updateActiveFilterBadges();
};

/**
 * Clear all filters (global function)
 */
window.clearAllFilters = function() {
    clearFilters();
};

/**
 * Handle checkbox change
 */
function handleCheckboxChange(e) {
    const id = parseInt(e.target.dataset.id);
    
    if (e.target.checked) {
        selectedResearchIds.add(id);
    } else {
        selectedResearchIds.delete(id);
    }
    
    updateDeleteButton();
    updateSelectAllCheckbox();
}

/**
 * Handle select all
 */
function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.research-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        const id = parseInt(checkbox.dataset.id);
        
        if (e.target.checked) {
            selectedResearchIds.add(id);
        } else {
            selectedResearchIds.delete(id);
        }
    });
    
    updateDeleteButton();
}

/**
 * Handle delete selected
 */
async function handleDeleteSelected() {
    if (selectedResearchIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedResearchIds.size} research ${selectedResearchIds.size === 1 ? 'entry' : 'entries'}?`)) {
        return;
    }
    
    console.log(`🗑️ Deleting ${selectedResearchIds.size} entries...`);
    
    try {
        // Remove selected entries
        allResearch = allResearch.filter(r => !selectedResearchIds.has(r.id));
        
        // Save to storage
        await saveResearch();
        
        // Clear selection
        selectedResearchIds.clear();
        
        // Update UI
        applyFilters();
        updateStatistics();
        updateDeleteButton();
        
        console.log('✅ Selected entries deleted');
        showAlert('Selected entries deleted', 'info');
        
    } catch (error) {
        console.error('❌ Error deleting entries:', error);
        showAlert('Error deleting entries', 'danger');
    }
}

/**
 * Handle edit from view modal
 */
function handleEditFromView() {
    // Close view modal
    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewDetailsModal'));
    viewModal.hide();
    
    // Open edit modal
    setTimeout(() => {
        editResearch(currentEditId);
    }, 300);
}

/**
 * Update statistics
 */
function updateStatistics() {
    // Total research
    document.getElementById('total-research-count').textContent = allResearch.length;
    
    // High priority
    const highPriority = allResearch.filter(r => r.priority === 'High').length;
    document.getElementById('high-priority-count').textContent = highPriority;
    
    // Reviewed
    const reviewed = allResearch.filter(r => r.status === 'Reviewed' || r.status === 'Pursuing').length;
    document.getElementById('reviewed-count').textContent = reviewed;
    
    // Categories
    const categories = new Set(allResearch.map(r => r.category));
    document.getElementById('categories-count').textContent = categories.size;
}

/**
 * Update counts
 */
function updateCounts() {
    document.getElementById('showing-count').textContent = filteredResearch.length;
    document.getElementById('total-count').textContent = allResearch.length;
}

/**
 * Update delete button
 */
function updateDeleteButton() {
    const deleteBtn = document.getElementById('delete-selected-btn');
    if (deleteBtn) {
        deleteBtn.disabled = selectedResearchIds.size === 0;
        deleteBtn.innerHTML = `<i class="bi bi-trash me-1"></i>Delete Selected ${selectedResearchIds.size > 0 ? `(${selectedResearchIds.size})` : ''}`;
    }
}

/**
 * Update select all checkbox
 */
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const checkboxes = document.querySelectorAll('.research-checkbox');
    
    if (checkboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }
    
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === checkboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

/**
 * Reset form
 */
function resetForm() {
    document.getElementById('research-form').reset();
    currentEditId = null;
    document.getElementById('addResearchModalLabel').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add Research Entry';
}

/**
 * Export research as CSV
 */
function exportResearchCSV() {
    console.log('📊 Exporting research as CSV...');
    
    if (allResearch.length === 0) {
        showAlert('No research to export', 'warning');
        return;
    }
    
    const headers = ['Title', 'Category', 'Priority', 'Status', 'Rating', 'Location', 'Contact', 'Phone', 'Source', 'Notes', 'Tags', 'Date Added'];
    
    const rows = allResearch.map(r => [
        r.title,
        r.category,
        r.priority,
        r.status,
        r.rating || '',
        r.location || '',
        r.contact || '',
        r.phone || '',
        r.source || '',
        (r.notes || '').replace(/"/g, '""'),
        r.tags || '',
        new Date(r.dateAdded).toLocaleDateString()
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ CSV exported');
    showAlert('Research exported successfully!', 'success');
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show alert
 */
function showAlert(message, type = 'info') {
    if (typeof window.showAlert === 'function') {
        window.showAlert(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}
