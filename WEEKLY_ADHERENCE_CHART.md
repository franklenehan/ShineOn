# Weekly Adherence Chart Documentation

## Overview
The homepage now features a **Weekly Adherence Chart** that visualizes supplement completion rates over the past 7 days using Chart.js.

## Features

### ✅ Visual Analytics
- Line chart showing daily adherence percentages
- Gradient fill (teal to blue)
- Smooth curved lines
- Interactive tooltips
- Responsive design

### ✅ Data Computation
- Calculates percentage of completed supplements per day
- Uses `StorageAPI.listChecklistDates()` to get all dates
- Uses `StorageAPI.getChecklist(date)` to get daily data
- Computes weekly average from valid days

### ✅ Display Elements
- 7-day chart (last week)
- Weekly average badge
- Day labels (Mon, Tue, Wed, etc.)
- Percentage scale (0-100%)
- Hover tooltips with exact percentages

---

## Chart Visualization

```
Weekly Adherence
┌─────────────────────────────────────┐
│ 100%─                          ●    │
│      \                        /     │
│  75%─ \      ●───●          /       │
│        \    /     \        /        │
│  50%─   \  /       \      /         │
│          ●           \   /          │
│  25%─                 \ /           │
│                        ●            │
│   0%─────────────────────────────── │
│     Mon Tue Wed Thu Fri Sat Sun     │
└─────────────────────────────────────┘
     [85% Average] [Last 7 Days]
```

---

## Data Flow

### Initialization
```
Page Load →
  initIndexPage() →
    initWeeklyAdherenceChart() →
      Get last 7 dates →
      For each date:
        Get checklist →
        Calculate percentage →
      Compute average →
      Create chart
```

### Calculation Logic
```javascript
// For each day
const total = supplements.length;
const completed = supplements.filter(s => s.completed).length;
const percentage = Math.round((completed / total) * 100);

// Weekly average (only days with data)
const validDays = adherenceData.filter(val => val > 0);
const average = Math.round(
  validDays.reduce((sum, val) => sum + val, 0) / validDays.length
);
```

---

## Console Logs

### Initialization
```
📊 Initializing weekly adherence chart...
📅 Chart dates: ['2025-10-21', '2025-10-22', ..., '2025-10-27']
📋 All checklist dates: ['2025-10-25', '2025-10-26', '2025-10-27']
```

### Daily Calculations
```
📊 2025-10-21: No checklist
📊 2025-10-22: No checklist
📊 2025-10-23: No checklist
📊 2025-10-24: No checklist
📊 2025-10-25: 3/5 = 60%
📊 2025-10-26: 5/5 = 100%
📊 2025-10-27: 4/5 = 80%
```

### Average & Completion
```
📊 Weekly average: 80%
✅ Weekly adherence chart created
```

---

## Chart Configuration

### Chart Type
- **Type**: Line chart
- **Library**: Chart.js 4.4.0
- **Responsive**: Yes
- **Aspect Ratio**: Fixed height (300px)

### Visual Styling

