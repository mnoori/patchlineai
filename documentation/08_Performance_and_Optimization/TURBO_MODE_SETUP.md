# 🚀 Turbo Mode Quick Setup

## Enable Turbo Mode (10-20x faster development)

### Step 1: Add to `.env.local`
```
NEXT_PUBLIC_ENABLE_WEB3=false
```

### Step 2: Run Turbo
```bash
npx next dev --turbo
```

That's it! You're now running with Turbopack 🎉

## What this does:
- **Disables**: Web3/Dynamic Labs features (temporarily)
- **Enables**: Turbopack for ultra-fast compilation
- **Result**: 10-20x faster hot reloads

## To re-enable Web3:
```
NEXT_PUBLIC_ENABLE_WEB3=true
pnpm dev
```

## Performance Comparison:
| Mode | Initial Compile | Hot Reload | Web3 Support |
|------|----------------|------------|--------------|
| Regular | ~80s | ~5-10s | ✅ Yes |
| Turbo | ~5-10s | <1s | ❌ No |

## Pro Tip:
Use Turbo mode when working on non-crypto features, switch back to regular mode when you need Web3! 