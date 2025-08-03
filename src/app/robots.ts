import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandportal.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/settings/billing',
          '/settings/security',
          '/_next/',
          '/dashboard/private/',
          '/team/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/assets',
          '/collections',
          '/help',
          '/components',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/settings/',
          '/dashboard/',
          '/team/',
          '/profile/',
          '/notifications/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/assets',
          '/collections',
          '/help',
          '/components',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/settings/',
          '/dashboard/',
          '/team/',
          '/profile/',
          '/notifications/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}