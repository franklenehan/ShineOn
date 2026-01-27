# Storage API Documentation

## Overview
The Storage API provides a robust data persistence layer using **IndexedDB** as the primary storage method with automatic fallback to **LocalStorage** if IndexedDB is unavailable.

## Features
- ✅ **IndexedDB First**: Robust, structured storage for large datasets
- ✅ **Automatic Fallback**: Seamlessly switches to LocalStorage if needed
- ✅ **Promise-Based**: Modern async/await API
- ✅ **Type Safety**: Organized into separate stores (checklists, treatments, plans, etc.)
- ✅ **Backward Compatible**: Legacy Storage object still works
- ✅ **Auto-Initialize**: Database initializes on page load

## API Reference

### Initialization

```javascript
// Initialize the database (called automatically on page load)
await StorageAPI.initDB();
```

### Checklists

```javascript
// Save a checklist for a specific date
await StorageAPI.saveChecklist('2025-10-27', {
    supplements: [
        { name: 'Vitamin D', dose: '1000 IU', completed: true, notes: 'Taken with breakfast' },
        { name: 'Omega-3', dose: '500mg', completed: false, notes: '' }
    ],
    notes: 'Feeling energetic today',
    painLevel: 2,
    energyLevel: 8
});

// Get a checklist for a specific date
const checklist = await StorageAPI.getChecklist('2025-10-27');
console.log(checklist);
// Returns: { date: '2025-10-27', supplements: [...], notes: '...', updatedAt: '...' }

// List all checklist dates
const dates = await StorageAPI.listChecklistDates();
console.log(dates);
// Returns: ['2025-10-25', '2025-10-26', '2025-10-27']
```

### Treatments

```javascript
// Save a new treatment
const treatmentId = await StorageAPI.saveTreatment({
    date: '2025-10-27',
    type: 'Chemotherapy',
    clinic: 'City Hospital Oncology Center',
    notes: 'First session went well. Mild nausea in the evening.',
    attachments: 'lab_results_oct27.pdf'
});

// Update an existing treatment (include the id)
await StorageAPI.saveTreatment({
    id: treatmentId,
    date: '2025-10-27',
    type: 'Chemotherapy',
    clinic: 'City Hospital Oncology Center',
    notes: 'Updated notes: Nausea subsided after medication.',
    attachments: 'lab_results_oct27.pdf'
});

// List all treatments
const treatments = await StorageAPI.listTreatments();
console.log(treatments);
// Returns: [{ id: 1, date: '...', type: '...', ... }, ...]

// Delete a treatment
await StorageAPI.deleteTreatment(treatmentId);
```

### Future Plans

```javascript
// Save a new future plan
const planId = await StorageAPI.saveFuturePlan({
    title: 'Weekend trip to the beach',
    category: 'Travel',
    priority: 'High',
    notes: 'Book hotel in advance. Check weather forecast.',
    completed: false
});

// Update a plan (mark as completed)
await StorageAPI.saveFuturePlan({
    id: planId,
    title: 'Weekend trip to the beach',
    category: 'Travel',
    priority: 'High',
    notes: 'Had an amazing time! Weather was perfect.',
    completed: true,
    completedAt: new Date().toISOString()
});

// List all future plans
const plans = await StorageAPI.listFuturePlans();
console.log(plans);
// Returns: [{ id: 1, title: '...', category: '...', ... }, ...]
```

### Export All Data

```javascript
// Export all data as JSON
const allData = await StorageAPI.exportAll();

// Download as file
const dataStr = JSON.stringify(allData, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = `cancer-journey-backup-${new Date().toISOString().split('T')[0]}.json`;
link.click();

// Export structure:
{
    "checklists": {
        "2025-10-27": { ... }
    },
    "treatments": [ ... ],
    "futurePlans": [ ... ],
    "reflections": { ... },
    "goals": [ ... ],
    "legacy": { ... },
    "exportDate": "2025-10-27T23:59:00.000Z",
    "storageType": "IndexedDB"
}
```

### Clear All Data

```javascript
// Clear all data (use with caution!)
if (confirm('Are you sure you want to delete all data?')) {
    await StorageAPI.clearAll();
    console.log('All data cleared');
}
```

