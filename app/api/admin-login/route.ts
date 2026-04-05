import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const password = formData.get('password') as string

  if (password === process.env.ADMIN_PASSWORD) {
    const response = NextResponse.redirect(new URL('/admin/tags', req.url))
    response.cookies.set('admin_auth', password, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return response
  }

  return NextResponse.redirect(new URL('/admin/tags', req.url))
}
