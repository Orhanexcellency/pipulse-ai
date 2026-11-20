import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { message, systemPrompt } = await req.json();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `${systemPrompt}\n\nKullanici Sorusu: ${message}`;
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
