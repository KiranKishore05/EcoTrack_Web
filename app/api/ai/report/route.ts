import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateWeeklyReport } from '@/lib/ai-engine';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { activities, goals, budget, sustainabilityIndex, streak, period } = body;

    // Fallback to rule-based engine if Gemini is not configured
    if (!process.env.GEMINI_API_KEY) {
      const report = generateWeeklyReport({ activities, goals, budget, sustainabilityIndex, streak });
      // Adjust the static summary string to match the requested period
      report.summary = report.summary.replace('This week', `This ${period}`);
      return NextResponse.json(report);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an AI Sustainability Analyst for EcoTrack.
Generate a concise, professional summary for a user's ${period} sustainability report.
Here is the user's data for the period:
- Activities logged: ${activities.length}
- Total CO2 footprint: ${activities.reduce((s: any, a: any) => s + a.co2_kg, 0)} kg
- Sustainability Index: ${sustainabilityIndex}/100
- Active goals: ${goals.length}
- Current tracking streak: ${streak} days
- Carbon budget: ${budget} kg

Write a 2-3 sentence summary highlighting their biggest emission source (if available in activities), their progress, and one key area for improvement. Keep it encouraging but data-driven.

Return ONLY a JSON object with this structure (no markdown formatting):
{
  "summary": "Your generated summary text here",
  "recommendations": [
    { "title": "Short title", "description": "Recommendation text" }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiData = JSON.parse(cleanJson);
    
    // Combine AI summary with the rule-based metrics for the final report
    const baseReport = generateWeeklyReport({ activities, goals, budget, sustainabilityIndex, streak });

    return NextResponse.json({
      ...baseReport,
      summary: aiData.summary,
      // Merge AI recommendations with rule-based weekly goals
      recommendations: aiData.recommendations.slice(0, 3)
    });
  } catch (error: any) {
    console.error('Error in AI Report API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI report' },
      { status: 500 }
    );
  }
}
