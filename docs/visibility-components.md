# Visibility Component System

This document explains the React components used to control UI visibility based on:

- Device type (desktop, tablet, mobile)
- User subscription tier (free, bronze, silver, gold)

The system is designed in layers:

1. **Low-Level Primitives** — Core components containing the visibility logic.
2. **Semantic Wrappers** — Simple components for common visibility rules.
3. **Combined Wrappers** — Convenience components combining device and tier rules.

---

## 1. Device-Specific Visibility

Device visibility is handled primarily through CSS classes for optimal client-side performance.

### Low-Level: `ResponsiveVisibility`

This is the primitive component. It wraps its children in a configurable element and applies Tailwind CSS classes to control visibility at different breakpoints.

**Props:**

- `visibleOn`: `'desktop' | 'tablet' | 'mobile'` — Content is only visible on this breakpoint.
- `hiddenOn`: `'desktop' | 'tablet' | 'mobile'` — Content is hidden on this breakpoint.

**Example:**

```tsx
import { ResponsiveVisibility } from '../ResponsiveVisibility'

function Example() {
  return (
    <ResponsiveVisibility visibleOn="desktop">
      <p>This is only visible on desktop screens.</p>
    </ResponsiveVisibility>
  )
}
```

### Recommended: Semantic Device Components

File:

```text
src/components/visibility/DeviceVisibility.tsx
```

These components are declarative wrappers around `ResponsiveVisibility` and are the recommended way to handle device-specific visibility.

**Available Components:**

- `<DesktopOnly>`
- `<TabletOnly>`
- `<MobileOnly>`
- `<NotOnDesktop>`

**Example:**

```tsx
import { DesktopOnly, MobileOnly } from './DeviceVisibility'

function MyComponent() {
  return (
    <>
      <DesktopOnly>
        <p>This is the desktop view.</p>
      </DesktopOnly>

      <MobileOnly>
        <p>This is the mobile view.</p>
      </MobileOnly>
    </>
  )
}
```

---

## 2. Tier-Based Visibility

Tier visibility uses JavaScript logic because it depends on the authenticated user's state.

### Low-Level: `TierDeviceVisibility`

This primitive component performs the tier rule checks.

It compares the user's tier against rules such as:

- `minTier`
- `allowedTiers`

Children are rendered only when the visibility rules pass.

### Recommended: Semantic Tier Components

File:

```text
src/components/visibility/TierVisibility.tsx
```

These wrappers provide a simpler API around `TierDeviceVisibility`.

**Available Components:**

- `<FreeTierOnly>`
- `<BronzeTierOrHigher>`
- `<SilverTierOrHigher>`
- `<GoldTierOrHigher>`
- `<PaidTierOnly>`
- `<NotOnFreeTier>`

All tier-based components require a `tier` prop.

**Example:**

```tsx
import { GoldTierOrHigher } from './TierVisibility'
import { useAuth } from '../../auth/AuthContext'

function MyComponent() {
  const { user } = useAuth()

  return (
    <GoldTierOrHigher tier={user?.tier}>
      <p>This is a special feature for Gold members.</p>
    </GoldTierOrHigher>
  )
}
```

---

## 3. Combined Device and Tier Visibility

For rules that depend on both device type and subscription tier, use combined visibility components.

File:

```text
src/components/visibility/CombinedVisibility.tsx
```

**Available Components:**

- `<GoldDesktopOnly>`
- `<SilverDesktopOnly>`
- `<BronzeDesktopOnly>`
- `<PaidTierDesktopOnly>`
- `<PaidTierTabletOnly>`
- `<PaidTierMobileOnly>`

**Example:**

Instead of nesting components:

```tsx
<PaidTierOnly tier={user?.tier}>
  <DesktopOnly>
    <p>A special message for paid subscribers on desktop.</p>
  </DesktopOnly>
</PaidTierOnly>
```

Use the combined component:

```tsx
import { PaidTierDesktopOnly } from './CombinedVisibility'

function MyComponent() {
  return (
    <PaidTierDesktopOnly tier={user?.tier}>
      <p>A special message for paid subscribers on desktop.</p>
    </PaidTierDesktopOnly>
  )
}
```

---

## Usage Guidelines

Prefer the highest-level component available:

1. Use combined components for common device + tier rules.
2. Use semantic wrappers for common visibility requirements.
3. Use primitive components only when you need custom visibility behaviour.
