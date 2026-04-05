import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '810 Recipe App',
  description: 'A personal recipe collection',
  icons: {
    icon: '~/Dev/recipe-app/public/favicon.png'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div className="container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '60px',
          }}>
            <a href="/" style={{
              fontFamily: 'Lora, serif',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '-0.01em',
            }}>
              Recipes
            </a>
            <div className="nav-links" style={{display: 'flex', gap: '24px', alignItems: 'center' }}>
              <a href="/recipes" style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                transition: 'color 0.15s',
              }}
              >
                Browse
              </a>
              <a href="/recipes/new" style={{
                fontSize: '0.875rem',
                background: 'var(--accent)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: 'var(--radius)',
                fontWeight: 500,
              }}>
                + Add Recipe
              </a>
              <a href="/planner" style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}>
                Planner
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
