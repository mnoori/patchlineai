import { execSync } from 'child_process'
import path from 'path'

describe('Brand Consistency', () => {
  it('should not contain any "Patchy" references in source code', () => {
    try {
      // Search for "Patchy" in source files, excluding node_modules and test files
      const result = execSync(
        'grep -r -i "patchy" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.git --exclude="*.test.*" --exclude="*.spec.*" .',
        { 
          cwd: path.resolve(__dirname, '..'),
          encoding: 'utf8'
        }
      )
      
      // If grep finds matches, it returns them. If no matches, it throws.
      // So if we reach this line, there are Patchy references
      const matches = result.trim().split('\n').filter(line => line.length > 0)
      
      fail(`Found ${matches.length} "Patchy" reference(s) in source code:\n${matches.join('\n')}`)
      
    } catch (error: any) {
      // grep exits with code 1 when no matches found - this is what we want
      if (error.status === 1) {
        // No matches found - test passes
        expect(true).toBe(true)
      } else {
        // Some other error occurred
        throw error
      }
    }
  })

  it('should not contain any hard-coded "Patchy" in prompts or instructions', () => {
    try {
      // Search specifically in backend scripts and prompt files
      const result = execSync(
        'grep -r -i "patchy" --include="*.md" --include="*.py" --include="*.json" --exclude-dir=node_modules --exclude-dir=.git backend/ legacy/ || true',
        { 
          cwd: path.resolve(__dirname, '..'),
          encoding: 'utf8'
        }
      )
      
      const matches = result.trim().split('\n').filter(line => 
        line.length > 0 && 
        !line.includes('{{agentName}}') && // Allow templated versions
        !line.includes('# Legacy') // Allow legacy file comments
      )
      
      if (matches.length > 0) {
        fail(`Found ${matches.length} hard-coded "Patchy" reference(s) in backend/prompt files:\n${matches.join('\n')}`)
      }
      
      expect(true).toBe(true)
      
    } catch (error: any) {
      // If grep command fails, that's an error
      if (error.status !== 1) {
        throw error
      }
    }
  })
}) 