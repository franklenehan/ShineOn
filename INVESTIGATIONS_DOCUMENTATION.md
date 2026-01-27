# Investigations Page Documentation

## Overview
The **Investigations** page allows you to document and track all research related to transplant options, treatment centers, holistic therapies, clinical trials, and other medical options.

## Features

### ✅ Research Management
- Add, edit, view, and delete research entries
- Comprehensive modal forms
- Detailed information tracking
- Bulk operations (select and delete multiple)

### ✅ Categorization & Filtering
- 8 predefined categories
- Priority levels (High, Medium, Low)
- Status tracking (To Review, Reviewing, Reviewed, etc.)
- Real-time search and filtering

### ✅ Data Organization
- Sortable table display
- Rating system (1-5 stars)
- Tags for custom organization
- Contact information storage

### ✅ Export Capabilities
- Export to CSV for spreadsheet analysis
- Share with healthcare team
- Backup research data

---

## Page Sections

### 1. Header & Add Button
```
┌─────────────────────────────────────────┐
│ Research & Investigations  [Add Research]│
│ Document your research on treatments... │
└─────────────────────────────────────────┘
```

### 2. Filter Section
- **Search**: Full-text search across title, category, notes, location, tags
- **Category Filter**: Filter by specific category
- **Priority Filter**: Filter by priority level
- **Clear Button**: Reset all filters

### 3. Statistics Cards
- **Total Research**: Count of all entries
- **High Priority**: Count of high-priority items
- **Reviewed**: Count of reviewed/pursuing items
- **Categories**: Number of unique categories used

### 4. Research Table
Columns:
- Checkbox (for bulk selection)
- Title (with location)
- Category
- Priority
- Status
- Date Added
- Rating
- Actions (View, Edit, Delete)

---

## Categories

### Predefined Categories
1. **Transplant Options**: Bone marrow, stem cell, organ transplants
2. **Treatment Centers**: Hospitals, clinics, specialized centers
3. **Holistic Options**: Natural therapies, complementary medicine
4. **Clinical Trials**: Experimental treatments, research studies
5. **Medications**: Drugs, pharmaceuticals, prescriptions
6. **Diet & Nutrition**: Dietary approaches, supplements, nutrition plans
7. **Alternative Therapies**: Acupuncture, meditation, energy healing
8. **Other**: Miscellaneous research

---

## Priority Levels

### High Priority
- **Color**: Red badge
- **Use**: Urgent research, immediate consideration
- **Examples**: Upcoming transplant options, time-sensitive trials

### Medium Priority
- **Color**: Yellow badge
- **Use**: Important but not urgent
- **Examples**: Potential future treatments, backup options

### Low Priority
- **Color**: Gray badge
- **Use**: General information, long-term considerations
- **Examples**: Exploratory research, informational resources

---

## Status Options

### To Review
- **Color**: Gray
- **Meaning**: Not yet reviewed, needs attention

### Reviewing
- **Color**: Blue
- **Meaning**: Currently researching, gathering information

### Reviewed
- **Color**: Green
- **Meaning**: Research complete, information gathered

### Pursuing
- **Color**: Primary blue
- **Meaning**: Actively pursuing this option

### On Hold
- **Color**: Yellow
- **Meaning**: Paused, may revisit later

### Not Suitable
- **Color**: Dark gray
- **Meaning**: Determined not appropriate, archived

---

## Data Fields

### Required Fields
- **Title**: Name of the research topic
- **Category**: One of 8 predefined categories
- **Priority**: High, Medium, or Low

### Optional Fields
- **Status**: Current status (default: To Review)
- **Rating**: 1-5 stars
- **Source/Link**: Website or document URL
- **Contact Person**: Name of contact
- **Phone Number**: Contact phone
- **Location**: Geographic location
- **Notes**: Detailed notes, pros/cons, costs
- **Tags**: Comma-separated custom tags

---

## Modal Forms

