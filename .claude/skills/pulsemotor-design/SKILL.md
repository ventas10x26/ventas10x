---
name: pulsemotor-design
description: Use when adding, restyling, or reviewing UI in the Pulse Motor product (src/app/pulse/**, src/components/pulse/**) to keep the dark "automotive AI cockpit" visual design system consistent — color tokens, typography, buttons, cards, badges, glow/glassmorphism effects, and the WhatsApp-mockup conventions. Read this before writing new inline styles for pulsemotor.co pages.
---

# Pulse Motor design system

Pulse Motor (`pulsemotor.co`) uses a dark, premium, automotive-AI theme:
near-black navy background, glassy translucent surfaces, and a
blue → emerald → purple neon gradient as the single recurring accent.
It was introduced across `src/app/pulse/page.tsx`,
`src/components/pulse/SegmentSelector.tsx`, and
`src/components/pulse/PulseContactModal.tsx` in one pass — treat those
three files as the canonical implementation. This skill documents the
system so new Pulse Motor UI stays visually consistent with them
instead of drifting back toward the old light/monochrome theme.

Ventas10x (`ventas10x.co`, everything outside `src/app/pulse/**`) is a
**separate product with its own visual identity** — do not apply this
theme there.

## How to use this skill

1. Read `references/tokens.md` for the exact color/typography/shadow
   values before writing new styles. Don't invent new hex values for
   things this file already defines (backgrounds, text tiers, borders,
   the gradient, status colors) — reuse the token.
2. Open `assets/reference-page.html` in a browser (or read it) to see
   the tokens applied to real components — buttons, cards, badges,
   inputs, the cube-face swatches, and the WhatsApp-style chat bubble.
   Copy patterns from there rather than freehanding new component
   styles.
3. Styling in this codebase is plain inline `style={{}}` objects plus a
   single `<style>` block per page (no CSS modules, no Tailwind here).
   Match that pattern: reusable classes (`.pm-btn`, `.card`, `.pm-input`)
   live in the page's `<style>` tag; one-off layout goes inline.

## Non-negotiables

- **Background**: never plain white/light gray. Base is `--bg` (near
  black navy), with `--surface` translucent-white panels on top —
  everything is layered glass over dark, not flat color blocks.
- **Text**: three tiers only — `--text` (primary), `--text-dim`
  (secondary/body), `--text-faint` (captions/fine print). Don't reach
  for arbitrary grays like `#64748b` or `#94a3b8` (those are the old
  light-theme tokens and read as low-contrast mistakes on this bg).
  See `references/tokens.md` if you find yourself typing a raw gray hex.
- **Accent = the gradient, not a single color**: `--grad` (blue →
  emerald → purple) is used for headline emphasis (`gradText`), the
  primary CTA button, and glow effects. Individual accent hues
  (`--blue`, `--green`, `--purple`) are for smaller things — icon
  chips, borders, status dots — not big fills.
  Emerald = growth/action/"lo hacemos por vos". Blue/sky = speed/tech
  (30 seg response, WhatsApp/QR). Keep that mapping when choosing
  which accent a new element gets.
- **WhatsApp mockups keep WhatsApp's own colors**, regardless of page
  theme: `#075e54`/`#005c4b` (teal chrome), `#e5ddd5` (wallpaper),
  `#dcf8c6` (outgoing bubble), `#fff` (incoming bubble), `#25d366`
  (brand green). These are deliberately NOT theme tokens — a WhatsApp
  screenshot mockup should look like WhatsApp, not like the page around
  it. Only the mockup's outer frame/container follows the page theme.
- **Radius scale**: `999px` pills/badges, `8–10px` buttons and inputs,
  `12–16px` small cards, `20px` large panels, `24px` the pricing card.
  Don't introduce a new radius value ad hoc — pick the nearest one from
  this scale.
- **Motion is subtle and slow** (2.5–16s ease loops: `navGlow`,
  `glowDrift`, `floatPhone`, `pricingGlow`, `pulse`, `blinkSignal`).
  Nothing should flash or loop faster than ~1s except the WhatsApp
  typing dots (`waBounce`), which intentionally mimic a real chat app.

## When something doesn't fit

If a new component genuinely needs a color/value not covered here,
add it to `references/tokens.md` in the same pass (as a new named
token, not a one-off inline hex) so the system stays documented and
the next change can reuse it.
