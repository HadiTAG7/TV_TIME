---
name: Cinematic Core
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d0c6ab'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#999077'
  outline-variant: '#4d4732'
  surface-tint: '#e9c400'
  primary: '#fff6df'
  on-primary: '#3a3000'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#705d00'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#f4f6ff'
  on-tertiary: '#2d3137'
  tertiary-container: '#d7dae3'
  on-tertiary-container: '#5b5f67'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe16d'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1b1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#dfe2eb'
  tertiary-fixed-dim: '#c3c6cf'
  on-tertiary-fixed: '#181c22'
  on-tertiary-fixed-variant: '#43474e'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for an immersive, cinema-first experience tailored for enthusiasts who track and discover media. It prioritizes content-rich interfaces while maintaining a premium, "dark-room" atmosphere that mimics the experience of a theater. 

The aesthetic is **Modern Glassmorphism** layered over a **Minimalist** foundation. It utilizes deep blacks and high-transparency overlays to create a sense of depth and focus. The emotional response is one of sophistication and excitement, ensuring that the vibrant artwork of TV shows and movies remains the focal point while the interface provides a professional, high-utility framework.

## Colors

The palette is anchored by a "Midnight Navy" foundation to prevent the visual fatigue associated with pure black, while maintaining high contrast for readability.

- **Backgrounds:** The primary app canvas uses `#0D1117`. 
- **Surfaces:** Elevated containers and cards use `#1E1E1E`.
- **Accent:** A vibrant "Golden Cinema" yellow (`#FFD700`) is reserved strictly for primary calls to action, progress bars, and critical highlights (like star ratings).
- **Text:** High-contrast white is used for titles, while a muted grey is applied to metadata and descriptions to maintain visual hierarchy.

## Typography

This design system uses **Inter** for all roles to achieve a systematic, clean, and highly legible interface. The type scale is aggressive in its contrast between headlines and body text to help users navigate large amounts of media data.

- **Headlines:** Large, bold, and tightly spaced for an editorial feel.
- **Labels:** Uppercase with increased letter-spacing for category tags and metadata headers.
- **Body:** Optimized for readability on dark backgrounds with generous line-heights.

## Layout & Spacing

The design system employs a **Fluid Grid** model with a 4px baseline rhythm. 

- **Mobile:** A 4-column grid with 16px margins. Content is primarily stacked vertically, utilizing horizontal scrolling carousels for "Continue Watching" or "Trending" lists.
- **Desktop:** A 12-column grid. Side navigation is fixed, while content expands fluidly up to a 1440px max-width.
- **Spacing Logic:** Use `md` (16px) for standard padding within cards and `lg` (24px) for spacing between distinct content sections.

## Elevation & Depth

Depth is communicated through **Tonal Layering** and **Glassmorphism**, rather than traditional heavy shadows.

- **Level 0 (Background):** `#0D1117` - The furthest back layer.
- **Level 1 (Cards/Surfaces):** `#1E1E1E` - Standard surface for content modules.
- **Level 2 (Overlays/Modals):** Semi-transparent surfaces (80% opacity) with a 20px Backdrop Blur. This creates a "frosted glass" effect that allows the underlying show posters to glow through.
- **Outlines:** All cards and buttons feature a subtle 1px border (`rgba(255, 255, 255, 0.08)`) to define edges in the dark environment.

## Shapes

The shape language is consistently **Rounded**, reflecting the soft corners of modern TV hardware and cinematic screens.

- **Standard Elements:** Buttons and input fields use a `0.5rem` radius.
- **Media Containers:** Show posters and thumbnails use `1rem` (rounded-lg) to create a friendly, approachable feel for content.
- **Chips/Badges:** Utilize the `rounded-xl` (1.5rem) or full pill-shape for genre tags and status indicators (e.g., "Returning Series").

## Components

### Buttons
- **Primary:** Background `#FFD700`, Text `#0D1117`, Bold weight. High visibility for "Track," "Watch Now," or "Add to List."
- **Secondary:** Transparent background with a 1px white border at 20% opacity.
- **Ghost:** No background or border; used for secondary navigation or "Cancel" actions.

### Cards
- **Media Cards:** Feature a full-bleed image with a subtle gradient overlay at the bottom to ensure white text remains legible. 
- **Info Cards:** Use the Level 1 surface color. No shadow, but a 1px subtle border.

### Input Fields
- Dark-filled backgrounds (`#121212`) with a focus state that changes the border color to the accent yellow.

### Chips & Progress Bars
- **Episode Progress:** A thin bar at the bottom of a poster card. The background is `#333`, and the fill is `#FFD700`.
- **Genre Chips:** Small, low-contrast grey backgrounds with white text to avoid distracting from the main visuals.

### Navigation
- **Bottom Bar (Mobile):** Glassmorphic background (80% opacity) with 20px blur. Active icons are tinted in the accent yellow.