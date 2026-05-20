# Figma MCP Integration Rules

## Overview

This document defines the design system rules for implementing Figma designs in the Candidate Portal project. These rules ensure consistent, high-quality implementations that maintain design system integrity.

## Project Context

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with CSS variables
- **Component Library**: Shadcn/ui (New York style)
- **Icons**: Lucide React
- **Font**: Manrope (primary), Geist Sans & Geist Mono (system fonts)

## Required Figma Implementation Flow

**IMPORTANT: Follow these steps in order. Do not skip steps.**

1. **Parse Figma URL** - Extract `fileKey` and `nodeId` from the URL
2. **Fetch Design Context** - Run `get_design_context(fileKey, nodeId)` to get structured design data
3. **Get Screenshot** - Run `get_screenshot(fileKey, nodeId)` for visual reference
4. **Download Assets** - Download any images, icons, or SVGs from Figma MCP server
5. **Translate to Project Conventions** - Convert Figma output to project's framework and styles
6. **Validate Against Figma** - Compare final implementation with screenshot

**If design context is truncated:**
- Run `get_metadata(fileKey, nodeId)` to get node structure
- Fetch individual child nodes with `get_design_context(fileKey, childNodeId)`

## Design Token System

### Token Location
Design tokens are defined in `app/globals.css` using CSS variables.

### Color Tokens

**IMPORTANT: Never hardcode colors. Always use CSS variables.**

```css
/* Primary Colors */
--primary: #1993e5
--primary-foreground: oklch(0.985 0 0)

/* Semantic Colors */
--background: #f9f9f9
--foreground: oklch(0.145 0 0)
--card: oklch(1 0 0)
--card-foreground: oklch(0.145 0 0)
--muted: oklch(0.97 0 0)
--muted-foreground: oklch(0.556 0 0)
--accent: oklch(0.97 0 0)
--accent-foreground: oklch(0.205 0 0)
--destructive: oklch(0.577 0.245 27.325)
--border: oklch(0.922 0 0)
--input: oklch(0.922 0 0)
--ring: oklch(0.708 0 0)
```

**Usage in Tailwind:**
```tsx
// ✅ Correct
<div className="bg-primary text-primary-foreground" />
<div className="bg-card text-card-foreground" />

// ❌ Wrong
<div className="bg-[#1993e5]" />
```

### Typography Tokens

**Font Family:**
- Primary: `'Manrope', sans-serif` (defined in `app/globals.css`)
- System: `var(--font-geist-sans)` and `var(--font-geist-mono)`

**Font Weights:**
- Available: 200-800 (Manrope supports variable weights)

**Usage:**
```tsx
// ✅ Correct - Tailwind classes
<h1 className="text-3xl font-bold">Heading</h1>
<p className="text-base text-muted-foreground">Body text</p>

// ❌ Wrong - Hardcoded font-family
<h1 style={{ fontFamily: 'Manrope' }}>Heading</h1>
```

### Spacing & Layout

**Border Radius:**
```css
--radius: 0.625rem (10px)
--radius-sm: calc(var(--radius) - 4px) (6px)
--radius-md: calc(var(--radius) - 2px) (8px)
--radius-lg: var(--radius) (10px)
--radius-xl: calc(var(--radius) + 4px) (14px)
```

**Usage:**
```tsx
// ✅ Correct
<div className="rounded-lg" /> // Uses --radius-lg
<div className="rounded-md" /> // Uses --radius-md

// ❌ Wrong
<div className="rounded-[10px]" />
```

**Spacing Scale:**
Use Tailwind's default spacing scale (4px base):
- `space-1` = 4px
- `space-2` = 8px
- `space-4` = 16px
- `space-6` = 24px
- etc.

## Component Organization

### Directory Structure

```
components/
├── ui/                    # Shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── [feature-name].tsx     # Feature-specific components
└── [layout-name].tsx      # Layout components
```

### Component Rules

**IMPORTANT: Always check for existing components before creating new ones.**

