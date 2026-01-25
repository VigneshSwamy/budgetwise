# UI Preview Guide - Viewing Your App in Browser

## Quick Start

1. **Development server is running** at: **http://localhost:3000**

2. **Open in Browser:**
   - Press `Cmd + Click` (Mac) or `Ctrl + Click` (Windows/Linux) on the link above
   - Or manually open: http://localhost:3000 in your browser
   - Or use Cursor's terminal link (if clickable)

## Viewing Options in Cursor

### Option 1: External Browser (Recommended)
1. Open your system browser (Chrome, Firefox, Safari, etc.)
2. Navigate to: **http://localhost:3000**
3. The page will auto-reload when you make changes (Hot Module Replacement)

### Option 2: Cursor Built-in Preview (if available)
- Some Cursor versions have a preview panel
- Check the bottom panel or sidebar for "Preview" or "Browser" options
- Look for a globe/earth icon in the UI

### Option 3: VS Code/Cursor Simple Browser
1. In Cursor, press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Simple Browser" or "Open Preview"
3. Enter: `http://localhost:3000`

## Development Server Commands

### Start Server
```bash
npm run dev
```

### Stop Server
Press `Ctrl+C` in the terminal where it's running

### Check Server Status
The server should show:
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

## Hot Reload

The Next.js dev server has **Hot Module Replacement (HMR)** enabled:
- ✅ Changes to React components auto-reload in browser
- ✅ CSS changes apply instantly
- ✅ TypeScript errors show in browser
- ✅ No need to manually refresh

## Current Status

- **Server URL:** http://localhost:3000
- **Status:** Should be running (check terminal)
- **Current Page:** Home page placeholder with "BudgetWise" heading

## Tips

1. **Keep the dev server running** while developing
2. **Browser DevTools:** Open DevTools (F12) to see console logs and errors
3. **Network Tab:** Check API calls to Supabase in Network tab
4. **React DevTools:** Install React DevTools browser extension for component debugging

## Troubleshooting

### Server Not Starting?
```bash
# Check if port 3000 is already in use
lsof -ti:3000

# Kill process on port 3000 (if needed)
kill -9 $(lsof -ti:3000)

# Restart server
npm run dev
```

### Can't Access localhost:3000?
- Ensure the dev server is actually running
- Check terminal for errors
- Try `http://127.0.0.1:3000` instead

### Page Not Loading?
- Check terminal for compilation errors
- Verify `.env.local` is set up (if using Supabase features)
- Check browser console for JavaScript errors
