# Patchline Tier System

## Overview

The Patchline platform uses a tiered permission system to control feature access based on subscription level. The system is designed to be flexible, allowing users to upgrade their subscription and access more features.

## Tier Structure

### CREATOR (Free)
- Target: Solo artists, bedroom producers, content creators
- Features: Catalog (50 tracks), Releases, Fan Agent, Marketplace Agent
- Limits: 1 seat, 100 AI actions/month, 0 marketplace credits

### ROSTER ($59/month)
- Target: Indie managers, small labels, boutique festivals
- Features: Everything in Creator + Metadata/Legal/Scout agents
- Limits: 5 seats, 1,000 AI actions/month, 10 marketplace credits
- 14-day free trial

### ENTERPRISE ($299/month)
- Target: Established labels, publishing companies, entertainment groups
- Features: Everything in Roster + unlimited seats/actions, bulk import, contract vault, white-label portals
- Limits: Unlimited seats, Unlimited AI actions, 30 marketplace credits

### GOD_MODE (Internal)
- Target: Admin/Developer use only
- Features: All platform features + internal tools
- Access: Password protected (activation via settings)
- Features: Document Processing, AI HR Recruiter, Newsletter Generator

## Technical Implementation

### Frontend Implementation

#### Storage Mechanism
The tier system currently uses client-side storage via Zustand with persistence to localStorage. The implementation is in `lib/permissions.ts`.

```typescript
// Current storage format in localStorage
{
  "state": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "tier": "roster",
      "purchasedFeatures": [],
      "godModeActivated": false
    }
  }
}
```

#### Key Components

1. **Permission Store (`lib/permissions.ts`)**
   - Defines tier structure, features, and permissions
   - Provides hooks for checking feature access
   - Handles tier-based feature gating

2. **Tier Configuration (`lib/tier-config.ts`)**
   - Single source of truth for tier names, prices, features
   - Provides upgrade paths between tiers
   - Defines marketing content for each tier

3. **Auth Sync Hook (`hooks/use-auth-sync.ts`)**
   - Syncs authentication state with permission system
   - Initializes user tier on login
   - Preserves tier during auth operations

4. **Tier Persistence Component (`components/tier-persistence.tsx`)**
   - Ensures tier consistency across page reloads
   - Protects against tier reset issues
   - Validates localStorage against memory state

5. **Upgrade Dialog (`components/upgrade-dialog.tsx`)**
   - Handles tier upgrade UI flow
   - Simulates payment process
   - Updates tier in localStorage directly

6. **Dev Mode Tier Switcher**
   - Located in Settings → Billing tab
   - Allows easy switching between tiers for testing
   - For development only

### Backend Integration (PLANNED)

The tier system is currently client-side only, with no backend persistence. For production, the following components need to be implemented:

1. **DynamoDB Integration**
   - Store tier information in Users table
   - Update tier on subscription changes

2. **Cognito Custom Attributes**
   - Add `custom:tier` attribute to user profile
   - Use during authentication to initialize permissions

3. **Stripe Integration**
   - Create subscription products for each tier
   - Handle webhooks for subscription events
   - Update user tier on successful payment

4. **API Endpoints**
   - `POST /api/upgrade-tier`: Handle Stripe webhook callbacks
   - `GET /api/user/tier`: Fetch current user tier
   - `PUT /api/user/tier`: Update user tier (admin only)

## Usage

### Checking Feature Access

```typescript
import { usePermissions } from '@/lib/permissions'

function MyComponent() {
  const { hasFeature } = usePermissions()
  
  // Check if user has access to a feature
  if (hasFeature(FeatureId.SCOUT_AGENT)) {
    // Show scout agent UI
  }
}
```

### Getting Available Features

```typescript
import { usePermissions } from '@/lib/permissions'

function SidebarNav() {
  const { getAvailableFeatures } = usePermissions()
  
  // Get all features available to the user
  const features = getAvailableFeatures()
  
  return features.map(featureId => (
    <NavItem key={featureId} feature={FEATURE_CATALOG[featureId]} />
  ))
}
```

### Activating God Mode

```typescript
import { usePermissions } from '@/lib/permissions'

function GodModeDialog() {
  const { user, setUser } = usePermissions()
  
  const handleActivate = (password) => {
    if (password === "cassianandor") {
      const updatedUser = {
        ...user,
        tier: UserTier.GOD_MODE,
        godModeActivated: true
      }
      
      setUser(updatedUser)
      
      // Persist to localStorage
      const currentStore = JSON.parse(localStorage.getItem('patchline-permissions') || '{}')
      currentStore.state = { ...currentStore.state, user: updatedUser }
      localStorage.setItem('patchline-permissions', JSON.stringify(currentStore))
    }
  }
}
```

## Common Issues

### Tier Reset Issue

**Problem**: User tier resets to CREATOR after page reload or navigation.

**Solution**: The `TierPersistence` component checks for mismatches between memory and localStorage, and restores the higher tier when detected. Additionally, the auth sync hook was modified to avoid overriding existing tier information.

### Hydration Mismatch Error

**Problem**: Sidebar navigation icons/routes cause hydration mismatch errors during SSR.

**Solution**: The sidebar component now uses client-side only rendering with a loading skeleton to prevent hydration mismatches.

## Next Steps

See the `BACKLOG.md` file for upcoming tasks related to the tier system, including backend integration with Stripe and DynamoDB. 