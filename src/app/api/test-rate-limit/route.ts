import { NextResponse } from "next/server";

export const GET = async () => {
  const requestId = `test_rate_limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [API_TEST_RATE_LIMIT] ${requestId} - Test rate limit request started`);
  
  try {
    console.log(`✅ [API_TEST_RATE_LIMIT] ${requestId} - Rate limit passed, returning success`);
    return NextResponse.json(
      { 
        message: "Rate limit test successful",
        timestamp: new Date().toISOString(),
        requestId 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error(`❌ [API_TEST_RATE_LIMIT] ${requestId} - Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};