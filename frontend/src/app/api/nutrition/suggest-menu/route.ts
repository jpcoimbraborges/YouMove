import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { goalType, duration, userProfile } = await req.json(); // duration: 'today', 'tomorrow', 'weekly'

        const goalPrompts: Record<string, string> = {
            cutting: "weight loss (cutting), high protein, caloric deficit.",
            bulking: "muscle gain (bulking), high surplus, high protein/carbs.",
            balanced: "maintenance and health, balanced macronutrients."
        };

        const goalText = goalPrompts[goalType] || goalPrompts.balanced;

        let profileContext = "";
        if (userProfile) {
            const { height, weight, age, gender, activity_level } = userProfile;
            profileContext = `User Profile:
            - Height: ${height || 'N/A'} cm
            - Weight: ${weight || 'N/A'} kg
            - Age: ${age || 'N/A'} years
            - Gender: ${gender || 'N/A'}
            - Activity Level: ${activity_level || 'N/A'}
            
            Calculate TDEE and adjust calories/macros precisely for this user's profile and goal (${goalType}).`;
        } else {
            profileContext = "No specific user profile provided. Use standard averages for an adult.";
        }

        let durationPrompt = "";
        if (duration === 'weekly') {
            durationPrompt = `Create a 7-day Weekly meal plan. Include a consolidated Shopping List at the end.`;
        } else if (duration === 'tomorrow') {
            durationPrompt = `Create a 1-day meal plan for Tomorrow. Include a Shopping List.`;
        } else {
            durationPrompt = `Create a 1-day meal plan for Today.`;
        }

        const userPrompt = `${durationPrompt} Goal: ${goalText}\n\n${profileContext}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert nutritionist AI. Generate a meal plan in valid JSON format.
                    
                    Structure for response:
                    {
                        "title": string (e.g. "Plano Personalizado de Hipertrofia"),
                        "tdee_info": string (Brief explanation of calculated calories based on profile),
                        "shoppingList": string[] (Consolidated list of ingredients to buy, in Portuguese),
                        "days": [
                            {
                                "day": string (e.g. "Segunda-feira" or "Hoje"),
                                "meals": [
                                    { 
                                        "name": string (e.g. "Café da Manhã"),
                                        "items": string[], 
                                        "calories": number, 
                                        "protein": number, 
                                        "carbs": number, 
                                        "fats": number 
                                    }
                                ]
                            }
                        ]
                    }

                    Rules:
                    1. Output strict JSON.
                    2. Language: Portuguese (Brazil).
                    3. For 'weekly' duration, generate 7 distinct days (Segunda to Domingo).
                    4. For 'today' or 'tomorrow', generate 1 day array.
                    5. Include precise macro estimates suited for the user's metrics (calculate BMR/TDEE internally).
                    6. Be creative and varied with meals.
                    `
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 4000,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        const data = JSON.parse(content);
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error suggesting menu:', error);
        return NextResponse.json({ error: 'Failed to generate menu' }, { status: 500 });
    }
}
