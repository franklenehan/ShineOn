# Settings & Data Management Documentation

## Overview
The Settings page provides comprehensive data management tools including export, import, statistics, and data deletion capabilities.

## Features

### ✅ Export Data (Multiple Formats)
- **JSON**: Complete backup with all data
- **CSV**: Spreadsheet-compatible formats
- **Multiple CSVs**: Separate files for each data type

### ✅ Import Data
- **JSON Import**: Restore from backup
- **File Preview**: See what you're importing
- **Merge Mode**: Combines with existing data

### ✅ Statistics Dashboard
- Real-time data counts
- Storage usage tracking
- Refresh on demand

### ✅ Danger Zone
- Clear all data with triple confirmation
- Permanent deletion warning

---

## Export Functionality

### 1. Export as JSON

**Purpose**: Complete backup of all data

**What's Included**:
- All checklists (all dates)
- All treatments
- All future plans
- Reflections and goals
- Legacy data
- Export metadata

**File Format**:
```json
{
  "checklists": {
    "2025-10-27": {
      "supplements": [...],
      "updatedAt": "..."
    }
  },
  "treatments": [...],
  "futurePlans": [...],
  "reflections": {...},
  "goals": [...],
  "legacy": {...},
  "exportDate": "2025-10-27T12:34:56.789Z",
  "storageType": "IndexedDB"
}
```

**Filename**: `franks-cancer-journey-backup-YYYY-MM-DD.json`

**Console Logs**:
```
📥 Exporting JSON...
✅ Data exported: {...}
✅ JSON export complete
```

---

### 2. Export Treatments (CSV)

**Purpose**: Spreadsheet-compatible treatment records

**Columns**:
- Date
- Type
- Clinic
- Notes
- Attachments
- Created At

**Example**:
```csv
Date,Type,Clinic,Notes,Attachments,Created At
"2025-10-27","Chemotherapy","City Hospital","First session","lab_results.pdf","2025-10-27T10:00:00Z"
"2025-10-26","Consultation","Cancer Center","Follow-up","","2025-10-26T14:30:00Z"
```

**Filename**: `treatments-YYYY-MM-DD.csv`

**Console Logs**:
```
📊 Exporting treatments CSV...
📋 Found 5 treatments
✅ Treatments CSV export complete
```

---

### 3. Export Checklists (CSV)

**Purpose**: Daily supplement tracking data

**Columns**:
- Date
- Supplement Name
- Dosage
- Time
- Completed
- Notes

**Example**:
```csv
Date,Supplement Name,Dosage,Time,Completed,Notes
"2025-10-27","Vitamin D","1000 IU","Morning","Yes","Taken with breakfast"
"2025-10-27","Omega-3","500mg","Evening","No",""
"2025-10-26","Vitamin D","1000 IU","Morning","Yes",""
```

**Filename**: `checklists-YYYY-MM-DD.csv`

**Console Logs**:
```
📊 Exporting checklists CSV...
📋 Found 3 checklist dates
✅ Checklists CSV export complete
```

---

### 4. Export All (Multiple CSVs)

**Purpose**: Download all data types as separate CSV files

**Files Created**:
1. `treatments-YYYY-MM-DD.csv`
2. `checklists-YYYY-MM-DD.csv`
3. `future-plans-YYYY-MM-DD.csv`

**Console Logs**:
```
📊 Exporting all CSVs...
✅ All CSV exports complete
```

---

## Import Functionality

### JSON Import

**Steps**:
1. Click "Choose File"
2. Select your backup JSON file
3. Review file preview
4. Click "Import JSON Backup"
5. Confirm the action
6. Wait for completion
7. Refresh page to see imported data

**File Preview Shows**:
- Filename
- File size
- Checklist count
- Treatment count
- Future plan count
- Export date

**Import Behavior**:
- **Merge Mode**: Combines with existing data
- **Overwrites**: Same date/ID items are replaced
- **Preserves**: Unique items are kept

**Console Logs**:
```
📄 File selected: backup.json
✅ File parsed successfully
📥 Starting import...
📋 Importing data: {...}
✅ Imported 10 checklists
✅ Imported 5 treatments
✅ Imported 3 future plans
✅ Imported legacy data
✅ Import complete
```

**Safety Features**:
- File validation before import
- Confirmation dialog
- Error handling
- Status messages

---

## Statistics Dashboard

### Metrics Displayed

1. **Checklists**: Total number of saved checklist dates
2. **Treatments**: Total treatment records
3. **Future Plans**: Total future plan items
4. **Storage Used**: Total localStorage size in KB

### Refresh Button
- Manual refresh available
- Auto-refreshes after import
- Shows loading spinner

**Console Logs**:
```
📊 Updating statistics...
✅ Statistics updated
```

---

## Danger Zone

### Clear All Data

**Purpose**: Permanently delete all data

**Safety Measures**:
1. **First Confirmation**: "Are you absolutely sure?"
2. **Second Confirmation**: "Last chance!"
3. **Type Confirmation**: Must type "DELETE" (capitals)
4. **Final Alert**: "All data has been deleted"

