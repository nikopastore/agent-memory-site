# OG / social-preview image generation prompt

GitHub social preview = 1280×640 PNG/JPG up to 1 MB. Shows on every Twitter/X, Slack, LinkedIn, Discord, HN, and iMessage link to the repo.

Below is a polished prompt to paste into any text-to-image model (Midjourney, ChatGPT image gen, FLUX, Imagen, etc.). The prompt is split into three parts: **subject**, **technical constraints**, **negative prompt**. Keep all three — most models honor "do not" instructions strongly when stated explicitly.

---

## Recommended primary prompt

> Editorial-style cover illustration for an open-source developer tool called **agent-memory-site**. The tool compiles a Markdown knowledge vault into a retrieval-ready, agent-readable bundle.
>
> **Subject:** an abstract, isometric data-flow diagram in a 16:8 wide composition. On the left, a stack of stylized Markdown documents (suggested by paper-like rectangles with faint lines of text) glowing softly. A diagonal beam of light flows from the documents through a faceted geometric prism in the center — the prism splits the beam into three differently-colored streams. The streams flow out to the right, each ending in a small terminal-window icon, a JSON document icon, and a connected-nodes graph icon respectively. Thin grid lines suggest a technical schematic underneath.
>
> **Mood:** calm, technical, infrastructure-grade — NOT AI hype. Think Stripe documentation cover, not OpenAI marketing splash. Confident, restrained, premium.
>
> **Color palette:**
> - background: deep navy #0b1020 → graphite #121a33 vertical gradient
> - primary accents: cool electric cyan #8bd3ff and indigo #1d4ed8
> - highlights: subtle warm cream #fef7e6 only on the light beam, never as fill
> - **no purples, no magentas, no neon green**
>
> **Composition:** wide aspect (1280×640), strong horizontal axis. Negative space on the left half and dead-center; subject occupies roughly the lower-right two-thirds. Leave the **top-left third blank** so the repo name overlay reads cleanly when GitHub composites it.
>
> **Style references (pick the one your model handles best):** clean isometric vector art à la Stripe Press, Mariken Heitman editorial illustration, Sebastian Lo cover art, Anthropic Claude documentation banners. Flat-shaded with very subtle gradients. Crisp 1-2px outlines on key shapes. NO photorealism.
>
> **Lighting:** single soft directional light from upper-left, gentle bloom around the prism. No lens flares. No god rays.
>
> **Resolution:** 1280×640, sharp at native resolution, no upscaling artifacts. PNG with full alpha if possible.

---

## Negative prompt (paste verbatim into any model that accepts one)

```
text, words, letters, typography, watermark, signature, logo, brand mark,
robot, android, humanoid, brain, neural network mesh, glowing brain,
cybernetic eye, circuit board cliche, binary code rain, matrix code,
hands, faces, people, characters, mascots,
gears, cogs, machinery, mechanical parts,
clouds, sky, sunset, nature, plants, trees, water, ocean,
3D render, photorealistic, photograph, raytraced, octane render,
cyberpunk, neon, blade runner, vaporwave, synthwave, retrowave,
purple gradient, magenta, hot pink, fuchsia, lime green,
busy composition, cluttered, maximalist, baroque,
NFT aesthetic, generic AI art, ChatGPT default style, midjourney v5 style
```

---

## Alternative subject directions (pick one if the prism doesn't land)

1. **Library / archive metaphor.** A wall of glass-fronted catalog drawers seen from a slight isometric angle. Each drawer is labelled with a tiny different category icon (project / decision / procedure / handoff). One drawer is open, emitting a thin beam of light that fans out into three small floating windows: a webpage, a JSON document, a terminal cursor. Same palette and constraints.

2. **Crystalline data lattice.** A floating geometric lattice (octahedral or dodecahedral) made of faintly-glowing thin lines, with a few "filled" facets glowing in cyan. Subtle particles drift away from the lattice toward the right edge. Reads as "knowledge graph" without being a literal one.

3. **The compile step.** A wide horizontal pipeline. Left side: messy stack of paper documents tied with twine. Middle: a clean geometric processing block with subtle iridescence. Right side: three stacked artifact cards (web page, JSON file, terminal window) levitating above a thin baseline. Convey transformation from messy → ordered.

---

## Output checklist

After your model returns the image, verify:

- [ ] Aspect ratio is 1280×640 (or 16:8). Crop/extend if not.
- [ ] **No text or logos** anywhere — GitHub overlays the repo name itself.
- [ ] Top-left third is clean enough for the GitHub repo-name overlay to be readable.
- [ ] No accidental human figures, hands, or faces (image models love sneaking these in).
- [ ] Palette stays in the cool navy + cyan + indigo range.
- [ ] Saves under 1 MB as PNG (or JPG at ≥ 85 quality).

## Where to upload

`https://github.com/nikopastore/agent-memory-site/settings` → scroll to **Social preview** → **Edit** → upload.

GitHub takes ~5 minutes to propagate to Twitter card previews. Test with `https://cards-dev.twitter.com/validator`.
