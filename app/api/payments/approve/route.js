import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  try {
    const { paymentId } = await req.json();
    const response = await axios.post(
      `https://minepi.com{paymentId}/approve`,
      {},
      {
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`,
        },
      }
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
