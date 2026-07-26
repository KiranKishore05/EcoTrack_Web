import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const { image } = body; // Expecting a base64 string: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."

    if (!image) {
      return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
    }

    // Extract base64 content and mime type
    const mimeTypeMatch = image.match(/^data:(image\/[a-zA-Z]+);base64,/);
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (mimeTypeMatch) {
      mimeType = mimeTypeMatch[1];
      base64Data = image.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this image (which could be an electricity bill, fuel receipt, or grocery receipt).
Extract the relevant data for calculating a carbon footprint.
Return a JSON object ONLY, with NO markdown formatting, with the following structure:
{
  "title": "A short title for the activity (e.g., 'Electricity Bill July', 'Gas Station')",
  "category": "One of: energy, transport, food, shopping",
  "type": "Specific type, e.g., electricity, car, vegetarian, non_vegetarian",
  "value": number (the quantity consumed, e.g. kWh for electricity, Liters/Gallons for fuel, or currency amount if quantity is missing),
  "unit": "string (e.g., 'kWh', 'Liters', 'USD')",
  "estimated_co2_kg": number (an estimated CO2 footprint in kg based on standard conversion factors)
}`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    // Clean up potential markdown JSON wrapping
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const data = JSON.parse(cleanJson);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in AI Scanner API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}
