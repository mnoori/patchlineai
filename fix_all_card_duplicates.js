const fs = require('fs');
const path = require('path');

// Files that have duplicate Card imports based on our search
const filesToFix = [
  'components/agents/action-card.tsx',
  'components/agents/legal-agent-enhanced.tsx',
  'components/agents/scout-agent-enhanced.tsx',
  'components/agents/marketplace-enhanced.tsx',
  'components/agents/scout/discovery-cards.tsx',
  'components/agents/scout/artist-discovery-grid.tsx',
  'components/agents/scout/watchlist-view.tsx',
  'components/agents/scout/analytics-view.tsx',
  'components/agents/scout/artist-roster-view.tsx',
  'components/agents/metadata/agent-settings.tsx',
  'components/agents/legal/template-wizard.tsx',
  'components/agents/legal/contract-kanban.tsx',
  'components/agents/legal/contract-dashboard.tsx',
  'components/agents/legal/contract-calendar.tsx',
  'components/agents/legal/template-library.tsx',
  'components/dashboard/agent-card.tsx',
  'components/insights/platform-connection-status.tsx',
  'app/dashboard/mcp-test/page.tsx',
  'app/dashboard/god-mode/page.tsx',
  'app/dashboard/releases/page.tsx',
  'app/dashboard/agents/supervisor/page.tsx',
  'app/dashboard/agents/scout/debug/page.tsx',
  'app/dashboard/agents/blockchain/page.tsx',
  'app/dashboard/agents/legal/page.tsx',
  'app/dashboard/agents/education/page.tsx',
  'app/dashboard/settings/page.tsx'
];

function fixCardImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if file has both brand Card and UI Card imports
    const hasBrandCard = content.includes("import { Card } from '@/components/brand'");
    const hasUICard = content.includes("import { Card") && content.includes("from \"@/components/ui/card\"") || 
                     content.includes("from '@/components/ui/card'");

    if (hasBrandCard && hasUICard) {
      console.log(`Fixing duplicate Card imports in: ${filePath}`);
      
      // Replace brand Card import with BrandCard alias
      content = content.replace(
        /import { Card } from '@\/components\/brand'/g,
        "import { Card as BrandCard } from '@/components/brand'"
      );

      // Remove Card from UI imports (keep other components)
      content = content.replace(
        /import { Card, (.*?) } from ["']@\/components\/ui\/card["']/g,
        "import { $1 } from \"@/components/ui/card\""
      );
      
      // Handle case where Card is the only import from UI
      content = content.replace(
        /import { Card } from ["']@\/components\/ui\/card["']/g,
        ""
      );

      // Replace <Card> with <BrandCard> and </Card> with </BrandCard>
      content = content.replace(/<Card(\s|>)/g, '<BrandCard$1');
      content = content.replace(/<\/Card>/g, '</BrandCard>');

      // Fix any BrandCardContent references (should be CardContent)
      content = content.replace(/BrandCardContent/g, 'CardContent');
      content = content.replace(/BrandCardHeader/g, 'CardHeader');
      content = content.replace(/BrandCardTitle/g, 'CardTitle');
      content = content.replace(/BrandCardDescription/g, 'CardDescription');

      // Clean up any empty import lines
      content = content.replace(/\nimport { } from ["']@\/components\/ui\/card["']\n/g, '\n');
      content = content.replace(/\nimport {  } from ["']@\/components\/ui\/card["']\n/g, '\n');

      fs.writeFileSync(filePath, content);
      modified = true;
    }

    return modified;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

let totalFixed = 0;

// Fix all identified files
filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    if (fixCardImports(file)) {
      totalFixed++;
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log(`\nFixed duplicate Card imports in ${totalFixed} files.`);
console.log('All Card conflicts should now be resolved!'); 