### Add Research Modal
```
┌─────────────────────────────────────┐
│ ➕ Add Research Entry          [X]  │
├─────────────────────────────────────┤
│ Title: [Mayo Clinic Transplant...]  │
│ Category: [Transplant Options ▼]    │
│ Priority: [High ▼]                  │
│ Status: [To Review ▼]               │
│ Rating: [⭐⭐⭐⭐⭐ ▼]                │
│ Source: [https://...]               │
│ Contact: [Dr. Smith]                │
│ Phone: [(555) 123-4567]             │
│ Location: [Rochester, MN]           │
│ Notes: [Detailed information...]    │
│ Tags: [stem-cell, insurance-covered]│
├─────────────────────────────────────┤
│           [Cancel] [Save Research]  │
└─────────────────────────────────────┘
```

### View Details Modal
- Shows all information in read-only format
- Formatted display with icons
- Clickable links
- Edit button to switch to edit mode

---

## Usage Examples

### Example 1: Transplant Center Research
```
Title: Mayo Clinic Bone Marrow Transplant Program
Category: Transplant Options
Priority: High
Status: Reviewing
Rating: ⭐⭐⭐⭐⭐
Source: https://www.mayoclinic.org/transplant
Contact: Dr. Sarah Johnson
Phone: (507) 284-2511
Location: Rochester, MN
Notes: 
- Top-ranked transplant program
- Insurance accepted
- 6-month wait list
- Requires donor match
- Cost: $300,000-$500,000
Tags: bone-marrow, insurance-covered, top-ranked
```

### Example 2: Holistic Treatment
```
Title: Integrative Cancer Care Center
Category: Holistic Options
Priority: Medium
Status: To Review
Rating: ⭐⭐⭐⭐
Source: https://example.com
Location: San Diego, CA
Notes:
- Combines conventional and alternative therapies
- Nutrition counseling
- Acupuncture
- Meditation classes
- Not covered by insurance
Tags: holistic, nutrition, acupuncture, out-of-pocket
```

### Example 3: Clinical Trial
```
Title: CAR T-Cell Therapy Trial
Category: Clinical Trials
Priority: High
Status: Pursuing
Rating: ⭐⭐⭐⭐⭐
Source: https://clinicaltrials.gov/study/NCT12345
Contact: Trial Coordinator
Phone: (555) 987-6543
Location: Multiple sites
Notes:
- Phase 2 trial
- Eligibility: Age 18-65, specific cancer type
- No cost to participants
- Requires travel
- Application deadline: Dec 31
Tags: clinical-trial, car-t, no-cost, experimental
```

---

## Console Logging

### Initialization
```
🔬 Investigations module loading...
🔬 Initializing Investigations page...
📥 Loading research data...
✅ Loaded 5 research entries
✅ Investigations page initialized
```

### Adding Research
```
💾 Saving research entry...
✅ Research entry added: Mayo Clinic Transplant Program
💾 Saving research data...
✅ Research data saved
```

### Filtering
```
🔍 Applying filters...
✅ Filtered to 3 entries
📊 Rendering 3 research entries...
✅ Table rendered
```

### Deleting
```
🗑️ Deleting research: 1234567890
✅ Research deleted
💾 Saving research data...
✅ Research data saved
```

### Exporting
```
📊 Exporting research as CSV...
✅ CSV exported
```

---

## Data Storage

### Storage Location
- **IndexedDB**: `METADATA` store with key `research`
- **LocalStorage Fallback**: `fcj_meta_research`

### Data Structure
```javascript
{
  id: 1234567890,
  title: "Mayo Clinic Transplant Program",
  category: "Transplant Options",
  priority: "High",
  status: "Reviewing",
  rating: "5",
  source: "https://example.com",
  contact: "Dr. Smith",
  phone: "(555) 123-4567",
  location: "Rochester, MN",
  notes: "Detailed notes here...",
  tags: "stem-cell, insurance-covered",
  dateAdded: "2025-10-27T12:34:56.789Z",
  lastModified: "2025-10-27T14:20:00.000Z"
}
```