## Data Structures

### Checklist Object
```javascript
{
    date: '2025-10-27',           // YYYY-MM-DD format (key)
    supplements: [                 // Array of supplement items
        {
            name: 'Vitamin D',
            dose: '1000 IU',
            completed: true,
            notes: 'Taken with breakfast'
        }
    ],
    notes: 'Daily notes',
    painLevel: 2,                  // 1-10 scale
    energyLevel: 8,                // 1-10 scale
    updatedAt: '2025-10-27T12:00:00.000Z'
}
```

### Treatment Object
```javascript
{
    id: 12345,                     // Auto-generated or provided
    date: '2025-10-27',
    type: 'Chemotherapy',
    clinic: 'City Hospital',
    notes: 'Treatment notes',
    attachments: 'file.pdf',
    createdAt: '2025-10-27T10:00:00.000Z'
}
```

### Future Plan Object
```javascript
{
    id: 67890,                     // Auto-generated or provided
    title: 'Trip to Paris',
    category: 'Travel',            // Travel, Hobby, Milestone, etc.
    priority: 'High',              // High, Medium, Low
    notes: 'Plan details',
    completed: false,
    completedAt: null,             // ISO string when completed
    createdAt: '2025-10-27T15:00:00.000Z'
}
```

## IndexedDB Structure

### Database Name
`FranksCancerJourneyDB`

### Object Stores
1. **checklists** - Keyed by date (YYYY-MM-DD)
2. **treatments** - Auto-incrementing ID
3. **futurePlans** - Auto-incrementing ID
4. **reflections** - Keyed by date
5. **goals** - Auto-incrementing ID
6. **metadata** - App metadata

### Indexes
- **checklists**: `date` (unique)
- **treatments**: `date` (non-unique)
- **futurePlans**: `completed` (non-unique)
- **reflections**: `date` (unique)

## LocalStorage Fallback

When IndexedDB is unavailable, data is stored in LocalStorage with these keys:
- `fcj_checklists` - Object keyed by date
- `fcj_treatments` - Array
- `fcj_futurePlans` - Array
- `fcj_reflections` - Object keyed by date
- `fcj_goals` - Array

## Backward Compatibility

The legacy `Storage` object is still available for existing code:

```javascript
// Old API (still works)
Storage.save('myKey', { data: 'value' });
const data = Storage.load('myKey');
Storage.remove('myKey');
Storage.clearAll();
```

## Error Handling

All methods handle errors gracefully:
- IndexedDB failures automatically fall back to LocalStorage
- Failed operations log errors to console
- Methods return `null`, `false`, or empty arrays on failure
- Promises reject with error objects

## Best Practices

1. **Always use async/await**
   ```javascript
   async function saveData() {
       await StorageAPI.saveChecklist('2025-10-27', data);
   }
   ```

2. **Check return values**
   ```javascript
   const success = await StorageAPI.saveChecklist(date, data);
   if (!success) {
       console.error('Save failed');
   }
   ```

3. **Handle errors**
   ```javascript
   try {
       const data = await StorageAPI.exportAll();
   } catch (error) {
       console.error('Export failed:', error);
   }
   ```

4. **Use date strings consistently**
   ```javascript
   const dateStr = new Date().toISOString().split('T')[0]; // '2025-10-27'
   ```

5. **Include IDs when updating**
   ```javascript
   // Update existing record
   await StorageAPI.saveTreatment({
       id: existingId,  // Important!
       ...updatedData
   });
   ```

## Browser Support

- **IndexedDB**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **LocalStorage**: Universal support
- **Fallback**: Automatic and transparent

## Performance

- **IndexedDB**: Can handle large datasets (50MB+)
- **LocalStorage**: Limited to ~5-10MB total
- **Async**: Non-blocking operations
- **Indexed**: Fast queries on indexed fields

## Security

- **Client-side only**: No server transmission
- **Same-origin policy**: Data isolated per domain
- **No encryption**: Data stored in plain text
- **User control**: Can be cleared via browser settings

---

**Note**: This API is designed for client-side storage only. For production use with sensitive medical data, consider server-side storage with proper encryption and authentication.
