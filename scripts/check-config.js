#!/usr/bin/env node

/**
 * Simple Configuration Check Script
 * This script reads our configuration files and displays the current setup
 */

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔍 Patchline Multi-Agent System Configuration Check');
  console.log('='.repeat(50));

  try {
    // Read prompt files
    console.log('\n📄 Prompt Files:');
    checkFile('prompts/gmail-agent.md', 'Gmail Agent Prompt');
    checkFile('prompts/legal-agent.md', 'Legal Agent Prompt');
    checkFile('prompts/supervisor-agent.md', 'Supervisor Agent Prompt');
    
    // Read agent configuration
    console.log('\n🤖 Agent Configuration:');
    checkFile('agents.yaml', 'Agent Configuration (YAML)');
    
    // Parse and display YAML configuration
    try {
      const yamlContent = fs.readFileSync(path.join(process.cwd(), 'agents.yaml'), 'utf8');
      // Simple parsing without external dependencies
      const configLines = yamlContent.split('\n');
      const agents = [];
      let currentAgent = null;
      
      for (const line of configLines) {
        if (line.trim() === '' || line.startsWith('#')) continue;
        
        // First level entries (agents)
        if (!line.startsWith(' ') && line.includes(':')) {
          const [key] = line.split(':');
          if (['gmail', 'legal', 'supervisor'].includes(key)) {
            currentAgent = { name: key };
            agents.push(currentAgent);
          }
        } 
        // Second level entries (agent properties)
        else if (line.startsWith('  ') && !line.startsWith('   ') && line.includes(':')) {
          if (currentAgent) {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value !== undefined) {
              currentAgent[key] = value;
            }
          }
        }
      }
      
      console.log('\n📊 Agent Summary:');
      agents.forEach(agent => {
        console.log(`\n- ${agent.name.toUpperCase()} AGENT`);
        Object.entries(agent).forEach(([key, value]) => {
          if (key !== 'name') {
            console.log(`  ${key}: ${value}`);
          }
        });
      });
      
    } catch (error) {
      console.log('❌ Failed to parse agents.yaml');
      console.log(`   Error: ${error.message}`);
    }
    
    // Read documentation
    console.log('\n📚 Documentation:');
    checkFile('docs/agent-system.md', 'Agent System Documentation');
    
    // Read supervisor implementation
    console.log('\n🧠 Implementation:');
    checkFile('lib/supervisor-agent.ts', 'Supervisor Agent Implementation');
    
    console.log('\n✅ Configuration check complete!');
    
  } catch (error) {
    console.error('❌ Error during configuration check:');
    console.error(error);
    process.exit(1);
  }
}

// Helper function to check if a file exists and output its details
function checkFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    const stats = fs.statSync(fullPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    const sizeKb = (stats.size / 1024).toFixed(2);
    
    console.log(`✅ ${description}: ${filePath}`);
    console.log(`   Size: ${sizeKb} KB, Lines: ${lines}`);
    console.log(`   Last Modified: ${stats.mtime.toISOString()}`);
    
    // For markdown files, print the first heading
    if (filePath.endsWith('.md')) {
      const firstHeading = content.split('\n')
        .find(line => line.startsWith('# '));
      if (firstHeading) {
        console.log(`   Title: ${firstHeading.replace('# ', '')}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ ${description}: ${filePath}`);
    console.log(`   Error: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error:');
  console.error(error);
  process.exit(1);
}); 