---

## Filtering & Search

### Search Functionality
Searches across:
- Title
- Category
- Notes
- Location
- Tags

**Example**: Searching "stem" finds entries with:
- "stem-cell" in tags
- "Stem Cell Transplant" in title
- "stem cell therapy" in notes

### Filter Combinations
Filters work together (AND logic):
- Search: "transplant"
- Category: "Transplant Options"
- Priority: "High"

Result: Only high-priority transplant options containing "transplant"

---

## Bulk Operations

### Select Multiple Entries
1. Check individual checkboxes
2. Or use "Select All" checkbox
3. Delete button shows count: "Delete Selected (3)"
4. Confirm deletion
5. All selected entries deleted

### Select All States
- **Unchecked**: No items selected
- **Checked**: All items selected
- **Indeterminate**: Some items selected

---

## Export Format

### CSV Structure
```csv
Title,Category,Priority,Status,Rating,Location,Contact,Phone,Source,Notes,Tags,Date Added
"Mayo Clinic","Transplant Options","High","Reviewing","5","Rochester, MN","Dr. Smith","(555) 123-4567","https://...","Detailed notes","stem-cell, insurance","Oct 27, 2025"
```

### Filename
`research-YYYY-MM-DD.csv`

Example: `research-2025-10-27.csv`

---

## Best Practices

### Organization Tips
1. **Use Consistent Tags**: Create a tag vocabulary
2. **Update Status**: Keep status current
3. **Rate After Review**: Add ratings after thorough review
4. **Add Contact Info**: Include all relevant contacts
5. **Detailed Notes**: Document pros, cons, costs, requirements

### Priority Guidelines
- **High**: Time-sensitive, immediate consideration
- **Medium**: Important, not urgent
- **Low**: Informational, long-term

### Status Workflow
```
To Review → Reviewing → Reviewed → Pursuing
                                 ↓
                            On Hold / Not Suitable
```

---

## Keyboard Shortcuts

### Modal Navigation
- **Tab**: Move between fields
- **Enter**: Submit form (when focused on input)
- **Esc**: Close modal

### Table Navigation
- **Click Row**: Select checkbox
- **Shift+Click**: Select range (future enhancement)

---

## Responsive Design

### Desktop (>992px)
- Full table with all columns
- Side-by-side filter fields
- Comfortable spacing

### Tablet (768-992px)
- Scrollable table
- Stacked filter fields
- Touch-friendly buttons

### Mobile (<768px)
- Horizontal scroll for table
- Full-width filters
- Larger touch targets
- Simplified view options

---

## Integration with Other Pages

### Settings Page
- Export research via Settings → Export All CSVs
- Import research from JSON backup
- Clear all research data

### Future Enhancements
- Link research to treatments
- Link research to future plans
- Timeline view of research progress
- Comparison tool for options

---

## Troubleshooting

### Research Not Saving
1. Check console for errors
2. Verify required fields filled
3. Check StorageAPI is initialized
4. Try refreshing page

### Filters Not Working
1. Clear filters and try again
2. Check console for errors
3. Verify data loaded correctly
4. Refresh page

### Export Not Working
1. Check if research exists
2. Verify browser allows downloads
3. Check console for errors
4. Try different browser

---

## Future Enhancements

### Potential Features
1. **Attachments**: Upload PDFs, images, documents
2. **Reminders**: Set follow-up reminders
3. **Comparison View**: Side-by-side comparison
4. **Timeline**: Visual timeline of research
5. **Sharing**: Share specific entries
6. **Templates**: Pre-filled templates for common research types
7. **Cost Tracking**: Track estimated costs
8. **Insurance Info**: Track coverage details
9. **Pros/Cons Lists**: Structured decision-making
10. **Decision Matrix**: Weighted scoring system

---

**The Investigations page provides a comprehensive system for tracking and organizing all your medical research in one place!** 🔬✨
