import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Check if there is any supported locale in the pathname
    const pathname = request.nextUrl.pathname

    // Check for "lang" query param to override locale (useful for testing)
    const langParam = request.nextUrl.searchParams.get('lang')
    if (langParam === 'en' || langParam === 'pt') {
        const url = request.nextUrl.clone()
        url.searchParams.delete('lang')
        const response = NextResponse.redirect(url)
        response.cookies.set('NEXT_LOCALE', langParam, { path: '/', maxAge: 60 * 60 * 24 * 365 })
        return response
    }

    // Check if the default locale is in the cookie
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value

    // If no cookie is set, detect from Accept-Language header
    if (!cookieLocale) {
        const acceptLanguage = request.headers.get('accept-language') || ''

        // Default to 'en'
        let locale = 'en'

        // Check for Portuguese (pt-BR or pt-PT)
        if (acceptLanguage.toLowerCase().includes('pt')) {
            locale = 'pt'
        }

        const response = NextResponse.next()

        // Set the cookie for future requests
        // Max age: 1 year to persist preference
        response.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })

        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Skip all internal paths (_next)
        '/((?!_next|api|logo.png|favicon.ico).*)',
    ],
}
