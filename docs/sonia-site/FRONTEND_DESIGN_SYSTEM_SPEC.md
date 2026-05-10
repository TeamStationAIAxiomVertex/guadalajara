# Front End Design System Spec

## Sonia McRorey Flat Elegant Corporate Site

This document adds the missing front end and top design discipline for the Sonia McRorey Guadalajara rebuild.

The site must become a flat, elegant, corporate, editorial landing page.

Not a brochure dump.
Not a semantic map.
Not a beige coaching template.
Not a SaaS dashboard.
Not a fashion influencer page.

---

# 1. Design standard

The target visual system is:

Flat corporate elegance.

Meaning:

- quiet luxury
- clean executive layout
- strong typography hierarchy
- low visual noise
- structured whitespace
- sharp content blocks
- soft editorial rhythm
- premium without gold
- feminine without influencer styling
- professional without looking cold

The page should feel like an executive advisor in Guadalajara, not a generic coaching funnel.

---

# 2. Layout discipline

Use a strict page grid.

Desktop:

- max page width: 1180px to 1240px
- section padding top/bottom: 88px to 120px
- hero min height: 78vh max
- hero grid: 52 percent text / 48 percent image
- content text width: 44ch to 52ch
- card copy width: controlled by card container

Tablet:

- collapse to one column earlier
- image below text or beside only when readable

Mobile:

- one column only
- no side by side hero
- no text over images
- buttons full width only when needed

---

# 3. Typography system

Use exactly two font roles.

## Display serif

Use only for:

- H1
- H2
- selected editorial pull lines

Good options:

- Cormorant Garamond
- Fraunces
- Playfair Display
- Libre Baskerville

Do not use serif inside normal paragraphs.

## Body sans

Use for:

- navigation
- body copy
- cards
- forms
- buttons
- captions
- service text

Good options:

- Inter
- Manrope
- Neue Haas Grotesk style equivalent
- Avenir style equivalent

## Required sizes

Desktop:

- H1: clamp(52px, 6vw, 84px)
- H2: clamp(36px, 4vw, 56px)
- H3: 22px to 28px
- body: 16px to 18px
- small: 13px to 14px
- button: 13px to 14px uppercase or semibold

Mobile:

- H1: 42px to 52px
- H2: 32px to 40px
- body: 16px

## Line height

- H1: 0.95 to 1.05
- H2: 1.05 to 1.15
- body: 1.55 to 1.7
- card body: 1.5 to 1.6

## Typography failures to avoid

- body font too large
- paragraph font too gray
- paragraph line length too long
- all sections having same visual weight
- too many headings competing
- serif used everywhere
- thin font weights that reduce readability

---

# 4. Color system

Use a muted, cool, corporate feminine palette.

Approved roles:

- background: off white
- surface: very light lavender gray
- surface alt: pale gray lavender
- text primary: charcoal
- text secondary: cool gray
- accent: muted plum
- accent soft: pale lavender
- border: low contrast gray lavender

Do not use:

- beige dominant palette
- tan UI
- gold accents
- warm cream luxury
- orange brown neutrals
- spa palette
- influencer palette

Use color for hierarchy, not decoration.

---

# 5. Component system

## Hero

Hero must be calm and direct.

Structure:

- eyebrow
- H1
- two short text blocks
- anchor line
- CTA row
- Sonia real image

Do not include:

- green alert boxes
- 5 paragraph hero
- generic executive duo image
- overlay text on image
- too many badges
- giant semantic keyword strips

## Cards

Cards must be flat and elegant.

Use:

- subtle background
- thin border
- generous padding
- no heavy shadow
- no dashboard look
- no icon overload

Card padding:

- desktop: 28px to 36px
- mobile: 22px to 26px

Card radius:

- 14px to 22px

Avoid:

- heavy drop shadows
- bright borders
- crowded icons
- cards taller than needed
- paragraph boxes everywhere

## Buttons

Primary button:

- charcoal or muted plum background
- off white text
- clean rectangular shape
- subtle radius
- no gradient

Secondary button:

- transparent or light surface
- border
- charcoal text

No gold buttons.
No beige buttons.
No loud CTA colors.

## Navigation

Navigation should be calm and thin.

- logo left
- links center or right
- CTA right
- sticky optional
- no heavy nav background
- avoid cramped links

---

# 6. Content presentation rules

This site must use block segmentation.

No long paragraphs.

No article dumps.

No visible SEO taxonomy.

No cluster sections.

Every section should have:

- one small eyebrow or label
- one strong heading
- one short intro max
- cards or short blocks

Paragraph limits:

- hero body: max 2 visual lines
- section intro: max 3 visual lines
- card copy: max 35 words
- about section: max 130 words
- testimonial excerpts: max 70 words

If more explanation is needed, move it to a subpage.

---

# 7. Image art direction

Sonia is the primary trust anchor.

Hero image must show Sonia, not anonymous generated executives.

Image style:

- real
- editorial
- professional
- calm
- human
- Guadalajara executive environment
- muted palette
- no heavy retouching

Do not use:

- AI looking executive faces in hero
- generic couple executive hero
- cream room stock image as primary identity
- fashion shoot exaggeration
- spa consultant visuals
- gold luxury backdrops

Image treatment:

- simple crop
- subtle border or frame
- no overlay text
- no fake caption blocks covering image
- object fit cover
- controlled aspect ratio

Recommended hero image aspect:

- 4:5 portrait
- or 3:4 editorial vertical

---

# 8. Homepage structure design

Final page sections:

1. Hero
2. Problem recognition
3. Services
4. For whom
5. About Sonia
6. Testimonials
7. Publication preview
8. FAQ
9. Contact CTA

Nothing else on homepage.

Remove:

- Biblioteca editorial mega section
- Cluster sections
- article taxonomy lists
- public semantic maps
- overlong service descriptions
- duplicate publication blocks

---

# 9. CSS implementation guidance

Use design tokens.

Example token names:

```css
:root {
  --color-bg: #f7f3f7;
  --color-surface: #eee7ef;
  --color-surface-soft: #faf8fa;
  --color-text: #2b2530;
  --color-muted: #756f7a;
  --color-accent: #7b5588;
  --color-border: #ded3df;

  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Inter', system-ui, sans-serif;

  --container: 1200px;
  --section-y: clamp(72px, 9vw, 120px);
  --radius-card: 18px;
}
```

Adjust hex values to match the existing brand palette if current repo has established variables.

Do not introduce beige or gold tokens.

---

# 10. Front end quality gates

Before finalizing, verify:

- H1 visible immediately
- Sonia visible above fold
- hero text under 140 words
- no paragraph wall
- no body text larger than 18px desktop
- no body text smaller than 16px mobile
- no text over images
- no generated executive duo as hero
- no beige or gold drift
- no cluster labels visible
- no article archive dump on homepage
- no green alert box
- clean section rhythm
- enough whitespace between sections
- mobile layout readable without horizontal scroll

---

# 11. Codex execution rule

Codex must act like a senior front end designer and design systems engineer.

It must prioritize:

1. readability
2. visual hierarchy
3. brand fidelity
4. section rhythm
5. image authenticity
6. conversion clarity
7. SEO only after UX is stable

Do not allow SEO to make the page ugly.

Do not allow source corpus volume to become homepage volume.

Do not expose internal LLM reasoning or taxonomy to users.

---

# 12. Final visual target

The finished page should feel:

- flat
- elegant
- corporate
- editorial
- premium
- calm
- human
- readable
- Sonia centered

The user should understand the page in five seconds.

The page must stop looking like an AI system dumped every available concept into one screen.