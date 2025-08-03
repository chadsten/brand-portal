import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title') || 'Brand Portal';
    const description = searchParams.get('description') || 'Digital Asset Management Platform';
    
    // Simple SVG OG image generation
    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f0f9ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e0f2fe;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Main container -->
        <rect x="100" y="100" width="1000" height="430" rx="24" fill="white" stroke="#0066cc" stroke-width="4" filter="drop-shadow(0 25px 50px rgba(0,0,0,0.1))"/>
        
        <!-- Brand -->
        <text x="600" y="200" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="600" fill="#0066cc">Brand Portal</text>
        
        <!-- Title -->
        <text x="600" y="280" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${title.length > 30 ? '36' : '48'}" font-weight="700" fill="#1e293b">${title}</text>
        
        <!-- Description -->
        <text x="600" y="340" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${description.length > 80 ? '18' : '24'}" fill="#64748b">${description}</text>
        
        <!-- Bottom accent -->
        <rect x="0" y="622" width="1200" height="8" fill="#0066cc"/>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}