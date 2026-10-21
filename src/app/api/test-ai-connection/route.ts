import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint to verify AI server connection
 * GET /api/test-ai-connection
 */
export async function GET(request: NextRequest) {
  const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://127.0.0.1:8000";
  
  const tests = [
    {
      name: "Root endpoint",
      url: AI_SERVER_URL,
    },
    {
      name: "Health check",
      url: `${AI_SERVER_URL}/health/`,
    },
    {
      name: "Profile analysis endpoint",
      url: `${AI_SERVER_URL}/hoexapp/api/profile-analysis/`,
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(test.url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const status = response.status;
      let body = null;
      
      try {
        body = await response.text();
      } catch (e) {
        body = "Could not read response body";
      }
      
      results.push({
        test: test.name,
        url: test.url,
        success: true,
        status,
        body: body.substring(0, 500),
      });
    } catch (error) {
      console.error(`❌ Test failed:`, error);
      
      results.push({
        test: test.name,
        url: test.url,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : "Unknown",
      });
    }
  }

  return NextResponse.json({
    success: true,
    aiServerUrl: AI_SERVER_URL,
    results,
    summary: {
      total: tests.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
  });
}
