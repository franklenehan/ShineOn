/**
 * ========================================
 * Storage Module for Frank's Cancer Journey
 * IndexedDB with LocalStorage fallback
 * ========================================
 * 
 * This module provides a robust storage API using IndexedDB as the primary
 * storage method with automatic fallback to LocalStorage if IndexedDB is
 * unavailable or fails.
 * 
 * EXAMPLE USAGE:
 * 
 * // Initialize the database
 * await StorageAPI.initDB();
 * 
 * // Save a checklist
 * await StorageAPI.saveChecklist('2025-10-27', {
 *     supplements: [
 *         { name: 'Vitamin D', dose: '1000 IU', completed: true }
 *     ],
 *     notes: 'Feeling good today'
 * });
 * 
 * // Get a checklist
 * const checklist = await StorageAPI.getChecklist('2025-10-27');
 * 
 * // List all checklist dates
 * const dates = await StorageAPI.listChecklistDates();
 * 
 * // Save a treatment
 * await StorageAPI.saveTreatment({
 *     id: Date.now(),
 *     date: '2025-10-27',
 *     type: 'Chemotherapy',
 *     clinic: 'City Hospital',
 *     notes: 'First session went well'
 * });
 * 
 * // List all treatments
 * const treatments = await StorageAPI.listTreatments();
 * 
 * // Save a future plan
 * await StorageAPI.saveFuturePlan({
 *     id: Date.now(),
 *     title: 'Trip to Paris',
 *     category: 'Travel',
 *     priority: 'High',
 *     completed: false
 * });
 * 
 * // Export all data
 * const allData = await StorageAPI.exportAll();
 * console.log(JSON.stringify(allData, null, 2));
 */

