&'use client'

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

export default function UserNav() {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) return null

  if (isSignedIn) {
    return <UserButton afterSignOutUrl="/" />
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <SignInButton mode="modal">
        <button style={{
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          fontWeight: 500,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}>
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button style={{
          fontSize: '0.875rem',
          background: 'var(--accent)',
          color: 'white',
          padding: '6px 14px',
          borderRadius: 'var(--radius)',
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
        }}>
          Sign up
        </button>
      </SignUpButton>
    </div>
  )
}
