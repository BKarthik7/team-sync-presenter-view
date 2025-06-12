import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'success',
      message: 'API is running',
      timestamp: new Date().toISOString()
    }, {
      status: 200
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, {
      status: 500
    });
  }
}
