import Head from 'next/head';
import type { Metadata } from 'next';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
}

export function SEOHead({
  title = 'Brand Portal - Digital Asset Management',
  description = 'Centralize, organize, and distribute your brand assets with our comprehensive digital asset management platform.',
  keywords = ['brand portal', 'digital asset management', 'DAM', 'brand assets', 'media library'],
  image = '/api/og-image',
  url,
  type = 'website',
  siteName = 'Brand Portal',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noIndex = false,
  noFollow = false,
  canonical,
}: SEOHeadProps) {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const keywordString = keywords.join(', ');
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const canonicalUrl = canonical || currentUrl;

  const robots = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow',
  ].join(', ');

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordString} />
      <meta name="robots" content={robots} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Author */}
      {author && <meta name="author" content={author} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:alt" content={title} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {section && <meta property="article:section" content={section} />}
      {tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Additional SEO Tags */}
      <meta name="language" content="en" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Favicon and Touch Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#0066cc" />

      {/* Preconnect to External Domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: siteName,
            description: description,
            url: currentUrl,
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            author: {
              '@type': 'Organization',
              name: siteName,
            },
            screenshot: image,
          }),
        }}
      />
    </Head>
  );
}

// Generate Next.js 13+ App Router metadata
export function generateMetadata({
  title = 'Brand Portal - Digital Asset Management',
  description = 'Centralize, organize, and distribute your brand assets with our comprehensive digital asset management platform.',
  keywords = ['brand portal', 'digital asset management', 'DAM', 'brand assets', 'media library'],
  image = '/api/og-image',
  url,
  siteName = 'Brand Portal',
  noIndex = false,
}: Partial<SEOHeadProps> = {}): Metadata {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      siteName,
      title: fullTitle,
      description,
      url,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    other: {
      'theme-color': '#0066cc',
    },
  };
}

// Hook for dynamic SEO updates
export function useSEO() {
  const updateTitle = (newTitle: string) => {
    if (typeof document !== 'undefined') {
      document.title = newTitle;
    }
  };

  const updateDescription = (newDescription: string) => {
    if (typeof document !== 'undefined') {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', newDescription);
      }
    }
  };

  const updateCanonical = (newUrl: string) => {
    if (typeof document !== 'undefined') {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', newUrl);
    }
  };

  const addStructuredData = (data: object) => {
    if (typeof document !== 'undefined') {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    }
  };

  return {
    updateTitle,
    updateDescription,
    updateCanonical,
    addStructuredData,
  };
}