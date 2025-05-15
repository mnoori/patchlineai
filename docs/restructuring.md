# Project Restructuring Documentation

This document records the restructuring of the PatchLine AI codebase that occurred on 2025-05-15.

## Changes Made

1. Organized the codebase according to a clean folder structure
2. Consolidated components from multiple locations into a single /components directory
3. Moved utility functions to /shared/utils
4. Moved type definitions to /shared/types
5. Moved backend code to /backend
6. Removed redundant directories: patchline-main, src

## Rationale

The restructuring was done to improve code organization, maintainability, and adherence to Next.js best practices.
