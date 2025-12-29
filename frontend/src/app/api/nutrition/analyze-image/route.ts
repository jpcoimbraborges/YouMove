import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        // The image comes as a base64 Data URL, we need to pass it to OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this food image. Identify the main dish and estimated calories, protein, carbs, and fats. Return ONLY a JSON object with this structure: { foods: [{ name: string, calories: number, protein: number, carbs: number, fats: number }] }. Keep names in Portuguese." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": image,
                            },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
            max_tokens: 500,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        const data = JSON.parse(content);
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error analyzing image:', error);
        return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
    }
}
