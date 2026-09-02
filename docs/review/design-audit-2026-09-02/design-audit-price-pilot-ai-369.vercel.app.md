# Design Audit: PricePilot AI
**Target**: https://price-pilot-ai-369.vercel.app/
**Date**: 2026-09-02

## Phase 1: First Impression
The site communicates **B2B technical competence and algorithmic sophistication.**
I notice **a deep-dark theme with heavily stacked cards and prominent gradient text.**
The first 3 things my eye goes to are: **[1] the gradient headline "Dynamic Pricing. Engineered for Profit.", [2] the "Start Optimizing Now" button, [3] the floating feature cards below the fold.**
If I had to describe this in one word: **Developer-first.**

*Classifier:* **HYBRID** (Marketing page with embedded App UI elements like the simulator).

## Phase 2: Inferred Design System
* **Fonts**: `Inter`, `Plus Jakarta Sans`, `ui-monospace`.
* **Colors**: 51 distinct parsed colors. Highly fragmented palette masking as a cohesive dark theme. Heavily relies on hard-coded `oklch` and `oklab` opacity variations rather than a disciplined token system. The neutral palette leans extremely cool (deep blues/purples).
* **Typography**: H1 jumps from 60px/800 down to 36px/800 H2s. Line-heights are tight. Heading scale appears to lack structural discipline outside the hero.

## Litmus Checks
1. Brand/product unmistakable in first screen? **YES**
2. One strong visual anchor present? **YES** (The gradient H1)
3. Page understandable by scanning headlines only? **YES**
4. Each section has one job? **YES**
5. Are cards actually necessary? **NO** (Heavy reliance on decorative cards)
6. Does motion improve hierarchy or atmosphere? **NO** (Excessive `transition: all` rules across the site)
7. Would design feel premium with all decorative shadows removed? **NO** (Structure relies on borders and backgrounds, not spacing rhythm)

## Design Score: C
**AI Slop Score: C**

*Reasoning*: The site is highly functional but deeply relies on generic "AI startup" tropes. There's a 3-column feature grid, excessive use of glowing cards as layout instead of layout, uniform bubbly radii, and purple/indigo gradients. The frontend feels like a template populated with good data rather than an intentional brand.

## Findings by Category

### AI Slop & Generic Patterns
* **High**: Purple/indigo gradient backgrounds and text fills dominate the visual language (e.g., the H1 and feature icons), firmly placing it in the 2024-2026 generic AI aesthetic.
* **High**: The "3-column feature grid" anti-pattern is present on the homepage.
* **Medium**: Default system-ui stacks (`Inter, system-ui, -apple-system`) are used as the primary display font. "I gave up on typography" signal.

### Accessibility (Web Interface Guidelines)
* **High**: 16 interactive elements have touch targets smaller than 44x44px. Critical hits: `Toggle Theme` button (34x34), `Docs`/`FAQ`/`About` header links (20px tall), simulator preset buttons (`Max Vol` 23px tall).
* **High**: The range slider input lacks an `aria-label`.
* **High**: Missing main/nav landmarks on several pages (`/login` and `/register` have none). Skip links are missing entirely across the site.
* **Medium**: Form inputs on `/login` and `/register` lack proper `<label>` associations (the text labels exist but `htmlFor` attributes are empty).

### Visual Hierarchy & Composition
* **High**: Heavy reliance on cards. The UI is built out of stacked cards rather than true layout.

### Interaction States & Forms
* **High**: Focus states are generic browser defaults (`outline: rgb(16, 16, 16) auto 1px` in dark mode, which is nearly invisible). The Web Interface Guidelines require `focus-visible:ring-*` or equivalent contrast.
* **High**: The `/login` failure state is announced via `aria-live="polite"` ("Login failed") but no inline validation message is attached to the inputs (`aria-invalid` is unset), violating the guideline to put errors inline next to fields.

### Motion & Performance
* **High**: **420 elements on the homepage use `transition: all`.** This is a direct violation of Web Interface Guidelines ("Never `transition: all`—list properties explicitly") and wrecks rendering performance.

### Responsive Design
* **Medium**: Minor horizontal scroll overflow (18px) detected on the `/demo` page at 375px width, caused by the pricing preset buttons container (`flex items-center gap-4`).
* **High**: Massive horizontal overflow (1100px fixed width element on a 375px screen) on the homepage. A decorative gradient background (`w-[1100px] h-[550px]`) is bleeding out of the viewport.

## Next Steps / Fixes
1. **Remove `transition: all` globally.** Replace with explicit `transition-colors`, `transition-transform`, or `transition-opacity`.
2. **Fix mobile overflow.** Add `overflow-x-hidden` to the root layout container or `max-w-full` to the oversized decorative gradients. Fix the horizontal scroll on the `/demo` preset buttons (likely needs `flex-wrap` or horizontal scrolling `overflow-x-auto`).
3. **Fix touch targets.** Increase padding on header links and simulator buttons to hit the 44px minimum.
4. **Implement proper focus rings.** Add `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none` (or similar Tailwind 4 variants) to all interactive elements.
5. **Connect labels.** Fix the `htmlFor` properties on `/login` and `/register` forms.
6. **Add `aria-label`** to the slider inputs.