/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Site URL configuration
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://carid.vercel.app',

  // Sitemap generation settings
  generateRobotsTxt: true,
  sitemapSize: 5000,
  generateIndexSitemap: true,
  outDir: 'public',

  // Exclude non-public routes
  exclude: ['/api/*', '/dashboard/*', '/_error*', '/_next/*', '/404*', '/500*', '/auth/*'],

  // Robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',
          '/dashboard/*',
          '/_next/*',
          '/auth/*',
          '/*?*', // Avoid duplicate content with query parameters
        ],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://carid.vercel.app'}/sitemap.xml`,
    ],
  },

  // Default sitemap settings
  changefreq: 'weekly',
  priority: 0.8,

  // Transform function for additional paths
  transform: async (config, path) => {
    // Set priority and changefreq based on path
    let priority = config.priority;
    let changefreq = config.changefreq;

    // Homepage has highest priority
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    }

    // Authentication pages have lower priority
    if (['/login', '/register', '/forgot-password', '/reset-password'].includes(path)) {
      priority = 0.5;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      alternateRefs: [],
    };
  },

  // Additional public paths that should be included
  additionalPaths: async config => {
    const publicPaths = [
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      // Add more public paths here as needed
    ];

    return Promise.all(publicPaths.map(async path => await config.transform(config, path)));
  },
};