**What Gets Deleted**:
- All checklists
- All treatments
- All future plans
- All reflections
- All goals
- All settings
- All legacy data
- Everything in IndexedDB
- Everything in LocalStorage

**Console Logs**:
```
⚠️ Clear all data requested
✅ All data cleared
```

**After Deletion**:
- Page automatically reloads
- Fresh start with empty data

---

## Console Logging

### Export Operations
- 📥 Exporting JSON
- 📊 Exporting CSV
- ✅ Export complete
- ❌ Export failed

### Import Operations
- 📄 File selected
- 📥 Starting import
- 📋 Importing data
- ✅ Import complete
- ❌ Import failed

### Statistics
- 📊 Updating statistics
- ✅ Statistics updated

### Danger Zone
- ⚠️ Clear all data requested
- ✅ All data cleared

---

## Error Handling

### Export Errors
- **No Data**: Shows warning "No [type] to export"
- **API Error**: Shows error message
- **Network Error**: Logs to console

### Import Errors
- **Invalid JSON**: "Invalid JSON file"
- **Parse Error**: Shows error message
- **Missing Data**: Skips missing fields
- **API Error**: Shows error message

### All Errors
- Logged to console with ❌
- User-friendly messages shown
- Buttons re-enabled
- Status cleared after 3 seconds

---

## File Formats

### JSON Export Structure
```javascript
{
  checklists: {
    "YYYY-MM-DD": {
      supplements: [...],
      updatedAt: "ISO date"
    }
  },
  treatments: [
    {
      id: number,
      date: "YYYY-MM-DD",
      type: string,
      clinic: string,
      notes: string,
      attachments: string,
      createdAt: "ISO date"
    }
  ],
  futurePlans: [
    {
      id: number,
      title: string,
      category: string,
      priority: string,
      completed: boolean,
      notes: string,
      createdAt: "ISO date"
    }
  ],
  exportDate: "ISO date",
  storageType: "IndexedDB" | "LocalStorage"
}
```

### CSV Format
- **Encoding**: UTF-8
- **Delimiter**: Comma (,)
- **Quotes**: Double quotes for text fields
- **Escaping**: Double quotes escaped as ""
- **Headers**: First row
- **Line Ending**: \n

---

## Usage Examples

### Backup Before Major Changes
```
1. Go to Settings page
2. Click "Download JSON Backup"
3. Save file to safe location
4. Proceed with changes
5. If needed, import backup to restore
```

### Transfer to New Device
```
1. On old device: Export JSON
2. Transfer file to new device
3. On new device: Open Settings
4. Import JSON file
5. Refresh page
```

### Analyze in Spreadsheet
```
1. Export Treatments CSV
2. Open in Excel/Google Sheets
3. Create charts and analysis
4. Share with healthcare team
```

### Clean Start
```
1. Export JSON backup first!
2. Go to Danger Zone
3. Clear All Data
4. Confirm deletion
5. Start fresh
```

---

## Best Practices

### Regular Backups
- Export JSON weekly
- Store in multiple locations
- Cloud storage recommended
- Date your backup files

### Before Updates
- Always export before major changes
- Test import on another device
- Verify data integrity

### Data Management
- Export CSV for analysis
- Share CSV with healthcare team
- Keep JSON for full restoration
- Don't rely solely on browser storage

### Security
- Backup files contain sensitive data
- Store securely
- Don't share publicly
- Delete old backups from insecure locations

---

## Troubleshooting

### Export Not Working
1. Check console for errors
2. Verify StorageAPI is loaded
3. Check if data exists
4. Try different export format
5. Refresh page and retry

### Import Not Working
1. Verify file is valid JSON
2. Check file size (not too large)
3. Look for parse errors in console
4. Try exporting first, then importing
5. Check browser console

### Statistics Wrong
1. Click refresh button
2. Check console for errors
3. Verify StorageAPI is working
4. Clear cache and reload

### Can't Delete Data
1. Check console for errors
2. Verify confirmation text
3. Try clearing browser data manually
4. Check browser permissions

---

## Browser Compatibility

### Supported Browsers
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)

### Required Features
- FileReader API
- Blob API
- URL.createObjectURL
- localStorage
- IndexedDB (preferred)

---

## Performance

### Export Times
- **JSON**: ~100-500ms (depends on data size)
- **CSV**: ~50-200ms per file
- **All CSVs**: ~500-1000ms total

### Import Times
- **Small (<100KB)**: ~100-500ms
- **Medium (100KB-1MB)**: ~500-2000ms
- **Large (>1MB)**: ~2-5 seconds

### Storage Limits
- **LocalStorage**: ~5-10MB total
- **IndexedDB**: ~50MB+ (browser dependent)
- **Export file**: No practical limit

---

## Future Enhancements

### Potential Features
- **Scheduled Backups**: Auto-export daily/weekly
- **Cloud Sync**: Google Drive, Dropbox integration
- **Selective Export**: Choose specific date ranges
- **Import Preview**: See changes before applying
- **Backup History**: Keep multiple versions
- **Encrypted Backups**: Password-protected exports
- **Auto-Import**: Drag-and-drop file import

---

**The Settings page provides complete control over your data with safe, reliable export and import functionality!** ⚙️✨
