import './globals.css'

export const metadata = {
  title: 'SK Properties CRM',
  description: 'Mobile-first CRM for SK Properties'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
