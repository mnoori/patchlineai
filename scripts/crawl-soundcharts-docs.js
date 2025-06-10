const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class SoundchartsDocCrawler {
  constructor() {
    this.baseUrl = 'https://doc.api.soundcharts.com/api/v2/doc';
    this.crawledUrls = new Set();
    this.documentation = {};
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid blocking
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  }

  async crawlPage(url, section = 'root') {
    if (this.crawledUrls.has(url)) {
      return;
    }

    console.log(`📄 Crawling: ${url}`);
    this.crawledUrls.add(url);

    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Extract page content
      const pageData = await this.page.evaluate(() => {
        const title = document.querySelector('h1')?.textContent?.trim() || 
                     document.querySelector('title')?.textContent?.trim() || 
                     'Untitled';
        
        // Get main content
        const content = document.querySelector('main') || 
                       document.querySelector('.content') || 
                       document.querySelector('body');
        
        // Extract API endpoints and methods
        const endpoints = [];
        const tables = content.querySelectorAll('table');
        tables.forEach(table => {
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 3) {
              const method = cells[0]?.textContent?.trim();
              const endpoint = cells[1]?.textContent?.trim();
              const description = cells[2]?.textContent?.trim();
              
              if (method && endpoint && (method.includes('GET') || method.includes('POST'))) {
                endpoints.push({ method, endpoint, description });
              }
            }
          });
        });

        // Extract parameters
        const parameters = [];
        const paramTables = content.querySelectorAll('table');
        paramTables.forEach(table => {
          const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
          if (headers.includes('Parameter name') || headers.includes('Name')) {
            const rows = table.querySelectorAll('tr');
            rows.forEach((row, index) => {
              if (index === 0) return; // Skip header
              const cells = row.querySelectorAll('td');
              if (cells.length >= 2) {
                parameters.push({
                  name: cells[0]?.textContent?.trim(),
                  type: cells[1]?.textContent?.trim(),
                  description: cells[2]?.textContent?.trim() || '',
                  required: cells[3]?.textContent?.trim() || ''
                });
              }
            });
          }
        });

        // Extract code examples
        const codeBlocks = [];
        const preElements = content.querySelectorAll('pre, code');
        preElements.forEach(pre => {
          const code = pre.textContent.trim();
          if (code.length > 10) {
            codeBlocks.push(code);
          }
        });

        // Extract navigation links
        const navLinks = [];
        const links = content.querySelectorAll('a[href*="/api/v2/doc"]');
        links.forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent.trim();
          if (href && text && !href.includes('#')) {
            navLinks.push({
              url: href.startsWith('http') ? href : `https://doc.api.soundcharts.com${href}`,
              text: text
            });
          }
        });

        return {
          title,
          content: content.textContent.trim(),
          endpoints,
          parameters,
          codeBlocks,
          navLinks,
          url: window.location.href
        };
      });

      // Store the documentation
      const urlKey = url.replace(this.baseUrl, '').replace(/^\//, '') || 'index';
      this.documentation[urlKey] = pageData;

      // Crawl linked pages (limit to avoid infinite loops)
      const linksToFollow = pageData.navLinks.slice(0, 5); // Limit to first 5 links per page
      for (const link of linksToFollow) {
        if (!this.crawledUrls.has(link.url) && link.url.includes('doc.api.soundcharts.com')) {
          await this.delay(1000); // Be respectful with delays
          await this.crawlPage(link.url, link.text);
        }
      }

    } catch (error) {
      console.error(`❌ Error crawling ${url}:`, error.message);
    }
  }

  async crawlMainSections() {
    // Define main sections to crawl
    const mainSections = [
      '/reference/path/search/summary',
      '/reference/path/artist/summary',
      '/reference/path/artist/get-artists',
      '/reference/path/song/summary',
      '/reference/path/playlist/summary',
      '/reference/path/charts/summary',
      '/reference/path/referential/summary',
      '/reference/path/referential/get-artist-genres',
      '/reference/path/referential/get-platforms'
    ];

    for (const section of mainSections) {
      const url = `${this.baseUrl}${section}`;
      await this.crawlPage(url, section);
      await this.delay(2000);
    }
  }

  async generateSummary() {
    const summary = {
      crawledAt: new Date().toISOString(),
      totalPages: Object.keys(this.documentation).length,
      sections: {},
      allEndpoints: [],
      keyCapabilities: []
    };

    // Organize by sections
    for (const [key, doc] of Object.entries(this.documentation)) {
      const section = key.split('/')[0] || 'root';
      if (!summary.sections[section]) {
        summary.sections[section] = [];
      }
      summary.sections[section].push({
        title: doc.title,
        url: doc.url,
        endpoints: doc.endpoints.length,
        parameters: doc.parameters.length
      });

      // Collect all endpoints
      summary.allEndpoints.push(...doc.endpoints.map(ep => ({
        ...ep,
        section: section,
        page: doc.title
      })));
    }

    // Identify key capabilities for Scout Agent
    const scoutRelevantEndpoints = summary.allEndpoints.filter(ep => 
      ep.endpoint.includes('/artist') || 
      ep.endpoint.includes('/search') ||
      ep.description.toLowerCase().includes('genre') ||
      ep.description.toLowerCase().includes('filter')
    );

    summary.keyCapabilities = scoutRelevantEndpoints;

    return summary;
  }

  async saveDocumentation() {
    const outputDir = path.join(process.cwd(), 'docs', 'soundcharts-api');
    await fs.mkdir(outputDir, { recursive: true });

    // Save full documentation
    await fs.writeFile(
      path.join(outputDir, 'full-documentation.json'),
      JSON.stringify(this.documentation, null, 2)
    );

    // Save summary
    const summary = await this.generateSummary();
    await fs.writeFile(
      path.join(outputDir, 'api-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // Save Scout-specific recommendations
    const scoutRecommendations = this.generateScoutRecommendations(summary);
    await fs.writeFile(
      path.join(outputDir, 'scout-recommendations.md'),
      scoutRecommendations
    );

    console.log(`✅ Documentation saved to ${outputDir}`);
    return { outputDir, summary };
  }

  generateScoutRecommendations(summary) {
    const recommendations = `# Soundcharts API Recommendations for Scout Agent

## Current Issues with Our Implementation

1. **Text Search Problem**: We're using \`/api/v2/artist/search/{term}\` with literal genre names
   - Searching "electronic" finds an artist named "Electronic"
   - This is not how we should discover artists by genre

## Better Approaches Available

### 1. Use POST /api/v2/top/artists (Recommended)
This endpoint allows filtering by:
- **Genres**: Proper genre filtering instead of text search
- **Career Stage**: superstar, mainstream, mid_level, long_tail
- **Country**: Target specific markets
- **Metrics**: Sort by followers, monthly listeners, etc.

\`\`\`json
POST /api/v2/top/artists
{
  "sort": {
    "platform": "spotify",
    "metricType": "monthly_listeners", 
    "sortBy": "total",
    "order": "desc"
  },
  "filters": [
    {
      "type": "genre",
      "data": {
        "values": ["electronic", "hip-hop"],
        "operator": "in"
      }
    },
    {
      "type": "careerStage", 
      "data": {
        "values": ["mid_level", "long_tail"],
        "operator": "in"
      }
    }
  ]
}
\`\`\`

### 2. Get Available Genres First
Use \`GET /api/v2/referential/artist/genres\` to get proper genre IDs

### 3. Smart Filtering Options
Available filter types:
${summary.allEndpoints
  .filter(ep => ep.description.toLowerCase().includes('filter'))
  .map(ep => `- **${ep.method}** ${ep.endpoint}: ${ep.description}`)
  .join('\n')}

## Implementation Plan

1. **Replace genre mapping** with proper genre API calls
2. **Use /api/v2/top/artists** instead of search for discovery
3. **Implement career stage filtering** based on user preferences  
4. **Add market/country filtering** for geographic preferences
5. **Sort by relevant metrics** (monthly listeners, followers, etc.)

## Key Endpoints for Scout Agent

${summary.keyCapabilities
  .slice(0, 10)
  .map(ep => `- **${ep.method}** ${ep.endpoint}: ${ep.description}`)
  .join('\n')}

Generated on: ${new Date().toISOString()}
`;

    return recommendations;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const crawler = new SoundchartsDocCrawler();
  
  try {
    console.log('🚀 Starting Soundcharts API documentation crawl...');
    await crawler.init();
    
    // Start with main page
    await crawler.crawlPage(crawler.baseUrl);
    
    // Crawl main sections
    await crawler.crawlMainSections();
    
    // Save everything
    const result = await crawler.saveDocumentation();
    
    console.log('\n📊 Crawl Summary:');
    console.log(`- Pages crawled: ${result.summary.totalPages}`);
    console.log(`- Total endpoints: ${result.summary.allEndpoints.length}`);
    console.log(`- Scout-relevant endpoints: ${result.summary.keyCapabilities.length}`);
    console.log(`\n📁 Files saved to: ${result.outputDir}`);
    
  } catch (error) {
    console.error('❌ Crawl failed:', error);
  } finally {
    await crawler.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = SoundchartsDocCrawler; 