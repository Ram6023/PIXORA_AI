import { NextRequest, NextResponse } from "next/server";

// Edge runtime to handle long requests
export const runtime = "edge";

const MODEL_MAPPING: Record<string, string> = {
    "flux-schnell": "flux",
    "flux-dev": "flux-realism",
    "sdxl": "flux",
    "sdxl-lightning": "turbo",
    "dreamshaper": "dreamshaper",
    "lucid-origin": "flux-anime",
    "phoenix": "flux-pro",
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let prompt = searchParams.get("prompt");

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        prompt = prompt.trim().replace(/\n/g, " ");

        const modelKey = searchParams.get("model") || "flux-schnell";
        const width = searchParams.get("width") || "1024";
        const height = searchParams.get("height") || "1024";
        const seed = searchParams.get("seed") || Math.floor(Math.random() * 999999).toString();
        const model = MODEL_MAPPING[modelKey] || "flux";

        // Use the absolute simplest URL format for maximum compatibility
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true&private=true&enhance=false`;

        const apiKey = process.env.POLLINATIONS_API_KEY;
        const headers: Record<string, string> = {};

        if (apiKey) {
            // Ensure no whitespace in the key
            headers["Authorization"] = `Bearer ${apiKey.trim()}`;
        }

        console.log(`Fetching: ${pollUrl}`);

        // Set a shorter timeout for the initial model to trigger fallback faster
        const response = await fetch(pollUrl, {
            headers,
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            console.warn(`Upstream failed: ${response.status}. Trying fallback...`);

            // IMMEDIATE FALLBACK to the base 'flux' model which is the most reliable
            if (model !== "flux") {
                const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;
                const fallbackResponse = await fetch(fallbackUrl, { headers });

                if (fallbackResponse.ok) {
                    return new NextResponse(fallbackResponse.body, {
                        headers: {
                            "Content-Type": "image/png",
                            "Cache-Control": "no-store, must-revalidate",
                        },
                    });
                }
            }

            // LAST RESORT: Try with NO API KEY in case the key is invalid/rate-limited
            const freeUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
            const freeResponse = await fetch(freeUrl);
            if (freeResponse.ok) {
                return new NextResponse(freeResponse.body, {
                    headers: {
                        "Content-Type": "image/png",
                        "Cache-Control": "no-store, must-revalidate",
                    },
                });
            }

            return NextResponse.json({ error: "Service busy. Try again in 5s." }, { status: 503 });
        }

        return new NextResponse(response.body, {
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "no-store, must-revalidate",
            },
        });

    } catch (err: any) {
        console.error("Critical API Error:", err);
        return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }
}
