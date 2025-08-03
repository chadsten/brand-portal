// SEO optimization utilities and helpers

interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  author: string;
  twitterHandle?: string;
  facebookAppId?: string;
  logoUrl: string;
  organizationSchema: object;
}

export const seoConfig: SEOConfig = {
  siteName: 'Brand Portal',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://brandportal.com',
  defaultTitle: 'Brand Portal - Digital Asset Management',
  defaultDescription: 'Centralize, organize, and distribute your brand assets with our comprehensive digital asset management platform.',
  defaultKeywords: [
    'brand portal',
    'digital asset management',
    'DAM',
    'brand assets',
    'media library',
    'asset organization',
    'brand consistency',
    'content management',
  ],
  author: 'Brand Portal Team',
  twitterHandle: '@brandportal',
  logoUrl: '/logo.png',
  organizationSchema: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Brand Portal',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://brandportal.com',
    logo: '/logo.png',
    description: 'Digital Asset Management Platform for Modern Brands',
    foundingDate: '2024',
    industry: 'Software',
    knowsAbout: [
      'Digital Asset Management',
      'Brand Management',
      'Content Management',
      'Media Organization',
    ],
  },
};

// Generate page-specific metadata
export const SEOUtils = {
  // Generate title with proper formatting
  generateTitle(pageTitle?: string): string {
    if (!pageTitle) return seoConfig.defaultTitle;
    if (pageTitle.includes(seoConfig.siteName)) return pageTitle;
    return `${pageTitle} | ${seoConfig.siteName}`;
  },

  // Generate description with fallback
  generateDescription(pageDescription?: string): string {
    return pageDescription || seoConfig.defaultDescription;
  },

  // Generate keywords array
  generateKeywords(pageKeywords: string[] = []): string[] {
    return [...new Set([...seoConfig.defaultKeywords, ...pageKeywords])];
  },

  // Generate canonical URL
  generateCanonicalUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${seoConfig.siteUrl}${cleanPath}`;
  },

  // Generate Open Graph image URL
  generateOGImageUrl(title?: string, description?: string): string {
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (description) params.set('description', description);
    
    return `${seoConfig.siteUrl}/api/og-image?${params.toString()}`;
  },

  // Generate structured data for different page types
  generateStructuredData: {
    // Article/Blog post schema
    article(data: {
      title: string;
      description: string;
      author: string;
      publishedDate: string;
      modifiedDate?: string;
      image?: string;
      url: string;
      tags?: string[];
    }) {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        image: data.image || seoConfig.logoUrl,
        author: {
          '@type': 'Person',
          name: data.author,
        },
        publisher: seoConfig.organizationSchema,
        datePublished: data.publishedDate,
        dateModified: data.modifiedDate || data.publishedDate,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': data.url,
        },
        keywords: data.tags?.join(', '),
      };
    },

    // Product schema
    product(data: {
      name: string;
      description: string;
      image: string;
      brand: string;
      category: string;
      url: string;
      offers?: {
        price: string;
        currency: string;
        availability: string;
      };
    }) {
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.name,
        description: data.description,
        image: data.image,
        brand: {
          '@type': 'Brand',
          name: data.brand,
        },
        category: data.category,
        url: data.url,
        offers: data.offers ? {
          '@type': 'Offer',
          price: data.offers.price,
          priceCurrency: data.offers.currency,
          availability: `https://schema.org/${data.offers.availability}`,
        } : undefined,
      };
    },

    // FAQ schema
    faq(faqs: Array<{ question: string; answer: string }>) {
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };
    },

    // Breadcrumb schema
    breadcrumb(items: Array<{ name: string; url: string }>) {
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };
    },

    // Organization schema
    organization() {
      return seoConfig.organizationSchema;
    },

    // WebSite schema with search action
    website() {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: seoConfig.siteName,
        url: seoConfig.siteUrl,
        description: seoConfig.defaultDescription,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${seoConfig.siteUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      };
    },
  },

  // Generate sitemap data
  generateSitemapUrls(pages: Array<{
    path: string;
    lastModified?: Date;
    changeFreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
  }>) {
    return pages.map(page => ({
      url: this.generateCanonicalUrl(page.path),
      lastModified: page.lastModified || new Date(),
      changeFrequency: page.changeFreq || 'weekly',
      priority: page.priority || 0.5,
    }));
  },

  // Generate robots.txt content
  generateRobotsTxt(options: {
    allowAll?: boolean;
    disallowPaths?: string[];
    sitemapUrl?: string;
  } = {}) {
    const { allowAll = true, disallowPaths = [], sitemapUrl } = options;
    
    let content = 'User-agent: *\n';
    
    if (allowAll) {
      content += 'Allow: /\n';
    }
    
    disallowPaths.forEach(path => {
      content += `Disallow: ${path}\n`;
    });
    
    if (sitemapUrl) {
      content += `\nSitemap: ${sitemapUrl}\n`;
    }
    
    return content;
  },

  // Validate and optimize meta tags
  validateMetaTags(metadata: {
    title?: string;
    description?: string;
    keywords?: string[];
  }) {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Title validation
    if (metadata.title) {
      if (metadata.title.length > 60) {
        issues.push('Title is too long (over 60 characters)');
      }
      if (metadata.title.length < 30) {
        suggestions.push('Consider making title more descriptive (30-60 characters)');
      }
    } else {
      issues.push('Title is missing');
    }

    // Description validation
    if (metadata.description) {
      if (metadata.description.length > 160) {
        issues.push('Description is too long (over 160 characters)');
      }
      if (metadata.description.length < 120) {
        suggestions.push('Consider expanding description (120-160 characters)');
      }
    } else {
      issues.push('Description is missing');
    }

    // Keywords validation
    if (metadata.keywords) {
      if (metadata.keywords.length > 10) {
        suggestions.push('Consider reducing number of keywords (5-10 recommended)');
      }
      if (metadata.keywords.length === 0) {
        suggestions.push('Add relevant keywords for better SEO');
      }
    }

    return { issues, suggestions };
  },

  // Generate social media sharing URLs
  generateSocialUrls(url: string, title: string, description?: string) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = description ? encodeURIComponent(description) : '';

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    };
  },

  // Track SEO performance
  trackSEOMetrics() {
    if (typeof window === 'undefined') return null;

    return {
      // Core Web Vitals
      getLCP: () => {
        return new Promise((resolve) => {
          if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              resolve(lastEntry.startTime);
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
          }
        });
      },

      // Check for SEO issues
      auditSEO: () => {
        const issues: string[] = [];
        
        // Check for title
        if (!document.title) {
          issues.push('Missing page title');
        }

        // Check for meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          issues.push('Missing meta description');
        }

        // Check for canonical URL
        const canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
          issues.push('Missing canonical URL');
        }

        // Check for Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
          issues.push('Missing Open Graph title');
        }

        // Check for heading structure
        const h1Tags = document.querySelectorAll('h1');
        if (h1Tags.length === 0) {
          issues.push('Missing H1 tag');
        } else if (h1Tags.length > 1) {
          issues.push('Multiple H1 tags found');
        }

        // Check for alt attributes on images
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
        if (imagesWithoutAlt.length > 0) {
          issues.push(`${imagesWithoutAlt.length} images missing alt attributes`);
        }

        return issues;
      },
    };
  },
};