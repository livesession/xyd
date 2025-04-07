import type { Metadata } from 'next'
import '@primer/react-brand/lib/css/main.css'
import '@primer/react-brand/fonts/fonts.css'

import './index.css'

export const metadata: Metadata = {
  title: 'xyd',
  description: 'xyd landning page',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-color-mode="dark">
      <body>
        {children}
      </body>
    </html>
  )
} 