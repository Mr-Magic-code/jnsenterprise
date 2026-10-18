import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Agar user protected dashboard par jana chahta hai aur token nahi hai
  if (pathname.startsWith('/protection/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/protection/login', request.url));
    }
  }

  // 2. Agar user already logged-in hai aur login, admin, ya flash-admin page khol raha hai
  if (
    pathname.startsWith('/protection/login') ||
    pathname.startsWith('/protection/admin') ||
    pathname.startsWith('/protection/flash-admin')
  ) {
    if (token) {
      return NextResponse.redirect(new URL('/protection/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/protection/dashboard/:path*',
    '/protection/login',
    '/protection/admin',
    '/protection/flash-admin',
  ],
};