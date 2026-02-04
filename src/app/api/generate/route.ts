import { NextRequest, NextResponse } from "next/server";

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
        const prompt = searchParams.get("prompt");
        const modelKey = searchParams.get("model") || "flux-schnell";
        const width = searchParams.get("width") || "1024";
        const height = searchParams.get("height") || "1024";
        const seed = searchParams.get("seed") || Math.floor(Math.random() * 1000000).toString();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const model = MODEL_MAPPING[modelKey] || "flux";

        // Construct the Pollinations URL
        const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;

        const response = await fetch(pollUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Pollinations Error:", errorText);
            return NextResponse.json({ error: "Upstream API error" }, { status: response.status });
        }

        // Return the image data directly as a stream (better for Vercel/Next.js)
        return new NextResponse(response.body, {
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });

    } catch (err: any) {
        console.error("API Route Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
