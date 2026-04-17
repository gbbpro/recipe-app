import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/recipes/new',
  '/recipes/(.*)/edit',
  '/planner(.*)',
  '/admin(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export const proxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth.protect()
    console.log('admin check - userID', userId)
    console.log('admin check - ADMIN_USER_ID:', process.env.ADMIN_USER_ID)
    if (isAdminRoute(req) && userId !== process.env.ADMIN_USER_ID) {
      return Response.redirect(new URL('/', req.url))
    }
  }
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
