/**
 * ========================================
 * Quotes Module for Frank's Cancer Journey
 * Fetches daily inspirational quotes from API
 * ========================================
 * 
 * Features:
 * - Fetches from Quotable API (https://api.quotable.io)
 * - Caches quote per day (no refetching)
 * - Graceful fallback if API fails
 * - Automatic retry with exponential backoff
 * - Console logging for debugging
 * 
 * EXAMPLE USAGE:
 * 
 * // Get today's quote
 * const quote = await QuotesAPI.getDailyQuote();
 * console.log(quote.text, quote.author);
 * 
 * // Display in element
 * QuotesAPI.displayQuoteInElement('dailyQuote');
 */

const QuotesAPI = (function() {
    'use strict';
    
    // Configuration
    const API_URL = 'https://api.quotable.io/random';
    const CACHE_KEY = 'dailyQuote_v2';
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000; // 1 second
    
    // Fallback quotes for when API fails
    const FALLBACK_QUOTES = [
        { 
            text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", 
            author: "Nelson Mandela",
            source: "fallback"
        },
        { 
            text: "It is during our darkest moments that we must focus to see the light.", 
            author: "Aristotle",
            source: "fallback"
        },
        { 
            text: "You will face many defeats in life, but never let yourself be defeated.", 
            author: "Maya Angelou",
            source: "fallback"
        },
        { 
            text: "The only way out is through.", 
            author: "Robert Frost",
            source: "fallback"
        },
        { 
            text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", 
            author: "Ralph Waldo Emerson",
            source: "fallback"
        },
        { 
            text: "Hope is being able to see that there is light despite all of the darkness.", 
            author: "Desmond Tutu",
            source: "fallback"
        },
        { 
            text: "The human spirit is stronger than anything that can happen to it.", 
            author: "C.C. Scott",
            source: "fallback"
        },
        { 
            text: "Every day may not be good, but there is something good in every day.", 
            author: "Alice Morse Earle",
            source: "fallback"
        },
        { 
            text: "You are braver than you believe, stronger than you seem, and smarter than you think.", 
            author: "A.A. Milne",
            source: "fallback"
        },
        { 
            text: "The best way out is always through.", 
            author: "Helen Keller",
            source: "fallback"
        }
    ];
    
    /**
     * Get today's date string (YYYY-MM-DD)
     * @returns {string}
     */
    function getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    }
    
    /**
     * Get a random fallback quote
     * @returns {Object}
     */
    function getRandomFallbackQuote() {
        const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
        return FALLBACK_QUOTES[randomIndex];
    }
    
    /**
     * Fetch quote from API with retry logic
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Object>}
     */
    async function fetchQuoteFromAPI(retryCount = 0) {
        console.log(`📡 Fetching quote from API (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(API_URL, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Quote fetched from API:', data.content.substring(0, 50) + '...');
            
            return {
                text: data.content,
                author: data.author,
                source: 'api',
                tags: data.tags || [],
                length: data.length
            };
        } catch (error) {
            console.warn(`⚠️ API fetch failed (attempt ${retryCount + 1}):`, error.message);
            
            // Retry with exponential backoff
            if (retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAY * Math.pow(2, retryCount);
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchQuoteFromAPI(retryCount + 1);
            }
            
            // All retries failed, use fallback
            console.log('❌ All API attempts failed, using fallback quote');
            return getRandomFallbackQuote();
        }
    }
    
    /**
     * Get cached quote from storage
     * @returns {Object|null}
     */
    function getCachedQuote() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) {
                console.log('ℹ️ No cached quote found');
                return null;
            }
            
            const data = JSON.parse(cached);
            const today = getTodayDateString();
            
            if (data.date === today) {
                console.log('✅ Using cached quote from today:', data.quote.text.substring(0, 50) + '...');
                return data.quote;
            } else {
                console.log('ℹ️ Cached quote is from', data.date, '(today is', today + ')');
                return null;
            }
        } catch (error) {
            console.error('❌ Error reading cached quote:', error);
            return null;
        }
    }
    
    /**
     * Cache quote in storage
     * @param {Object} quote - Quote object to cache
     */
    function cacheQuote(quote) {
        try {
            const data = {
                date: getTodayDateString(),
                quote: quote,
                cachedAt: new Date().toISOString()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            console.log('💾 Quote cached for today');
        } catch (error) {
            console.error('❌ Error caching quote:', error);
        }
    }
    
    /**
     * Get daily quote (cached or fetch new)
     * @returns {Promise<Object>} Quote object with text and author
     */
    async function getDailyQuote() {
        console.log('📜 Getting daily quote...');
        
        // Check cache first
        const cached = getCachedQuote();
        if (cached) {
            return cached;
        }
        
        // Fetch new quote
        console.log('🌐 No valid cache, fetching new quote...');
        const quote = await fetchQuoteFromAPI();
        
        // Cache the new quote
        cacheQuote(quote);
        
        return quote;
    }
    
    /**
     * Display quote in a DOM element
     * @param {string} elementId - ID of element to display quote in
     */
    async function displayQuoteInElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Element #${elementId} not found`);
            return;
        }
        
        // Show loading state
        element.innerHTML = '<p class="text-muted fst-italic">Loading inspiration...</p>';
        
        try {
            const quote = await getDailyQuote();
            
            // Display the quote
            element.innerHTML = `
                <blockquote class="mb-0">
                    <p class="mb-2 fst-italic">"${quote.text}"</p>
                    <footer class="blockquote-footer text-end">
                        ${quote.author}
                        ${quote.source === 'fallback' ? '<small class="text-muted">(offline)</small>' : ''}
                    </footer>
                </blockquote>
            `;
            
            console.log('✅ Quote displayed in element #' + elementId);
        } catch (error) {
            console.error('❌ Error displaying quote:', error);
            
            // Show error state with fallback
            const fallback = getRandomFallbackQuote();
            element.innerHTML = `
                <blockquote class="mb-0">
                    <p class="mb-2 fst-italic">"${fallback.text}"</p>
                    <footer class="blockquote-footer text-end">
                        ${fallback.author}
                    </footer>
                </blockquote>
            `;
        }
    }
    
    /**
     * Force refresh quote (bypass cache)
     * @returns {Promise<Object>}
     */
    async function refreshQuote() {
        console.log('🔄 Force refreshing quote...');
        localStorage.removeItem(CACHE_KEY);
        return getDailyQuote();
    }
    
    /**
     * Get quote statistics
     * @returns {Object}
     */
    function getQuoteStats() {
        const cached = getCachedQuote();
        return {
            hasCachedQuote: !!cached,
            cacheDate: cached ? getTodayDateString() : null,
            source: cached ? cached.source : null,
            fallbackQuotesAvailable: FALLBACK_QUOTES.length
        };
    }
    
    // Public API
    return {
        getDailyQuote,
        displayQuoteInElement,
        refreshQuote,
        getQuoteStats,
        // Expose for testing
        _test: {
            getRandomFallbackQuote,
            getCachedQuote,
            cacheQuote
        }
    };
})();

// Make globally available
window.QuotesAPI = QuotesAPI;

// Auto-display quote on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📜 Quotes module loaded');
    
    // Display quote if element exists
    const quoteElement = document.getElementById('dailyQuote');
    if (quoteElement) {
        QuotesAPI.displayQuoteInElement('dailyQuote');
    }
});
