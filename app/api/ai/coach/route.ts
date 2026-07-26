import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in the environment.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, activities, goals, budget } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are the EcoTrack AI Sustainability Coach. You give concise, encouraging, and actionable advice to help users reduce their carbon footprint.
Here is the user's current context:
- Monthly Carbon Budget: ${budget || 'Not set'} kg CO2
- Recent Activities Logged: ${JSON.stringify(activities || [])}
- Active Goals: ${JSON.stringify(goals || [])}

Please answer the user's question directly and concisely based on their context. Keep responses under 150 words.`;

    const chatSession = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am ready to help the user.' }],
        }
      ],
    });

    const result = await chatSession.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ text: response });
  } catch (error: any) {
    console.error('Error in AI Coach API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to communicate with AI' },
      { status: 500 }
    );
  }
}
