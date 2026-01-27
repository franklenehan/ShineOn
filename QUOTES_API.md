# Quotes API Documentation

## Overview
The Quotes API fetches daily inspirational quotes from the **Quotable API** (https://api.quotable.io) with intelligent caching and graceful fallbacks.

## Features

### ✅ API Integration
- Fetches from Quotable API (free, no API key required)
- 5-second timeout for requests
- Automatic retry with exponential backoff (3 attempts total)
- Graceful degradation to fallback quotes

### ✅ Daily Caching
- Caches one quote per day in localStorage
- Same quote shows throughout the entire day
- No unnecessary API calls
- Cache key: `dailyQuote_v2`

### ✅ Fallback System
- 10 curated inspirational quotes
- Used when API is unavailable
- Randomly selected from fallback pool
- Marked with "(offline)" indicator

### ✅ Console Logging
- Every operation logged for debugging
- Clear emoji indicators for status
- Easy to track API calls and cache hits

## API Reference

### Get Daily Quote
```javascript
// Returns a promise with quote object
const quote = await QuotesAPI.getDailyQuote();
console.log(quote.text);   // "The only way out is through."
console.log(quote.author);  // "Robert Frost"
console.log(quote.source);  // "api" or "fallback"
```

### Display in Element
```javascript
// Automatically displays in element with ID
QuotesAPI.displayQuoteInElement('dailyQuote');
```

### Force Refresh
```javascript
// Bypass cache and get new quote
const newQuote = await QuotesAPI.refreshQuote();
```

### Get Statistics
```javascript
const stats = QuotesAPI.getQuoteStats();
console.log(stats);
// {
//   hasCachedQuote: true,
//   cacheDate: "2025-10-27",
//   source: "api",
//   fallbackQuotesAvailable: 10
// }
```

## Quote Object Structure

### From API
```javascript
{
  text: "The greatest glory in living...",
  author: "Nelson Mandela",
  source: "api",
  tags: ["inspirational", "life"],
  length: 89
}
```

### From Fallback
```javascript
{
  text: "Hope is being able to see...",
  author: "Desmond Tutu",
  source: "fallback"
}
```

## Console Log Examples

### Successful API Fetch
```
📜 Getting daily quote...
ℹ️ No cached quote found
🌐 No valid cache, fetching new quote...
📡 Fetching quote from API (attempt 1/3)...
✅ Quote fetched from API: The greatest glory in living lies not in never...
💾 Quote cached for today
✅ Quote displayed in element #dailyQuote
```

### Using Cached Quote
```
📜 Getting daily quote...
✅ Using cached quote from today: The greatest glory in living lies not in never...
✅ Quote displayed in element #dailyQuote
```

### API Failure with Fallback
```
📜 Getting daily quote...
ℹ️ No cached quote found
🌐 No valid cache, fetching new quote...
📡 Fetching quote from API (attempt 1/3)...
⚠️ API fetch failed (attempt 1): Failed to fetch
⏳ Retrying in 1000ms...
📡 Fetching quote from API (attempt 2/3)...
⚠️ API fetch failed (attempt 2): Failed to fetch
⏳ Retrying in 2000ms...
📡 Fetching quote from API (attempt 3/3)...
⚠️ API fetch failed (attempt 3): Failed to fetch
❌ All API attempts failed, using fallback quote
💾 Quote cached for today
✅ Quote displayed in element #dailyQuote
```

## Caching Behavior

### Cache Structure
```javascript
{
  date: "2025-10-27",
  quote: {
    text: "...",
    author: "...",
    source: "api"
  },
  cachedAt: "2025-10-27T12:34:56.789Z"
}
```

### Cache Logic
1. **First visit of the day**: Fetch from API → Cache → Display
2. **Subsequent visits same day**: Load from cache → Display
3. **Next day**: Cache expired → Fetch new quote → Cache → Display

### Cache Invalidation
- Automatic: Midnight (new day)
- Manual: `QuotesAPI.refreshQuote()`
- Clear: `localStorage.removeItem('dailyQuote_v2')`

## Retry Logic

### Exponential Backoff
- **Attempt 1**: Immediate
- **Attempt 2**: Wait 1 second (1000ms)
- **Attempt 3**: Wait 2 seconds (2000ms)
- **After 3 failures**: Use fallback

### Timeout
- Each API request has a 5-second timeout
- Prevents hanging on slow connections

## Fallback Quotes

10 curated inspirational quotes from notable figures:
1. Nelson Mandela
2. Aristotle
3. Maya Angelou
4. Robert Frost
5. Ralph Waldo Emerson
6. Desmond Tutu
7. C.C. Scott
8. Alice Morse Earle
9. A.A. Milne
10. Helen Keller

## HTML Integration

### Automatic Display
The module automatically displays quotes on page load if element exists:

```html
<div id="dailyQuote"></div>
```

### Manual Display
```html
<div id="myQuote"></div>

<script>
  QuotesAPI.displayQuoteInElement('myQuote');
</script>
```

## Error Handling

All errors are caught and logged:
- Network failures → Retry → Fallback
- Timeout → Retry → Fallback
- Parse errors → Fallback
- Cache errors → Logged, continue with API

## Browser Compatibility

- **Modern browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Fetch API**: Required (all modern browsers)
- **LocalStorage**: Required (universal support)
- **Async/Await**: Required (ES2017+)

## Testing

### Test Cache
```javascript
// Check if quote is cached
const stats = QuotesAPI.getQuoteStats();
console.log('Has cache:', stats.hasCachedQuote);

// View cached quote
const cached = QuotesAPI._test.getCachedQuote();
console.log(cached);
```

### Test Fallback
```javascript
// Get a random fallback quote
const fallback = QuotesAPI._test.getRandomFallbackQuote();
console.log(fallback);
```

### Force New Quote
```javascript
// Clear cache and get new quote
const newQuote = await QuotesAPI.refreshQuote();
console.log(newQuote);
```

## Performance

- **First load**: ~100-500ms (API call)
- **Cached load**: <1ms (localStorage read)
- **Fallback**: <1ms (array lookup)
- **Storage size**: ~200 bytes per cached quote

## Privacy

- No tracking or analytics
- No API keys required
- No personal data sent
- All data stored locally

## API Source

**Quotable API**
- URL: https://api.quotable.io
- Free to use
- No authentication required
- Rate limit: Generous (suitable for daily quotes)
- Documentation: https://github.com/lukePeavey/quotable

## Troubleshooting

### Quote not displaying
1. Check console for errors
2. Verify element ID exists
3. Check network tab for API calls
4. Try manual refresh: `QuotesAPI.refreshQuote()`

### Always showing fallback
1. Check internet connection
2. Verify API is accessible: https://api.quotable.io/random
3. Check browser console for errors
4. Clear cache and retry

### Same quote every day
This is intentional! The quote is cached per day. To get a new quote:
```javascript
await QuotesAPI.refreshQuote();
```

---

**The Quotes API provides reliable, inspiring content with zero configuration required!** 🎉