1. **Shadcn/ui Components** (`components/ui/`)
   - Base UI primitives (Button, Card, Input, etc.)
   - Do NOT modify these directly
   - Extend via composition or variants

2. **Feature Components** (`components/`)
   - Feature-specific components
   - Can use Shadcn/ui components as building blocks
   - Follow PascalCase naming: `ComponentName.tsx`

3. **Component Patterns:**
   ```tsx
   // ✅ Correct - Using existing Button component
   import { Button } from "@/components/ui/button";
   
   <Button variant="default" size="lg">
     Click me
   </Button>
   
   // ❌ Wrong - Creating duplicate button
   <button className="bg-primary text-white px-4 py-2">
     Click me
   </button>
   ```

### Component Props

**Always use TypeScript interfaces:**
```tsx
interface ComponentProps {
  title: string;
  description?: string;
  variant?: 'default' | 'secondary';
  className?: string;
}

export function Component({ title, description, variant = 'default', className }: ComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {/* ... */}
    </div>
  );
}
```

**Always accept `className` prop for composition:**
```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-classes", className)} />
```

## Styling Approach

### Tailwind CSS 4

**IMPORTANT: Use Tailwind utility classes, not inline styles.**

```tsx
// ✅ Correct
<div className="flex items-center gap-4 p-6 bg-card rounded-lg shadow-sm">
  <span className="text-lg font-semibold text-foreground">Title</span>
</div>

// ❌ Wrong
<div style={{ display: 'flex', padding: '24px', backgroundColor: '#fff' }}>
  <span style={{ fontSize: '18px', fontWeight: 600 }}>Title</span>
</div>
```

### Responsive Design

**Use Tailwind responsive breakpoints:**
```tsx
// ✅ Correct
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>

// Breakpoints:
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

### Dark Mode

**Dark mode is supported via `.dark` class:**
- Colors automatically switch via CSS variables
- Test both light and dark modes
- Use semantic color tokens (they handle dark mode automatically)

## Icon System

### Icon Library: Lucide React

**IMPORTANT: Use Lucide React icons only. Do NOT add new icon packages.**

```tsx
// ✅ Correct
import { Search, User, Settings } from "lucide-react";

<Button>
  <Search className="w-4 h-4" />
  Search
</Button>

// ❌ Wrong
import { FaSearch } from "react-icons/fa"; // Don't use other icon libraries
```

**Icon Sizing:**
- Default: `w-4 h-4` (16px)
- Small: `w-3 h-3` (12px)
- Large: `w-5 h-5` (20px)
- Extra Large: `w-6 h-6` (24px)

**Icon Usage in Buttons:**
```tsx
// Button component handles icon sizing automatically
<Button>
  <Search /> {/* Automatically sized */}
  Search
</Button>
```

## Asset Management

### Static Assets

**Location:** `public/` directory
- Static images, SVGs, favicons
- Reference via `/filename.ext` (no `/public/` prefix)

```tsx
// ✅ Correct
<img src="/logo.svg" alt="Logo" />
<Image src="/hero-image.jpg" alt="Hero" />

// ❌ Wrong
<img src="/public/logo.svg" />
```

### User-Uploaded Assets

**Storage:** Supabase Storage
- Buckets: `resumes`, `cover-letters`, `portfolios`, `certificates`, `documents`, `avatars`, `company-logos`
- Access via Supabase Storage URLs
- Use Next.js `Image` component for optimization

```tsx
import Image from "next/image";

<Image
  src={supabaseUrl}
  alt="User avatar"
  width={200}
  height={200}
  className="rounded-full"
/>
```

### Figma Assets

**IMPORTANT: Use Figma MCP server's localhost asset URLs directly.**

```tsx
// ✅ Correct - Use localhost URL from Figma MCP
<img src="http://localhost:3001/assets/icon.svg" alt="Icon" />

