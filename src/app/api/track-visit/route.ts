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
