import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // --- Security Headers ---

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME-type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Control referrer information
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // DNS prefetch for performance
    response.headers.set('X-DNS-Prefetch-Control', 'on');

    // Force HTTPS (respected by browsers after first visit)
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
    );

    // Restrict powerful browser features
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), browsing-topics=()'
    );

    // Content Security Policy
    const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://picsum.photos https://*.googleusercontent.com",
        "connect-src 'self' https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com",
        "frame-src 'self' https://accounts.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ];
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
