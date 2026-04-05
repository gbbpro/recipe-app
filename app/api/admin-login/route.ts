import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const password = formData.get('password') as string

  if (password === process.env.ADMIN_PASSWORD) {
    const response = new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=/admin/tags" />
        </head>
        <body>Redirecting...</body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
    response.cookies.set('admin_auth', password, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  }

  // Wrong password — redirect back with error
  const response = new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=/admin/tags" />
      </head>
      <body>Redirecting...</body>
    </html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
  return response
}