const StorageAPI = (function() {
    'use strict';
    
    // Configuration
    const DB_NAME = 'FranksCancerJourneyDB';
    const DB_VERSION = 1;
    const STORES = {
        CHECKLISTS: 'checklists',
        TREATMENTS: 'treatments',
        FUTURE_PLANS: 'futurePlans',
        REFLECTIONS: 'reflections',
        GOALS: 'goals',
        METADATA: 'metadata'
    };
    
    let db = null;
    let useIndexedDB = false; // moved to API backend
    const API_BASE = (window.API_BASE_URL ? (window.API_BASE_URL.replace(/\/$/, '') + '/api') : 'http://localhost:4000/api');

    async function apiFetch(path, options = {}) {
        const token = (typeof window.getAuthToken === 'function') ? await window.getAuthToken() : null;
        const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }));
        if (!res.ok) {
            const text = await res.text().catch(()=> '');
            throw new Error(`API ${res.status}: ${text}`);
        }
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return res.json();
        return res.text();
    }
    
    /**
     * Initialize IndexedDB
     * @returns {Promise<boolean>} Success status
     */
    async function initDB() { return true; }
    
    /**
     * Initialize LocalStorage fallback
     * @returns {Promise<boolean>}
     */
    function initLocalStorage() { return Promise.resolve(true); }
    
    /**
     * Generic IndexedDB transaction helper
     * @param {string} storeName - Object store name
     * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
     * @param {Function} callback - Callback function with store parameter
     * @returns {Promise}
     */
    function dbTransaction(storeName, mode, callback) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            try {
                const transaction = db.transaction([storeName], mode);
                const store = transaction.objectStore(storeName);
                const request = callback(store);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Save a checklist for a specific date
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @param {Object} checklistObject - Checklist data
     * @returns {Promise<boolean>}
     */
    async function saveChecklist(dateString, checklistObject) {
        await apiFetch(`/checklists/${encodeURIComponent(dateString)}`, {
            method: 'PUT',
            body: JSON.stringify({
                supplements: checklistObject.supplements ?? null,
                notes: checklistObject.notes ?? null
            })
        });
        return true;
    }
    
    /**
     * Get a checklist for a specific date
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {Promise<Object|null>}
     */
    async function getChecklist(dateString) {
        return await apiFetch(`/checklists/${encodeURIComponent(dateString)}`);
    }
    
    /**
     * List all checklist dates
     * @returns {Promise<string[]>}
     */
    async function listChecklistDates() {
        return await apiFetch('/checklists');
    }
    
    /**
     * Save a treatment record
     * @param {Object} treatmentObject - Treatment data
     * @returns {Promise<number>} Treatment ID
     */
    async function saveTreatment(treatmentObject) {
        const resp = await apiFetch('/treatments', { method: 'POST', body: JSON.stringify(treatmentObject) });
        return resp.id || treatmentObject.external_id || null;
    }
    
    /**
     * List all treatments
     * @returns {Promise<Array>}
     */
    async function listTreatments() {
        return await apiFetch('/treatments');
    }
    
    /**
     * Delete a treatment
     * @param {number} treatmentId - Treatment ID
     * @returns {Promise<boolean>}
     */
    async function deleteTreatment(treatmentId) {
        await apiFetch(`/treatments/${encodeURIComponent(treatmentId)}`, { method: 'DELETE' });
        return true;
    }
    
    /**
     * Save a future plan
     * @param {Object} planObject - Plan data
     * @returns {Promise<number>} Plan ID
     */
    async function saveFuturePlan(planObject) {
        const resp = await apiFetch('/future-plans', { method: 'POST', body: JSON.stringify(planObject) });
        return resp.id || planObject.external_id || null;
    }
    
    /**
     * List all future plans
     * @returns {Promise<Array>}
     */
    async function listFuturePlans() {
        return await apiFetch('/future-plans');
    }
    
    /**
     * Export all data
     * @returns {Promise<Object>} All data as JSON
     */
    async function exportAll() {
        return await apiFetch('/export', { method: 'POST' });
    }
    
    /**
     * Clear all data (use with caution!)
     * @returns {Promise<boolean>}
     */
    async function clearAll() {
        await apiFetch('/clear-all', { method: 'DELETE' });
        return true;
    }
    
    // Legacy Storage object for backward compatibility
    const Storage = {
        save: function(key, data) {
            try {
                localStorage.setItem(`frank_cancer_journey_${key}`, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('Error saving to localStorage:', e);
                return false;
            }
        },
        
        load: function(key) {
            try {
                const data = localStorage.getItem(`frank_cancer_journey_${key}`);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.error('Error loading from localStorage:', e);
                return null;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(`frank_cancer_journey_${key}`);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage:', e);
                return false;
            }
        },
        
        clearAll: function() {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('frank_cancer_journey_')) {
                        localStorage.removeItem(key);
                    }
                });
                return true;
            } catch (e) {
                console.error('Error clearing localStorage:', e);
                return false;
            }
        }
    };
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await initDB();
            console.log('Storage initialized successfully');
        } catch (error) {
            console.error('Storage initialization failed:', error);
        }
    });
    
    /**
     * Save metadata (generic key-value storage)
     * @param {string} key - Metadata key
     * @param {any} value - Value to store
     * @returns {Promise<boolean>}
     */
    async function saveMetadata(key, value) {
        await apiFetch(`/metadata/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(value) });
        return true;
    }
    
    /**
     * Get metadata
     * @param {string} key - Metadata key
     * @returns {Promise<any>}
     */
    async function getMetadata(key) {
        return await apiFetch(`/metadata/${encodeURIComponent(key)}`);
    }
    
    // Nutrition endpoints
    async function listNutritionTips() {
        return await apiFetch('/nutrition/tips');
    }
    async function saveNutritionTip(tip) {
        // tip: { id?, title, category?, details? }
        const resp = await apiFetch('/nutrition/tips', { method: 'POST', body: JSON.stringify(tip) });
        return resp.id || tip.id || null;
    }
    async function deleteNutritionTip(id) {
        await apiFetch(`/nutrition/tips/${encodeURIComponent(id)}`, { method: 'DELETE' });
        return true;
    }
    async function listNutritionRecipes(category) {
        const q = category ? `?category=${encodeURIComponent(category)}` : '';
        return await apiFetch(`/nutrition/recipes${q}`);
    }
    async function saveNutritionRecipe(recipe) {
        // recipe: { id?, title, category, ingredients[], instructions? }
        const resp = await apiFetch('/nutrition/recipes', { method: 'POST', body: JSON.stringify(recipe) });
        return resp.id || recipe.id || null;
    }
    async function deleteNutritionRecipe(id) {
        await apiFetch(`/nutrition/recipes/${encodeURIComponent(id)}`, { method: 'DELETE' });
        return true;
    }
    
    // Public API
    return {
        initDB,
        saveChecklist,
        getChecklist,
        listChecklistDates,
        saveTreatment,
        listTreatments,
        deleteTreatment,
        saveFuturePlan,
        listFuturePlans,
        saveMetadata,
        getMetadata,
        listNutritionTips,
        saveNutritionTip,
        deleteNutritionTip,
        listNutritionRecipes,
        saveNutritionRecipe,
        deleteNutritionRecipe,
        exportAll,
        clearAll,
        // Expose legacy Storage for backward compatibility
        Storage
    };
})();

// Make StorageAPI globally available
window.StorageAPI = StorageAPI;

// Keep legacy Storage object for backward compatibility
window.Storage = StorageAPI.Storage;
