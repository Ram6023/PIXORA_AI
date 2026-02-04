import { NextRequest, NextResponse } from "next/server";

// Edge runtime is essential for long-running image generation
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

        // Clean the prompt
        prompt = prompt.trim().replace(/\n/g, " ");

        const modelKey = searchParams.get("model") || "flux-schnell";
        const width = searchParams.get("width") || "1024";
        const height = searchParams.get("height") || "1024";
        // Use a random seed if none provided to ensure we don't hit "busy" cached workers
        const seed = searchParams.get("seed") || Math.floor(Math.random() * 999999).toString();
        const model = MODEL_MAPPING[modelKey] || "flux";

        // Build URL
        const pollUrl = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
        pollUrl.searchParams.set("width", width);
        pollUrl.searchParams.set("height", height);
        pollUrl.searchParams.set("seed", seed);
        pollUrl.searchParams.set("model", model);
        pollUrl.searchParams.set("nologo", "true");
        pollUrl.searchParams.set("enhance", "false");

        const apiKey = process.env.POLLINATIONS_API_KEY;
        const headers: Record<string, string> = {
            "Accept": "image/*",
        };

        if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey.trim()}`;
        }

        console.log(`Generating: ${model} | Seed: ${seed}`);

        const response = await fetch(pollUrl.toString(), {
            headers,
            next: { revalidate: 0 } // Disable Next.js caching for this request
        });

        if (!response.ok) {
            // Fallback to the most stable model if the current one is busy
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

            return NextResponse.json(
                { error: "Model busy or API key pending. Try again in 5 seconds." },
                { status: 503 }
            );
        }

        return new NextResponse(response.body, {
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "no-store, must-revalidate",
            },
        });

    } catch (err: any) {
        console.error("API Route Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
