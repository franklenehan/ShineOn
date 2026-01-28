# My Cancer Journey

A personal health tracking web application to manage cancer treatment, track progress, and maintain daily wellness routines.

## Features

### 🏠 Home Dashboard
- **Mission Statement**: Welcoming overview and daily motivation
- **Supplement Checklist**: Track daily supplements with completion status
- **Daily Reflection**: Auto-saving journal for thoughts and feelings
- **Daily Quote**: Inspirational quotes that change daily
- **Quick Stats**: Real-time statistics showing progress

### 💊 Treatments
- Add and manage medical treatments
- Track start dates
- Remove completed treatments

### 📊 Tracker
- Daily symptom check-ins
- Pain level tracking (1-10)
- Energy level tracking (1-10)
- Notes and observations
- View recent entries

### 🌟 Future Plans
- Short-term goals
- Long-term goals
- Bucket list
- All goals are editable and deletable

## Key IDs for JavaScript Integration

### Index Page (index.html)
- `#today-checklist` - Container for supplement checklist items
- `#daily-reflection` - Textarea for daily journal entries
- `#quote` - Container for daily quote
- `#dailyQuote` - Paragraph element for quote text
- `#completed-checklists-today` - Badge showing completed supplements
- `#total-checkins` - Badge showing total check-ins
- `#active-treatments` - Badge showing active treatments count
- `#days-tracked` - Badge showing unique days tracked
- `#add-supplement-btn` - Button to add new supplements
- `#save-reflection-btn` - Button to manually save reflection
- `#reflection-status` - Status text for auto-save indicator

### Other Pages
- `#treatmentForm` - Form for adding treatments
- `#currentTreatments` - List of current treatments
- `#dailyCheckinForm` - Form for daily check-ins
- `#recentEntries` - Container for recent check-in entries
- `#shortTermGoals` - List of short-term goals
- `#longTermGoals` - List of long-term goals
- `#bucketList` - Textarea for bucket list

## File Structure

```
FranksCancerJourney/
├── index.html              # Home dashboard
├── treatments.html         # Treatment management
├── tracker.html           # Daily symptom tracker
├── future.html            # Goals and aspirations
├── README.md              # This file
├── components/
│   ├── header.html        # Reusable navigation header
│   └── footer.html        # Reusable footer with data controls
├── css/
│   └── style.css          # Custom styles
└── js/
    ├── app.js             # Main application logic
    ├── storage.js         # LocalStorage management
    ├── quotes.js          # Daily inspirational quotes
    └── components.js      # Component loader and utilities
```

## Data Storage

All data is stored locally in the browser using localStorage:

- `supplements` - Array of supplement objects
- `todayChecklist` - Today's completion status
- `reflections` - Object with dates as keys
- `treatments` - Array of treatment objects
- `checkins` - Array of daily check-in objects
- `goals` - Object with shortTerm, longTerm, and bucketList
- `dailyQuote` - Today's quote with date

## Technologies Used

- **Bootstrap 5.3** - Responsive UI framework
- **Bootstrap Icons** - Icon library
- **Vanilla JavaScript** - No frameworks needed
- **LocalStorage API** - Client-side data persistence

## Getting Started

### Option 1: Using a Local Web Server (Recommended)

Run the included start script:
```bash
./start-server.sh
```
Then open your browser to `http://localhost:8000`

Or manually start a server:
```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js
npx http-server -p 8000
```

### Option 2: Open Directly in Browser

You can also simply open `index.html` directly in your browser. The app includes fallback navigation that works without a server.

### Using the App

1. Start adding supplements to your daily checklist
2. Write your daily reflection
3. Navigate to other pages using the header menu
4. All data saves automatically in your browser

## Privacy

All data is stored locally in your browser. No information is sent to any server or third party. Use the "Download Data" button in the footer to export your data as JSON.

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- LocalStorage API
- Fetch API
- CSS Grid and Flexbox

---

**Note**: This is a static web application. All functionality runs in the browser with no backend required.
>>>>>>> e1e11c0 (Initial commit)
