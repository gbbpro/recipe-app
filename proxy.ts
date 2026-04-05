import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin')) {
    const auth = req.cookies.get('admin_auth')?.value
    if (auth === process.env.ADMIN_PASSWORD) return NextResponse.next()

    // Check if submitting the password form
    if (req.method === 'POST') return NextResponse.next()

    // Show login page
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Admin Login</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #faf9f7; }
            .box { background: white; padding: 40px; border-radius: 8px; border: 1px solid #e8e4de; width: 320px; }
            h2 { margin: 0 0 24px; font-size: 1.25rem; color: #1a1814; }
            input { width: 100%; padding: 9px 12px; border: 1.5px solid #e8e4de; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box; margin-bottom: 12px; }
            button { width: 100%; padding: 10px; background: #c4622d; color: white; border: none; border-radius: 4px; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
            .error { color: #c0392b; font-size: 0.8rem; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>🔒 Admin Access</h2>
            <form method="POST" action="/api/admin-login">
              <input type="password" name="password" placeholder="Password" autofocus />
              <button type="submit">Enter</button>
            </form>
          </div>
        </body>
      </html>`,
      { status: 401, headers: { 'Content-Type': 'text/html' } }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
