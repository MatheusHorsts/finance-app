import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finance Manager',
  description: 'Gestão de finanças pessoais',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
