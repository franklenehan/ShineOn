#!/bin/bash
# Simple script to start a local web server for Frank's Cancer Journey

echo "Starting local web server for Frank's Cancer Journey..."
echo "The application will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
# Check if Python 2 is available
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
# Check if Node.js is available
elif command -v npx &> /dev/null; then
    npx http-server -p 8000
else
    echo "Error: No suitable web server found."
    echo "Please install Python or Node.js to run a local server."
    echo ""
    echo "Alternatively, you can open index.html directly in your browser."
    echo "The app will still work with the fallback navigation."
    exit 1
fi
