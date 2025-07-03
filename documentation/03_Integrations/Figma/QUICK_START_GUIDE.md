# Figma Integration Quick Start Guide

## 🚀 Get Started in 15 Minutes

### 1️⃣ Set Up Figma Access (5 min)

```powershell
# Create .env.local file
@"
FIGMA_ACCESS_TOKEN=figd_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIGMA_FILE_ID=PbzhWQIGJF68IPYo8Bheck
FIGMA_CLIENT_ID=optional
FIGMA_CLIENT_SECRET=optional
"@ | Out-File -FilePath .env.local -Encoding UTF8
```

**Get your token:**
1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Scroll to "Personal access tokens"
3. Click "Create new token"
4. Name it "Patchline Dev" and copy immediately

### 2️⃣ Test Connection (2 min)

```powershell
# Install dependencies if needed
pnpm install

# Test Figma connection
pnpm tsx scripts/explore-figma-file.ts
```

**Expected output:**
- ✅ File: PatchlineAI Branding
- ✅ Total nodes: 43,521
- ✅ Report saved to `figma-exploration/`

### 3️⃣ View Brand Showcase (3 min)

```powershell
# Start development server
pnpm dev

# Open brand showcase
Start-Process "http://localhost:3000/brand-showcase"
```

**What you should see:**
- Figma file overview
- Layer explorer (may need fixes)
- Color styles
- Exportable assets

### 4️⃣ Quick Fixes for Common Issues

#### Layer Names Not Showing?

Add this to `.env.local`:
```
FIGMA_ACCESS_TOKEN=your_actual_token_here
```

Then restart the dev server:
```powershell
# Kill current process (Ctrl+C)
# Start fresh
pnpm dev
```

#### API Errors?

Check token permissions:
```powershell
# Test API directly
curl -H "X-Figma-Token: $env:FIGMA_ACCESS_TOKEN" `
  "https://api.figma.com/v1/files/PbzhWQIGJF68IPYo8Bheck"
```

### 5️⃣ Extract Brand Elements (5 min)

```powershell
# Run brand extraction
pnpm tsx scripts/sync-figma-tokens.ts

# Or manually explore layers
pnpm tsx scripts/get-figma-layers-detailed.ts
```

## 📋 Checklist

- [ ] `.env.local` created with valid token
- [ ] `pnpm dev` running without errors
- [ ] `/brand-showcase` page loads
- [ ] Figma file info displays
- [ ] No console errors

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Figma access token not configured" | Add token to `.env.local` |
| "File not found" | Check FIGMA_FILE_ID matches |
| Layer names missing | See [Layer Names Fix Guide](./FIGMA_LAYER_NAMES_FIX.md) |
| Gradients show as "Linear" | Known limitation - use brand constants |

## 🎯 Next Steps

1. **Fix layer names** - Follow troubleshooting guide
2. **Sync brand tokens** - Run sync script
3. **Test component generation** - Try page converter
4. **Plan automation** - Review assessment document

## 💡 Pro Tips

1. **Use existing data**: Check `figma-exploration/showcase-data.json`
2. **Test incrementally**: Start with simple exports before full pages
3. **Keep hybrid approach**: Don't over-automate initially
4. **Version control**: Commit generated files for stability

## 📚 Resources

- [Full Assessment](./FIGMA_INTEGRATION_ASSESSMENT.md)
- [API Documentation](./FIGMA_INTEGRATION_GUIDE.md)
- [Layer Access Guide](./FIGMA_LAYER_ACCESS_GUIDE.md)
- [Figma API Reference](https://www.figma.com/developers/api)

---

**Ready to build?** Start with Phase 1 from the assessment plan! 🚀 