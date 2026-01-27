/**
 * ========================================
 * Settings Module for Frank's Cancer Journey
 * Handles data export/import and settings
 * ========================================
 */

console.log('⚙️ Settings module loading...');

document.addEventListener('DOMContentLoaded', async function() {
    console.log('⚙️ Initializing settings page...');
    
    // Wait for StorageAPI to be ready
    if (typeof StorageAPI === 'undefined') {
        console.error('❌ StorageAPI not available');
        return;
    }
    
    // Initialize all functionality
    initExportButtons();
    initImportFunctionality();
    initStatistics();
    initDangerZone();
    
    console.log('✅ Settings page initialized');
});

/**
 * ========================================
 * EXPORT FUNCTIONALITY
 * ========================================
 */

function initExportButtons() {
    console.log('📤 Initializing export buttons...');
    
    // Export JSON
    const exportJsonBtn = document.getElementById('export-json-btn');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', exportJSON);
    }
    
    // Export Treatments CSV
    const exportTreatmentsCsvBtn = document.getElementById('export-treatments-csv-btn');
    if (exportTreatmentsCsvBtn) {
        exportTreatmentsCsvBtn.addEventListener('click', exportTreatmentsCSV);
    }
    
    // Export Checklists CSV
    const exportChecklistsCsvBtn = document.getElementById('export-checklists-csv-btn');
    if (exportChecklistsCsvBtn) {
        exportChecklistsCsvBtn.addEventListener('click', exportChecklistsCSV);
    }
    
    // Export All CSV
    const exportAllCsvBtn = document.getElementById('export-all-csv-btn');
    if (exportAllCsvBtn) {
        exportAllCsvBtn.addEventListener('click', exportAllCSV);
    }
}

/**
 * Export all data as JSON
 */
