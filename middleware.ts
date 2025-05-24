// Import required functions and modules
import { clerkMiddleware, createRouteMatcher, auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define which routes are public (don't require authentication)
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"])

// Define the middleware function
export default clerkMiddleware(async (auth, request) => {
  const user = auth() // Get the auth object
  const userId = (await user).userId // Get user ID if user is signed in
  const url = new URL(request.url) // Parse the request URL

  // If user is signed in and tries to access a public route - signin/signup (other than "/"), redirect to /dashboard
  if (userId && isPublicRoute(request) && url.pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If the route is not public, protect it (require authentication)
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    // Always run on API and trpc routes
    '/(api|trpc)(.*)',
  ],
}
