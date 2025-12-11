import { NextResponse } from 'next/server'

export function middleware(request) {
  // 1. موجودہ راستہ (Path) دیکھیں
  const path = request.nextUrl.pathname

  // 2. ٹوکن (Token) چیک کریں (یوزر لاگ ان ہے یا نہیں)
  // Vercel پر کوکی کا نام __Secure- سے شروع ہوتا ہے
  const token = request.cookies.get('next-auth.session-token')?.value || 
                request.cookies.get('__Secure-next-auth.session-token')?.value

  // 3. اگر یوزر ڈیش بورڈ پر جانے کی کوشش کرے اور ٹوکن نہ ہو
  if (path.startsWith('/dashboard') && !token) {
    // تو اسے واپس لاگ ان پیج پر بھیج دیں
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 4. باقی سب ٹھیک ہے، جانے دیں
  return NextResponse.next()
}

// یہ مڈل ویئر صرف ڈیش بورڈ کے راستوں پر چلے گا
export const config = { matcher: ["/dashboard/:path*"] }
