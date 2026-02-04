import { NextRequest, NextResponse } from "next/server";

const MODEL_MAPPING: Record<string, string> = {
    "flux-schnell": "flux",
    "flux-dev": "flux-realism",
    "sdxl": "any-dark", // Good SDXL variant on Pollinations
    "sdxl-lightning": "turbo",
    "dreamshaper": "dreamshaper",
    "lucid-origin": "flux-anime", // Artistic/Anime variant
    "phoenix": "flux-pro",
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt");
    const modelKey = searchParams.get("model") || "flux-schnell";
    const width = searchParams.get("width") || "1024";
    const height = searchParams.get("height") || "1024";
    const seed = searchParams.get("seed") || Math.floor(Math.random() * 1000000).toString();

    if (!prompt) {
        return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    try {
        const model = MODEL_MAPPING[modelKey] || "flux";

        // Pollinations AI URL structure: https://pollinations.ai/p/[prompt]?width=[w]&height=[h]&seed=[s]&model=[m]
        const pollUrl = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
        pollUrl.searchParams.set("width", width);
        pollUrl.searchParams.set("height", height);
        pollUrl.searchParams.set("seed", seed);
        pollUrl.searchParams.set("model", model);
        pollUrl.searchParams.set("nologo", "true"); // Remove watermark if possible

        const response = await fetch(pollUrl.toString());

        if (!response.ok) {
            throw new Error(`Pollinations API responded with ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });

    } catch (err: any) {
        console.error("Pollinations Generation Error:", err);
        return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }
}
