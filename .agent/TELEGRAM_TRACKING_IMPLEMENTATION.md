# Telegram Page-View Tracking Implementation

## Overview
Successfully implemented a page-view tracker that sends Telegram notifications whenever a user lands on the `/vault-deposit` page.

---

## 1. API Route Implementation

### File: `src/app/api/track-visit/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";

/**
 * Track Visit API Route
 * 
 * Sends a Telegram notification whenever a user lands on the /vault-deposit page.
 * 
 * Environment Variables Required:
 * - TELEGRAM_BOT_TOKEN: Your Telegram bot token from @BotFather
 * - TELEGRAM_USER_ID: Your Telegram user/chat ID to receive notifications
 */

export async function POST(request: NextRequest) {
    try {
        // 1. Load environment variables
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const userId = process.env.TELEGRAM_USER_ID;

        // 2. Validate environment variables
        if (!botToken || !userId) {
            console.error("[track-visit] Missing Telegram credentials in environment variables");
            // Return success to avoid breaking page load
            return NextResponse.json({ 
                success: false, 
                error: "Missing configuration" 
            }, { status: 200 });
        }

        // 3. Extract IP address from request headers
        // Check multiple headers for IP (Vercel-friendly)
        const ip = 
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            request.headers.get("cf-connecting-ip") || // Cloudflare
            "Unknown";

        // 4. Generate timestamp
        const timestamp = new Date().toISOString();
        const readableTime = new Date().toLocaleString("en-US", {
            timeZone: "UTC",
            dateStyle: "medium",
            timeStyle: "medium"
        });

        // 5. Construct Telegram message
        const message = `🔔 Vault Deposit Page Hit\nIP: ${ip}\nTime: ${readableTime} UTC\nTimestamp: ${timestamp}`;

        // 6. Send Telegram notification
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        const telegramResponse = await fetch(telegramUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: userId,
                text: message,
                parse_mode: "HTML",
            }),
        });

        // 7. Check Telegram API response
        if (!telegramResponse.ok) {
            const errorData = await telegramResponse.json();
            console.error("[track-visit] Telegram API error:", errorData);
            
            // Still return success to avoid breaking page load
            return NextResponse.json({ 
                success: false, 
                error: "Notification failed" 
            }, { status: 200 });
        }

        const result = await telegramResponse.json();
        console.log("[track-visit] Notification sent successfully:", { ip, timestamp });

        // 8. Return success response
        return NextResponse.json({ 
            success: true,
            message: "Visit tracked successfully"
        });

    } catch (error: any) {
        // Log error but don't break the page
        console.error("[track-visit] Error processing visit tracking:", error.message || error);
        
        // Return success status to avoid breaking page load
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Internal error" 
        }, { status: 200 });
    }
}

// Handle unsupported methods
export async function GET() {
    return NextResponse.json({ 
        error: "Method not allowed. Use POST." 
    }, { status: 405 });
}
```

### Key Features:
- ✅ Loads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_USER_ID` from `process.env`
- ✅ Accepts POST requests only
- ✅ Sends formatted Telegram message with IP and timestamp
- ✅ Detects IP from multiple headers (Vercel, Cloudflare compatible)
- ✅ Returns `{ success: true }` on success
- ✅ Graceful error handling - never breaks page load
- ✅ Server-side logging for debugging

---

## 2. Page Integration

### File: `src/app/vault-deposit/page.tsx`

Added the following code after line 52 (inside the component):

```typescript
// -- 1. Track Page Visit (Telegram Notification) --
useEffect(() => {
    // Fire background tracking request on page load
    const trackVisit = async () => {
        try {
            await fetch('/api/track-visit', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            // Silent - no UI feedback needed
        } catch (error) {
            // Silent failure - don't break page load
            console.error('[track-visit] Failed to track visit:', error);
        }
    };

    trackVisit();
}, []); // Run once on mount
```

### Key Features:
- ✅ Fires on page load (component mount)
- ✅ Background execution - no UI changes
- ✅ Silent failure - never breaks the page
- ✅ Runs only once per page visit

---

## 3. Environment Variables Required

Add these to your `.env` or `.env.local` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_USER_ID=your_user_id_here
```

### How to Get These Values:

#### 1. **TELEGRAM_BOT_TOKEN**
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` and follow the prompts
   - Copy the bot token provided (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### 2. **TELEGRAM_USER_ID**
   - Search for `@userinfobot` on Telegram
   - Start a chat and it will send you your user ID (format: `123456789`)
   - Alternatively, use your chat ID if sending to a group/channel

### Vercel Deployment:
For production on Vercel, add these environment variables in:
- **Vercel Dashboard** → Your Project → Settings → Environment Variables
- Add both `TELEGRAM_BOT_TOKEN` and `TELEGRAM_USER_ID`
- Redeploy after adding

---

## 4. Testing

### Local Development:
1. Add environment variables to `.env.local`
2. Run `npm run dev`
3. Visit `http://localhost:3000/vault-deposit`
4. Check your Telegram for the notification

### Production (Vercel):
1. Add environment variables in Vercel dashboard
2. Deploy/redeploy the application
3. Visit your production URL `/vault-deposit`
4. Check Telegram for notification

---

## 5. Notification Format

When a user visits the page, you'll receive a Telegram message like:

```
🔔 Vault Deposit Page Hit
IP: 203.0.113.45
Time: Dec 10, 2025, 1:55:43 PM UTC
Timestamp: 2025-12-10T13:55:43.123Z
```

---

## 6. Error Handling

The implementation is designed to **never break the page load**:

- ❌ Missing environment variables → Logs error, returns success
- ❌ Telegram API failure → Logs error, returns success
- ❌ Network error → Logs error, page continues loading
- ✅ All errors are logged server-side for debugging

---

## 7. Security Considerations

- ✅ Environment variables are server-side only (not exposed to client)
- ✅ API route is server-rendered (Next.js App Router)
- ✅ No sensitive data in client-side code
- ✅ IP detection works with proxies/CDNs (Vercel, Cloudflare)

---

## 8. Files Modified

1. **Created**: `src/app/api/track-visit/route.ts` (new file)
2. **Modified**: `src/app/vault-deposit/page.tsx` (added tracking useEffect)

No other files were touched as requested.

---

## Summary

✅ Secure server route created at `/api/track-visit`  
✅ Telegram integration with proper error handling  
✅ Page tracking added to `/vault-deposit`  
✅ Works in both dev and production (Vercel-friendly)  
✅ Silent background execution - no UI impact  
✅ Comprehensive error logging  
✅ Ready to deploy!

Just add your Telegram credentials to the environment variables and you're all set! 🚀
