// TODO: Implement the code here to add rate limiting with Redis
// Refer to the Next.js Docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
// Refer to Redis docs on Rate Limiting: https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {Redis} from "@upstash/redis"
import {Ratelimit} from "@upstash/ratelimit"

const redis = new Redis({
  url:process.env.UPSTASH_REDIS_REST_URL,
  token:process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis:redis,
  limiter:Ratelimit.slidingWindow(6, "60 s"),
  analytics : true,
})
export async function middleware(request: NextRequest) {
  try {
     
    const ip = request.headers.get("x-forwarded-for") ?? '127.0.0.1'
      // Check the rate limit for the IP
      const { success, limit, remaining, reset } = await ratelimit.limit(ip);
     
    
      if (!success) {
        // If rate limit exceeded, return 429 Too Many Requests
        return NextResponse.json(
          { error: "Too Many Requests" },
          { status: 429 }
        );
      }
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());
    return response;



  } catch (error) {
    console.error("Rate limiting middleware error:", error);

    // Return a generic error response if something goes wrong
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );

  }
}


// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
