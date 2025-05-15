# Cleanup script for PatchLine AI codebase
Write-Host "Cleaning up redundant directories after restructuring..."

# WARNING: This script will delete directories! Use with caution.
Write-Host "WARNING: This script will delete directories. Please ensure you have verified the restructuring first."
$confirmation = Read-Host "Do you want to proceed with cleanup? (y/n)"

if ($confirmation -ne "y") {
    Write-Host "Cleanup aborted."
    exit
}

# Directories to be removed
$directoriesToRemove = @(
    "patchline-main",
    "src"
)

foreach ($dir in $directoriesToRemove) {
    if (Test-Path $dir) {
        Write-Host "Removing directory: $dir"
        Remove-Item -Path $dir -Recurse -Force
        Write-Host "Directory $dir removed."
    } else {
        Write-Host "Directory $dir does not exist or has already been removed."
    }
}

# Create a note in docs about the restructuring
$docContent = @"
# Project Restructuring Documentation

This document records the restructuring of the PatchLine AI codebase that occurred on $(Get-Date -Format "yyyy-MM-dd").

## Changes Made

1. Organized the codebase according to a clean folder structure
2. Consolidated components from multiple locations into a single `/components` directory
3. Moved utility functions to `/shared/utils`
4. Moved type definitions to `/shared/types`
5. Moved backend code to `/backend`
6. Removed redundant directories: patchline-main, src

## Rationale

The restructuring was done to improve code organization, maintainability, and adherence to Next.js best practices.
"@

if (-not (Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" -Force | Out-Null
}

Set-Content -Path "docs/restructuring.md" -Value $docContent
Write-Host "Created documentation about the restructuring in docs/restructuring.md"

Write-Host "Cleanup complete. The codebase structure is now cleaned and organized." 