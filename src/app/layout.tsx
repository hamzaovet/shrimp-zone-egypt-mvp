import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { CountryProvider } from '@/lib/CountryContext'
import { CartProvider } from '@/lib/CartContext'
import { NavigationProvider } from '@/lib/NavigationContext'
import { CustomerAuthProvider } from '@/lib/CustomerAuthContext'
import CartDrawer from '@/components/cart/CartDrawer'
import { Providers } from '@/components/Providers'

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' })

export const metadata: Metadata = {
  title: 'Shrimp Zone - شرمب زون',
  description: 'شرمب زون ملك الجمبري — أصل الجمبري في مصر وخارجها.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-sans antialiased bg-background text-foreground pb-20 md:pb-0`} suppressHydrationWarning>
        <Providers>
          <CountryProvider>
            <CartProvider>
              <CustomerAuthProvider>
                <NavigationProvider>
                  <Header />
                  <main className="min-h-screen">
                    {children}
                  </main>
                  <BottomNav />
                  <CartDrawer />
                </NavigationProvider>
              </CustomerAuthProvider>
            </CartProvider>
          </CountryProvider>
        </Providers>
      </body>
    </html>
  )
}