// ❌ Wrong - Don't download and store locally unless necessary
// ❌ Wrong - Don't create placeholders if localhost source exists
```

## Import Conventions

### Path Aliases

**Use TypeScript path aliases:**
```tsx
// ✅ Correct
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// ❌ Wrong
import { Button } from "../../components/ui/button";
```

**Available aliases:**
- `@/components` → `components/`
- `@/lib` → `lib/`
- `@/components/ui` → `components/ui/`
- `@/hooks` → `hooks/`

### Import Order

```tsx
// 1. React/Next.js
import { useState } from 'react';
import Image from 'next/image';

// 2. Third-party libraries
import { clsx } from 'clsx';

// 3. Internal utilities
import { cn } from '@/lib/utils';

// 4. Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 5. Types
import type { ComponentProps } from '@/types';
```

## Code Quality Standards

### TypeScript

**Always use TypeScript:**
```tsx
// ✅ Correct
interface Props {
  title: string;
  count?: number;
}

export function Component({ title, count = 0 }: Props) {
  return <div>{title}: {count}</div>;
}

// ❌ Wrong
export function Component({ title, count }) {
  return <div>{title}: {count}</div>;
}
```

### Component Documentation

**Add JSDoc comments for exported components:**
```tsx
/**
 * Displays a job card with company information and application button.
 * 
 * @param job - The job object containing title, company, location, etc.
 * @param onApply - Callback function when user clicks apply
 */
export function JobCard({ job, onApply }: JobCardProps) {
  // ...
}
```

### Accessibility

**Follow WCAG guidelines:**
- Use semantic HTML elements
- Add `aria-label` for icon-only buttons
- Ensure keyboard navigation works
- Maintain proper color contrast
- Use proper heading hierarchy (h1 → h2 → h3)

```tsx
// ✅ Correct
<button aria-label="Close dialog">
  <X className="w-4 h-4" />
</button>

// ❌ Wrong
<div onClick={handleClose}>
  <X />
</div>
```

## Figma Translation Guidelines

### Converting Figma Output

**Figma MCP typically outputs React + Tailwind. Translate to project conventions:**

1. **Replace Tailwind classes** with project's design tokens:
   ```tsx
   // Figma output
   <div className="bg-blue-500 text-white">
   
   // Project convention
   <div className="bg-primary text-primary-foreground">
   ```

2. **Use existing components:**
   ```tsx
   // Figma output
   <button className="px-4 py-2 bg-primary rounded-md">
   
   // Project convention
   <Button variant="default" size="default">
   ```

3. **Map Figma spacing to Tailwind scale:**
   - Figma: 8px → Tailwind: `space-2` or `p-2`
   - Figma: 16px → Tailwind: `space-4` or `p-4`
   - Figma: 24px → Tailwind: `space-6` or `p-6`

4. **Use project's border radius tokens:**
   ```tsx
   // Figma: 10px border radius
   <div className="rounded-lg" /> // Uses --radius-lg
   ```

### Handling Design Tokens

**When Figma tokens differ from project tokens:**
- Prefer project tokens for consistency
- Adjust spacing/sizing minimally to match visuals
- Document deviations in code comments if necessary

```tsx
// If Figma uses #3b82f6 but project uses #1993e5
// Use project token but note the difference
<div className="bg-primary"> {/* Uses #1993e5, not Figma's blue */}
  {/* Note: Design uses #3b82f6, but we use project primary for consistency */}
</div>
```

## Validation Checklist

**Before marking implementation complete:**

- [ ] Layout matches Figma (spacing, alignment, sizing)
- [ ] Typography matches (font, size, weight, line height)
- [ ] Colors match exactly (using project tokens)
- [ ] Interactive states work (hover, active, disabled, focus)
- [ ] Responsive behavior follows Figma constraints
- [ ] Assets render correctly (images, icons, SVGs)
- [ ] Accessibility standards met (WCAG AA)
- [ ] Dark mode works correctly
- [ ] Component reuses existing UI primitives where possible
- [ ] TypeScript types are properly defined
- [ ] Code follows project conventions

## Common Patterns

### Card Component
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Button Variants
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

### Form Inputs
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter email" />
</div>
```

## Additional Resources

- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Figma MCP Server Documentation](https://developers.figma.com/docs/figma-mcp-server/)
