const { FigmaClient } = require('./lib/figma/client');
const { getFigmaConfig } = require('./lib/figma');

async function checkLogo() {
  try {
    const config = getFigmaConfig();
    const client = new FigmaClient(config.accessToken);

    // Check the Vector layer (113:14)
    console.log('Checking Vector layer 113:14...');
    const nodes = await client.getNodes(config.fileId, ['113:14']);
    console.log('Vector layer details:');
    console.log(JSON.stringify(nodes['113:14'], null, 2));

    // Try to export it as SVG
    try {
      console.log('\nExporting as SVG...');
      const exports = await client.exportAssets(config.fileId, ['113:14'], 'svg');
      console.log('Vector SVG export URL:', exports['113:14']);
    } catch (error) {
      console.log('SVG Export error:', error.message);
    }

    // Also try PNG
    try {
      console.log('\nExporting as PNG...');
      const exports = await client.exportAssets(config.fileId, ['113:14'], 'png');
      console.log('Vector PNG export URL:', exports['113:14']);
    } catch (error) {
      console.log('PNG Export error:', error.message);
    }
  } catch (error) {
    console.log('Main error:', error.message);
  }
}

checkLogo(); 