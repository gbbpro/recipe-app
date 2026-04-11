import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', padding: '64px 24px' }}>
      <SignIn />
    </main>
  )
}
