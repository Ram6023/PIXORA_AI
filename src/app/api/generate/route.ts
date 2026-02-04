import { NextRequest, NextResponse } from "next/server";
import Bytez from "bytez.js";

const MODEL_MAPPING: Record<string, string> = {
    "flux-schnell": "black-forest-labs/FLUX.1-schnell",
    "flux-dev": "black-forest-labs/FLUX.1-dev",
    "sdxl": "stabilityai/stable-diffusion-xl-base-1.0",
    "sdxl-lightning": "Bytez/sdxl-lightning",
    "dreamshaper": "Lykon/DreamShaper",
    "lucid-origin": "lucidways/lucid-origin", // Generic mapping if available
    "phoenix": "Bytez/phoenix",
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt");
    const modelKey = searchParams.get("model") || "flux-schnell";

    if (!prompt) {
        return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.BYTEZ_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    try {
        const sdk = new Bytez(apiKey);
        const modelPath = MODEL_MAPPING[modelKey] || MODEL_MAPPING["flux-schnell"];
        const model = sdk.model(modelPath);

        // Run the model
        const { error, output } = await model.run(prompt);

        if (error) {
            console.error("Bytez API Error:", error);
            return NextResponse.json({ error: typeof error === 'string' ? error : (error as any).message || "Failed to generate image" }, { status: 500 });
        }

        // Usually output is an array of buffers or a single buffer/string
        // We expect an image response. We'll return it as a blob.
        let imageData = output;

        // If output is an array, take the first element
        if (Array.isArray(output)) {
            imageData = output[0];
        }

        // Handle different output formats (Buffer, Base64, etc.)
        if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
            const base64Data = imageData.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'image/png',
                }
            });
        }

        // If it's already a buffer or uint8array
        return new NextResponse(imageData, {
            headers: {
                'Content-Type': 'image/png', // Adjust based on model output if known
            },
        });

    } catch (err: any) {
        console.error("Internal Server Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
