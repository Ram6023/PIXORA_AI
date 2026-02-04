import { NextRequest, NextResponse } from "next/server";

// Edge runtime to avoid timeouts
export const runtime = "edge";

const MODEL_MAPPING: Record<string, string> = {
    "flux-schnell": "flux",
    "flux-dev": "flux-realism",
    "sdxl": "any-dark",
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

        // Clean the prompt
        prompt = prompt.trim().replace(/\n/g, " ");

        const modelKey = searchParams.get("model") || "flux-schnell";
        const width = searchParams.get("width") || "1024";
        const height = searchParams.get("height") || "1024";
        const seed = searchParams.get("seed") || Math.floor(Math.random() * 1000000).toString();
        const model = MODEL_MAPPING[modelKey] || "flux";

        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true&private=true&enhance=false`;

        const apiKey = process.env.POLLINATIONS_API_KEY;
        const headers: Record<string, string> = {
            "Accept": "image/webp,image/apng,image/*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        };

        if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const response = await fetch(pollUrl, { headers });

        if (!response.ok) {
            // Log error but try fallback if not already using default flux
            console.error(`Pollinations API error: ${response.status}`);

            if (model !== "flux") {
                const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;
                const fallbackResponse = await fetch(fallbackUrl, { headers });
                if (fallbackResponse.ok) {
                    return new NextResponse(fallbackResponse.body, {
                        headers: {
                            "Content-Type": "image/png",
                            "Cache-Control": "public, max-age=31536000, immutable",
                        },
                    });
                }
            }
            return NextResponse.json({ error: "The AI model is currently busy. Please try again soon." }, { status: 503 });
        }

        return new NextResponse(response.body, {
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });

    } catch (err: any) {
        console.error("API Route Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
