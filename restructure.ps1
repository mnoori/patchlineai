# Restructure script for PatchLine AI codebase
Write-Host "Restructuring PatchLine AI codebase..."

# Create new directories if they don't exist
$directories = @(
    "app",
    "components",
    "public",
    "backend",
    "shared/types",
    "shared/utils",
    "docs"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Created directory: $dir"
    }
}

# Move files from src/components to components if needed
if (Test-Path "src/components") {
    if (-not (Test-Path "components/pitch-deck/pitch-deck-viewer.tsx") -and (Test-Path "src/components/pitch-deck/pitch-deck-viewer.tsx")) {
        if (-not (Test-Path "components/pitch-deck")) {
            New-Item -ItemType Directory -Path "components/pitch-deck" -Force
        }
        Copy-Item "src/components/pitch-deck/pitch-deck-viewer.tsx" "components/pitch-deck/" -Force
        Write-Host "Moved src/components/pitch-deck/pitch-deck-viewer.tsx to components/pitch-deck/"
    }
}

# Move any remaining useful files from patchline-main
if (Test-Path "patchline-main/public") {
    # Check if any files exist in patchline-main/public that don't exist in public
    $patchlinePublicFiles = Get-ChildItem -Path "patchline-main/public" -Recurse -File
    
    foreach ($file in $patchlinePublicFiles) {
        $relativePath = $file.FullName.Replace((Resolve-Path "patchline-main/public").Path + "\", "")
        $targetPath = Join-Path "public" $relativePath
        
        if (-not (Test-Path $targetPath)) {
            $targetDir = Split-Path -Parent $targetPath
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            Copy-Item $file.FullName -Destination $targetPath -Force
            Write-Host "Copied $($file.FullName) to $targetPath"
        }
    }
}

# Move any utility files that should be in shared/utils
# Check lib directory for potential utilities
if (Test-Path "lib") {
    $libFiles = Get-ChildItem -Path "lib" -Recurse -File
    
    foreach ($file in $libFiles) {
        $relativePath = $file.FullName.Replace((Resolve-Path "lib").Path + "\", "")
        $targetPath = Join-Path "shared/utils" $relativePath
        
        $targetDir = Split-Path -Parent $targetPath
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        Copy-Item $file.FullName -Destination $targetPath -Force
        Write-Host "Moved $($file.FullName) to $targetPath"
    }
}

# Move any type definitions to shared/types
# Check for potential type files in various locations
$typeFiles = Get-ChildItem -Path "." -Include "*.d.ts", "*types.ts", "*types.tsx" -Recurse -File

foreach ($file in $typeFiles) {
    # Skip files in node_modules or .next
    if ($file.FullName -like "*node_modules*" -or $file.FullName -like "*.next*") {
        continue
    }
    
    $fileName = $file.Name
    $targetPath = Join-Path "shared/types" $fileName
    
    Copy-Item $file.FullName -Destination $targetPath -Force
    Write-Host "Copied type file $($file.FullName) to $targetPath"
}

# Any backend-specific code should be moved to backend directory
# For this example, we'll check if there's an api directory and copy it
if (Test-Path "app/api") {
    Copy-Item "app/api" "backend/" -Recurse -Force
    Write-Host "Copied app/api to backend/"
}

Write-Host "Restructuring complete. Please review the changes before deleting any original files."
Write-Host "After verifying, you can remove redundant directories like 'patchline-main' and 'src'." 