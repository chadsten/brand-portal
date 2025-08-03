import { MetadataRoute } from 'next';
import { SEOUtils } from '~/utils/seoOptimization';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandportal.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    {
      path: '',
      lastModified: new Date(),
      changeFreq: 'daily' as const,
      priority: 1,
    },
    {
      path: '/dashboard',
      lastModified: new Date(),
      changeFreq: 'hourly' as const,
      priority: 0.9,
    },
    {
      path: '/assets',
      lastModified: new Date(),
      changeFreq: 'hourly' as const,
      priority: 0.9,
    },
    {
      path: '/collections',
      lastModified: new Date(),
      changeFreq: 'daily' as const,
      priority: 0.8,
    },
    {
      path: '/team',
      lastModified: new Date(),
      changeFreq: 'weekly' as const,
      priority: 0.7,
    },
    {
      path: '/analytics',
      lastModified: new Date(),
      changeFreq: 'daily' as const,
      priority: 0.7,
    },
    {
      path: '/settings',
      lastModified: new Date(),
      changeFreq: 'monthly' as const,
      priority: 0.6,
    },
    {
      path: '/settings/account',
      lastModified: new Date(),
      changeFreq: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/settings/notifications',
      lastModified: new Date(),
      changeFreq: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/settings/security',
      lastModified: new Date(),
      changeFreq: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/settings/billing',
      lastModified: new Date(),
      changeFreq: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/profile',
      lastModified: new Date(),
      changeFreq: 'weekly' as const,
      priority: 0.6,
    },
    {
      path: '/help',
      lastModified: new Date(),
      changeFreq: 'monthly' as const,
      priority: 0.6,
    },
    {
      path: '/help/getting-started',
      lastModified: new Date(),
      changeFreq: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/help/asset-management',
      lastModified: new Date(),
      changeFreq: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/help/collaboration',
      lastModified: new Date(),
      changeFreq: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/help/api-documentation',
      lastModified: new Date(),
      changeFreq: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/notifications',
      lastModified: new Date(),
      changeFreq: 'hourly' as const,
      priority: 0.6,
    },
    {
      path: '/components',
      lastModified: new Date(),
      changeFreq: 'weekly' as const,
      priority: 0.4,
    },
  ];

  return staticPages.map(page => ({
    url: `${baseUrl}${page.path}`,
    lastModified: page.lastModified,
    changeFrequency: page.changeFreq,
    priority: page.priority,
  }));
}