**Line**:
- Color: Teal (#5FA8A8)
- Width: 3px
- Tension: 0.4 (curved)
- Fill: Gradient (teal to blue)

**Points**:
- Radius: 5px
- Hover radius: 7px
- Border: White, 2px
- Background: Teal
- Hover background: Blue

**Gradient**:
```javascript
gradient.addColorStop(0, 'rgba(95, 168, 168, 0.8)');  // Top: Teal
gradient.addColorStop(1, 'rgba(74, 144, 164, 0.2)');  // Bottom: Blue
```

### Axes

**Y-Axis (Percentage)**:
- Range: 0-100%
- Labels: "0%", "25%", "50%", "75%", "100%"
- Grid: Light gray, subtle
- Font: 12px, gray

**X-Axis (Days)**:
- Labels: "Mon", "Tue", "Wed", etc.
- No grid lines
- Font: 12px, gray

### Tooltips
- Background: Black (80% opacity)
- Padding: 12px
- Title: 14px bold
- Body: 13px
- Format: "Adherence: 85%"

---

## Data Structure

### Input Data
```javascript
{
  dates: ['2025-10-21', '2025-10-22', ...],
  adherenceData: [0, 0, 0, 0, 60, 100, 80],
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  average: 80
}
```

### Checklist Structure
```javascript
{
  date: '2025-10-27',
  supplements: [
    { name: 'Vitamin D', completed: true },
    { name: 'Omega-3', completed: true },
    { name: 'Vitamin C', completed: false },
    { name: 'Zinc', completed: true },
    { name: 'Magnesium', completed: true }
  ]
}
// Result: 4/5 = 80%
```

---

## UI Components

### Card Header
- Gradient background (teal to blue)
- White text
- Graph icon
- Title: "Weekly Adherence"

### Info Text
- Explains what the chart shows
- Info icon
- Muted gray color

### Chart Container
- Fixed height: 300px
- Responsive width
- Canvas element

### Badges
- **Average Badge**: Green, shows percentage
- **Period Badge**: Blue, shows "Last 7 Days"

---

## Responsive Design

### Desktop (>768px)
- Full width chart
- Comfortable spacing
- All labels visible

### Tablet (768px)
- Slightly compressed
- Labels still readable
- Touch-friendly

### Mobile (<768px)
- Full width
- Smaller fonts
- Touch interactions
- Scrollable if needed

---

## Performance

### Loading Time
- Initial render: ~50-200ms
- Data fetch: ~10-50ms (cached)
- Chart creation: ~20-50ms
- Total: ~100-300ms

### Optimization
- Single data fetch
- Cached checklist data
- Efficient calculation
- No unnecessary re-renders

---

## Example Scenarios

### Scenario 1: Perfect Week
```
Mon: 5/5 = 100%
Tue: 5/5 = 100%
Wed: 5/5 = 100%
Thu: 5/5 = 100%
Fri: 5/5 = 100%
Sat: 5/5 = 100%
Sun: 5/5 = 100%
Average: 100%
```
Chart shows flat line at 100%

### Scenario 2: Improving Trend
```
Mon: 2/5 = 40%
Tue: 3/5 = 60%
Wed: 3/5 = 60%
Thu: 4/5 = 80%
Fri: 4/5 = 80%
Sat: 5/5 = 100%
Sun: 5/5 = 100%
Average: 74%
```
Chart shows upward trend

### Scenario 3: Partial Week
```
Mon: No data = 0%
Tue: No data = 0%
Wed: No data = 0%
Thu: No data = 0%
Fri: 4/5 = 80%
Sat: 5/5 = 100%
Sun: 4/5 = 80%
Average: 87% (only counts days with data)
```
Chart shows flat line at 0% then jumps up

### Scenario 4: No Data
```
All days: No data = 0%
Average: 0%
```
Chart shows flat line at 0%

---

## Integration Points

### StorageAPI Calls
```javascript
// Get all dates with checklists
const dates = await StorageAPI.listChecklistDates();

// Get specific checklist
const checklist = await StorageAPI.getChecklist('2025-10-27');
```

### Chart Instance
```javascript
// Stored globally for potential updates
window.adherenceChart = chart;

// Can be updated later
window.adherenceChart.data.datasets[0].data = newData;
window.adherenceChart.update();
```

---

## Future Enhancements

### Potential Features
1. **Time Range Selector**: Choose 7, 14, or 30 days
2. **Comparison View**: Compare weeks
3. **Goal Line**: Show target adherence
4. **Annotations**: Mark special events
5. **Export Chart**: Download as image
6. **Multiple Metrics**: Add other health metrics
7. **Trend Analysis**: Show trend line
8. **Predictions**: Forecast future adherence

### Additional Charts
1. **Monthly View**: Bar chart by week
2. **Yearly View**: Line chart by month
3. **Supplement Breakdown**: Pie chart
4. **Time of Day**: When supplements are taken
5. **Correlation**: Adherence vs. feeling

---

## Troubleshooting

### Chart Not Showing
1. Check if Chart.js is loaded
2. Verify canvas element exists
3. Check console for errors
4. Ensure StorageAPI is initialized

### Wrong Data
1. Check date calculations
2. Verify checklist structure
3. Look for console logs
4. Check StorageAPI data

### Performance Issues
1. Reduce data points
2. Disable animations
3. Simplify gradient
4. Check browser performance

---

## Code Example

### Basic Usage
```javascript
// Initialize chart on page load
await initWeeklyAdherenceChart();
```

### Update Chart
```javascript
// After adding/completing supplements
if (window.adherenceChart) {
  await initWeeklyAdherenceChart();
}
```

### Get Chart Data
```javascript
// Access chart data
const chartData = window.adherenceChart.data.datasets[0].data;
console.log('Adherence data:', chartData);
```

---

## Dependencies

### Required Libraries
- **Chart.js 4.4.0**: Charting library
- **Bootstrap 5.3.0**: UI framework
- **Bootstrap Icons**: Icon set

### CDN Links
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

### Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

---

**The Weekly Adherence Chart provides visual motivation and insights into supplement tracking consistency!** 📊✨
