import { NextRequest, NextResponse } from "next/server";

// Using edge runtime to bypass the 10s execution limit on Vercel Hobby plan
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
        const urlRequest = new URL(request.url);
        const prompt = urlRequest.searchParams.get("prompt");

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const modelKey = urlRequest.searchParams.get("model") || "flux-schnell";
        const width = urlRequest.searchParams.get("width") || "1024";
        const height = urlRequest.searchParams.get("height") || "1024";
        const seed = urlRequest.searchParams.get("seed") || Math.floor(Math.random() * 1000000).toString();
        const model = MODEL_MAPPING[modelKey] || "flux";

        // Construct the Pollinations URL with all supported parameters
        const pollUrl = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
        pollUrl.searchParams.set("width", width);
        pollUrl.searchParams.set("height", height);
        pollUrl.searchParams.set("seed", seed);
        pollUrl.searchParams.set("model", model);
        pollUrl.searchParams.set("nologo", "true");
        pollUrl.searchParams.set("enhance", "false"); // Speed up by disabling auto-enhance

        // Use a longer timeout for the fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const response = await fetch(pollUrl.toString(), {
            signal: controller.signal,
            headers: {
                "Accept": "image/*",
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`Pollinations API error: ${response.status}`);
            return NextResponse.json({ error: "Image generation service is busy. Please try again." }, { status: 503 });
        }

        const contentType = response.headers.get("Content-Type") || "image/png";
        const body = response.body;

        if (!body) {
            throw new Error("Empty response from image service");
        }

        return new NextResponse(body, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });

    } catch (err: any) {
        if (err.name === 'AbortError') {
            return NextResponse.json({ error: "Request timed out. The model is taking too long." }, { status: 504 });
        }
        console.error("API Route Error:", err);
        return NextResponse.json({ error: "Something went wrong. Please try smaller dimensions or a different model." }, { status: 500 });
    }
}