async function exportJSON() {
    console.log('📥 Exporting JSON...');
    const statusEl = document.getElementById('export-json-status');
    const btn = document.getElementById('export-json-btn');
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Exporting...';
        statusEl.innerHTML = '<span class="text-info">Preparing export...</span>';
        
        // Get all data from StorageAPI
        const allData = await StorageAPI.exportAll();
        console.log('✅ Data exported:', allData);
        
        // Create JSON string
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `franks-cancer-journey-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ JSON export complete');
        statusEl.innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i>Export successful!</span>';
        
    } catch (error) {
        console.error('❌ Export failed:', error);
        statusEl.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Export failed</span>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-download me-2"></i>Download JSON Backup';
        setTimeout(() => statusEl.innerHTML = '', 3000);
    }
}

/**
 * Export treatments as CSV
 */
async function exportTreatmentsCSV() {
    console.log('📊 Exporting treatments CSV...');
    const statusEl = document.getElementById('export-treatments-status');
    const btn = document.getElementById('export-treatments-csv-btn');
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Exporting...';
        statusEl.innerHTML = '<span class="text-info">Preparing export...</span>';
        
        // Get treatments
        const treatments = await StorageAPI.listTreatments();
        console.log(`📋 Found ${treatments.length} treatments`);
        
        if (treatments.length === 0) {
            statusEl.innerHTML = '<span class="text-warning"><i class="bi bi-info-circle me-1"></i>No treatments to export</span>';
            return;
        }
        
        // Create CSV content
        const headers = ['Date', 'Type', 'Clinic', 'Notes', 'Attachments', 'Created At'];
        const rows = treatments.map(t => [
            t.date || '',
            t.type || '',
            t.clinic || '',
            (t.notes || '').replace(/"/g, '""'), // Escape quotes
            t.attachments || '',
            t.createdAt || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Download
        downloadCSV(csvContent, `treatments-${new Date().toISOString().split('T')[0]}.csv`);
        
        console.log('✅ Treatments CSV export complete');
        statusEl.innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i>Export successful!</span>';
        
    } catch (error) {
        console.error('❌ Export failed:', error);
        statusEl.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Export failed</span>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-download me-2"></i>Download Treatments CSV';
        setTimeout(() => statusEl.innerHTML = '', 3000);
    }
}

/**
 * Export checklists as CSV
 */
async function exportChecklistsCSV() {
    console.log('📊 Exporting checklists CSV...');
    const statusEl = document.getElementById('export-checklists-status');
    const btn = document.getElementById('export-checklists-csv-btn');
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Exporting...';
        statusEl.innerHTML = '<span class="text-info">Preparing export...</span>';
        
        // Get all checklist dates
        const dates = await StorageAPI.listChecklistDates();
        console.log(`📋 Found ${dates.length} checklist dates`);
        
        if (dates.length === 0) {
            statusEl.innerHTML = '<span class="text-warning"><i class="bi bi-info-circle me-1"></i>No checklists to export</span>';
            return;
        }
        
        // Build rows
        const headers = ['Date', 'Supplement Name', 'Dosage', 'Time', 'Completed', 'Notes'];
        const rows = [];
        
        for (const date of dates) {
            const checklist = await StorageAPI.getChecklist(date);
            if (checklist && checklist.supplements) {
                for (const supplement of checklist.supplements) {
                    rows.push([
                        date,
                        supplement.name || '',
                        supplement.dosage || supplement.dose || '',
                        supplement.time || '',
                        supplement.completed ? 'Yes' : 'No',
                        (supplement.notes || '').replace(/"/g, '""')
                    ]);
                }
            }
        }
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Download
        downloadCSV(csvContent, `checklists-${new Date().toISOString().split('T')[0]}.csv`);
        
        console.log('✅ Checklists CSV export complete');
        statusEl.innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i>Export successful!</span>';
        
    } catch (error) {
        console.error('❌ Export failed:', error);
        statusEl.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Export failed</span>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-download me-2"></i>Download Checklists CSV';
        setTimeout(() => statusEl.innerHTML = '', 3000);
    }
}

/**
 * Export all data as multiple CSVs
 */
async function exportAllCSV() {
    console.log('📊 Exporting all CSVs...');
    const statusEl = document.getElementById('export-all-csv-status');
    const btn = document.getElementById('export-all-csv-btn');
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Exporting...';
        statusEl.innerHTML = '<span class="text-info">Preparing exports...</span>';
        
        // Export treatments
        await exportTreatmentsCSV();
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Export checklists
        await exportChecklistsCSV();
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Export future plans
        const plans = await StorageAPI.listFuturePlans();
        if (plans.length > 0) {
            const headers = ['Title', 'Category', 'Priority', 'Completed', 'Notes', 'Created At'];
            const rows = plans.map(p => [
                p.title || '',
                p.category || '',
                p.priority || '',
                p.completed ? 'Yes' : 'No',
                (p.notes || '').replace(/"/g, '""'),
                p.createdAt || ''
            ]);
            
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');
            
            downloadCSV(csvContent, `future-plans-${new Date().toISOString().split('T')[0]}.csv`);
        }
        
        console.log('✅ All CSV exports complete');
        statusEl.innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i>All exports successful!</span>';
        
    } catch (error) {
        console.error('❌ Export failed:', error);
        statusEl.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Export failed</span>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-download me-2"></i>Download All CSVs';
        setTimeout(() => statusEl.innerHTML = '', 3000);
    }
}

/**
 * Helper function to download CSV
 */
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * ========================================
 * IMPORT FUNCTIONALITY
 * ========================================
 */

function initImportFunctionality() {
    console.log('📥 Initializing import functionality...');
    
    const importInput = document.getElementById('import-json-input');
    const importBtn = document.getElementById('import-json-btn');
    const importPreview = document.getElementById('import-preview');
    const importPreviewContent = document.getElementById('import-preview-content');
    
    let selectedFile = null;
    
    // File input change
    if (importInput) {
        importInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) {
                importBtn.disabled = true;
                importPreview.style.display = 'none';
                return;
            }
            
            console.log('📄 File selected:', file.name);
            selectedFile = file;
            
            // Read and preview file
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    console.log('✅ File parsed successfully');
                    
                    // Show preview
                    const checklistCount = Object.keys(data.checklists || {}).length;
                    const treatmentCount = (data.treatments || []).length;
                    const planCount = (data.futurePlans || []).length;
                    
                    importPreviewContent.innerHTML = `
                        <strong>${file.name}</strong><br>
                        Size: ${(file.size / 1024).toFixed(2)} KB<br>
                        Checklists: ${checklistCount}<br>
                        Treatments: ${treatmentCount}<br>
                        Future Plans: ${planCount}<br>
                        Export Date: ${data.exportDate || 'Unknown'}
                    `;
                    
                    importPreview.style.display = 'block';
                    importBtn.disabled = false;
                    
                } catch (error) {
                    console.error('❌ Invalid JSON file:', error);
                    importPreviewContent.innerHTML = '<span class="text-danger">Invalid JSON file</span>';
                    importPreview.style.display = 'block';
                    importBtn.disabled = true;
                }
            };
            reader.readAsText(file);
        });
    }
    
    // Import button click
    if (importBtn) {
        importBtn.addEventListener('click', async function() {
            if (!selectedFile) return;
            
            console.log('📥 Starting import...');
            const statusEl = document.getElementById('import-json-status');
            
            // Confirm
            if (!confirm('This will import and merge data with your existing information. Continue?')) {
                return;
            }
            
            try {
                importBtn.disabled = true;
                importBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Importing...';
                statusEl.innerHTML = '<span class="text-info">Importing data...</span>';
                
                // Read file
                const reader = new FileReader();
                reader.onload = async function(event) {
                    try {
                        const data = JSON.parse(event.target.result);
                        console.log('📋 Importing data:', data);
                        
                        // Import checklists
                        if (data.checklists) {
                            for (const [date, checklist] of Object.entries(data.checklists)) {
                                await StorageAPI.saveChecklist(date, checklist);
                            }
                            console.log(`✅ Imported ${Object.keys(data.checklists).length} checklists`);
                        }
                        
                        // Import treatments
                        if (data.treatments && Array.isArray(data.treatments)) {
                            for (const treatment of data.treatments) {
                                await StorageAPI.saveTreatment(treatment);
                            }
                            console.log(`✅ Imported ${data.treatments.length} treatments`);
                        }
                        
                        // Import future plans
                        if (data.futurePlans && Array.isArray(data.futurePlans)) {
                            for (const plan of data.futurePlans) {
                                await StorageAPI.saveFuturePlan(plan);
                            }
                            console.log(`✅ Imported ${data.futurePlans.length} future plans`);
                        }
                        
                        // Import legacy data if present
                        if (data.legacy) {
                            for (const [key, value] of Object.entries(data.legacy)) {
                                StorageAPI.Storage.save(key, value);
                            }
                            console.log('✅ Imported legacy data');
                        }
                        
                        console.log('✅ Import complete');
                        statusEl.innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i>Import successful! Refresh the page to see changes.</span>';
                        
                        // Refresh statistics
                        await updateStatistics();
                        
                        // Clear file input
                        importInput.value = '';
                        importPreview.style.display = 'none';
                        selectedFile = null;
                        
                    } catch (error) {
                        console.error('❌ Import failed:', error);
                        statusEl.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Import failed: ' + error.message + '</span>';
                    } finally {
                        importBtn.disabled = true;
                        importBtn.innerHTML = '<i class="bi bi-upload me-2"></i>Import JSON Backup';
                    }
                };
                reader.readAsText(selectedFile);
                
            } catch (error) {
                console.error('❌ Import failed:', error);
                statusEl.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Import failed</span>';
                importBtn.disabled = true;
                importBtn.innerHTML = '<i class="bi bi-upload me-2"></i>Import JSON Backup';
            }
        });
    }
}

/**
 * ========================================
 * STATISTICS
 * ========================================
 */

function initStatistics() {
    console.log('📊 Initializing statistics...');
    
    updateStatistics();
    
    const refreshBtn = document.getElementById('refresh-stats-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Refreshing...';
            await updateStatistics();
            this.disabled = false;
            this.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh Statistics';
        });
    }
}

async function updateStatistics() {
    console.log('📊 Updating statistics...');
    
    try {
        // Get counts
        const checklistDates = await StorageAPI.listChecklistDates();
        const treatments = await StorageAPI.listTreatments();
        const plans = await StorageAPI.listFuturePlans();
        
        // Calculate storage size
        let storageSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                storageSize += localStorage[key].length + key.length;
            }
        }
        
        // Update UI
        document.getElementById('stat-checklists').textContent = checklistDates.length;
        document.getElementById('stat-treatments').textContent = treatments.length;
        document.getElementById('stat-plans').textContent = plans.length;
        document.getElementById('stat-storage').textContent = (storageSize / 1024).toFixed(2) + ' KB';
        
        console.log('✅ Statistics updated');
        
    } catch (error) {
        console.error('❌ Error updating statistics:', error);
    }
}

/**
 * ========================================
 * DANGER ZONE
 * ========================================
 */

function initDangerZone() {
    console.log('⚠️ Initializing danger zone...');
    
    const clearAllBtn = document.getElementById('clear-all-data-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async function() {
            console.log('⚠️ Clear all data requested');
            
            // Double confirmation
            if (!confirm('⚠️ WARNING: This will permanently delete ALL your data!\n\nThis includes:\n- All checklists\n- All treatments\n- All future plans\n- All settings\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) {
                return;
            }
            
            if (!confirm('Last chance! Type "DELETE" in the next prompt to confirm.')) {
                return;
            }
            
            const confirmation = prompt('Type DELETE (in capital letters) to confirm:');
            if (confirmation !== 'DELETE') {
                alert('Deletion cancelled.');
                return;
            }
            
            try {
                this.disabled = true;
                this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';
                
                await StorageAPI.clearAll();
                console.log('✅ All data cleared');
                
                alert('All data has been deleted. The page will now reload.');
                window.location.reload();
                
            } catch (error) {
                console.error('❌ Error clearing data:', error);
                alert('Error clearing data. Check console for details.');
                this.disabled = false;
                this.innerHTML = '<i class="bi bi-trash me-2"></i>Clear All Data';
            }
        });
    }
}
