# Pulse Motor design tokens

Source of truth: the `:root` block inside the `<style>` tag in
`src/app/pulse/page.tsx`. If you change a value there, update it here
too (and vice versa).

## Color tokens

```css
:root {
  --blue:   #38bdf8;  /* sky-400 — tech / speed accent */
  --green:  #34d399;  /* emerald-400 — growth / action accent */
  --purple: #a855f7;  /* purple-500 — third gradient stop */
  --grad: linear-gradient(90deg, #38bdf8, #34d399, #a855f7);

  --bg:   #05070d;   /* page background, near-black navy */
  --bg-2: #080c16;   /* slightly lighter alt background, rarely used */

  --surface:   rgba(255,255,255,0.045); /* card / panel fill */
  --surface-2: rgba(255,255,255,0.07);  /* raised / hovered fill */

  --border:        rgba(255,255,255,0.09); /* default hairline */
  --border-strong: rgba(255,255,255,0.16); /* emphasized hairline */

  --text:       #f3f5fa; /* primary text (headlines, values, labels) */
  --text-dim:   #9aa3ba; /* secondary text (body copy, descriptions) */
  --text-faint: #5c637a; /* tertiary text (captions, fine print, disclaimers) */
}
```

### Status / semantic colors (not CSS vars — used as literals)

| Purpose                          | Value                | Notes |
|-----------------------------------|-----------------------|-------|
| Error / negative                  | `#fb7185`             | form errors, "cost of not having it" figures |
| Success text on emerald tint      | `#6ee7b7`             | pairs with `rgba(52,211,153,0.08–0.12)` bg + `rgba(52,211,153,0.3–0.4)` border |
| Info text on blue tint            | `#7dd3fc`             | pairs with `rgba(56,189,248,0.06–0.08)` bg + `rgba(56,189,248,0.25–0.3)` border |
| WhatsApp brand green              | `#25d366`             | status dots, WA icon fills — never themed |
| Button text on gradient           | `#04060b`             | near-black, for contrast on the light gradient fill |

### Cube-face accents (src/app/pulse/page.tsx CUBE_FACES)

Each face of the 3D "6 superpoderes" cube carries its own
`color` (background tint), `border`, and `textColor`, alternating
between the blue and emerald families:

```
sky:     color rgba(14,165,233,0.08–0.1)  border rgba(14,165,233,0.25–0.45) textColor #7dd3fc
emerald: color rgba(16,185,129,0.08–0.1)  border rgba(16,185,129,0.35–0.45) textColor #6ee7b7
wa-green:color rgba(37,211,102,0.08)      border rgba(37,211,102,0.35)      textColor #6ee7b7
```

Render faces with these three fields wired to `background`, `border`,
and the label `color` — don't hardcode a single neutral tone for all
faces (that was a bug fixed in the redesign: the per-face palette
existed in data but was previously ignored at render time).

## Typography

```js
const FONT      = "'Syne', sans-serif"     // headlines, buttons, numeric emphasis — weight 600–800
const FONT_BODY = "'DM Sans', sans-serif"  // body copy, inputs, everything else
```

Loaded via
`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:...')`
once per page (top of the `<style>` block).

Gradient text (headline emphasis, quote marks, stat values):

```js
const gradText = {
  backgroundImage: 'linear-gradient(90deg, #38bdf8, #34d399, #a855f7)',
  WebkitBackgroundClip: 'text', backgroundClip: 'text',
  color: 'transparent', WebkitTextFillColor: 'transparent',
}
```

## Radius scale

| Use                              | Radius |
|-----------------------------------|--------|
| Pills / badges / status chips     | `999px` |
| Buttons, inputs                   | `8–10px` |
| Icon chips (36–56px squares)      | `8–10px` |
| Small feature cards               | `12–16px` |
| Large panels (forms, QR block)    | `20px` |
| Pricing card                      | `24px` |
| Phone mockup outer bezel          | `40px` |

## Shadows / glow recipes

```css
/* Card hover */
box-shadow: 0 20px 44px rgba(0,0,0,0.45), 0 0 0 1px rgba(56,189,248,0.08);

/* Primary button (.pm-btn), resting */
box-shadow: 0 12px 30px rgba(56,189,248,0.18), 0 6px 18px rgba(168,85,247,0.14);
/* .pm-btn hover — same shape, stronger + shifted toward emerald */
box-shadow: 0 16px 40px rgba(56,189,248,0.28), 0 8px 22px rgba(52,211,153,0.2);

/* Pricing card ambient glow (animated, see pricingGlow keyframes) */
box-shadow: 0 0 30px rgba(56,189,248,0.12), 0 24px 60px rgba(0,0,0,0.45); /* -> */
box-shadow: 0 0 50px rgba(168,85,247,0.18), 0 24px 60px rgba(0,0,0,0.45);

/* Phone mockup */
box-shadow: 0 30px 70px rgba(0,0,0,0.6), 0 0 40px rgba(52,211,153,0.12);
```

## Key animations

| Name          | Duration | Used for |
|---------------|----------|----------|
| `navGlow`     | 2.6s     | "Lo hacemos por vos" nav button pulsing border-glow |
| `pulse`       | 2s       | live-status dots |
| `blinkSignal` | 2s       | "en línea" WhatsApp status dot |
| `glowDrift`   | 16s      | hero background radial-gradient orbs |
| `floatPhone`  | 5s       | hero phone mockup gentle float |
| `pricingGlow` | 4.5s     | pricing card ambient box-shadow color shift |
| `waBounce`    | 1.1s     | WhatsApp typing-indicator dots (intentionally faster — mimics the real app) |

## WhatsApp mockup palette (never themed — always these literals)

```
#075e54   header/chrome teal (contact header bar)
#005c4b   outgoing bubble (dark variant, used in small inline mockups)
#dcf8c6   outgoing bubble (light variant, used in the hero phone)
#e5ddd5   chat wallpaper background
#fff      incoming bubble
#25d366   brand green (status dots, icon fills)
#8c9199   timestamp gray inside bubbles
#1a1a2e   phone bezel
```
