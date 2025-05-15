# Script to update import paths after restructuring
Write-Host "Updating import paths in the codebase..."

# Define the file types to process
$fileTypes = @("*.tsx", "*.ts", "*.js", "*.jsx")

# Define the directory paths to exclude
$excludeDirs = @("node_modules", ".next", ".git")

# Function to check if path contains excluded directory
function ShouldExcludePath($path) {
    foreach ($excludeDir in $excludeDirs) {
        if ($path -like "*\$excludeDir\*") {
            return $true
        }
    }
    return $false
}

# Find all files to update
$filesToProcess = @()
foreach ($fileType in $fileTypes) {
    $files = Get-ChildItem -Path . -Filter $fileType -Recurse -File
    foreach ($file in $files) {
        if (-not (ShouldExcludePath $file.FullName)) {
            $filesToProcess += $file.FullName
        }
    }
}

Write-Host "Found $($filesToProcess.Count) files to process"

# Define the import path replacements
$replacements = @(
    @{
        OldPattern = "from ['""]@/lib/utils['""]"
        NewPattern = "from '@/shared/utils/utils'"
    },
    @{
        OldPattern = "from ['""]@/lib/config['""]"
        NewPattern = "from '@/shared/utils/config'"
    },
    @{
        OldPattern = "from ['""]@/lib/spotify-auth['""]"
        NewPattern = "from '@/shared/utils/spotify-auth'"
    },
    @{
        OldPattern = "from ['""]@/lib/youtube-api['""]"
        NewPattern = "from '@/shared/utils/youtube-api'"
    },
    @{
        OldPattern = "from ['""]@/src/components"
        NewPattern = "from '@/components"
    },
    @{
        OldPattern = "from ['""]@/src/app"
        NewPattern = "from '@/app"
    },
    @{
        OldPattern = "import [^;]+ from ['""]@/app/api"
        NewPattern = "from '@/backend/api"
    }
)

# Counter for tracking changes
$changedFilesCount = 0

# Process each file
foreach ($file in $filesToProcess) {
    $content = Get-Content -Path $file -Raw
    $originalContent = $content
    $fileChanged = $false
    
    foreach ($replacement in $replacements) {
        $newContent = $content -replace $replacement.OldPattern, $replacement.NewPattern
        if ($newContent -ne $content) {
            $content = $newContent
            $fileChanged = $true
        }
    }
    
    if ($fileChanged) {
        Set-Content -Path $file -Value $content
        $changedFilesCount++
        Write-Host "Updated imports in: $file"
    }
}

Write-Host "Import paths updated in $changedFilesCount files"
Write-Host "Please verify the changes and test the application" 