"""
Python ports of the brand sketches from src/components/sketches.tsx.

Each function returns an SVG string. Use `render_to_png(svg, out_path,
size_px)` to rasterize via resvg.

The shapes are direct ports of the React components — same viewBox, same
strokes, same stroke widths. The only change is that color is passed in
as an arg (rather than read from `currentColor`) so we can flip palettes
between light and dark mode renderings.
"""

from __future__ import annotations

import resvg_py


def render_to_png(svg: str, out_path: str, width: int, height: int) -> None:
    """Rasterize an SVG string to PNG at the given pixel size."""
    png_bytes = resvg_py.svg_to_bytes(
        svg_string=svg, width=width, height=height,
    )
    with open(out_path, "wb") as f:
        f.write(bytes(png_bytes))


def _svg(viewbox: str, body: str, stroke: str, stroke_width: float = 2.2) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" '
        f'fill="none" stroke="{stroke}" stroke-width="{stroke_width}" '
        f'stroke-linecap="round" stroke-linejoin="round">{body}</svg>'
    )


# ─── Static mini car ──────────────────────────────────────────────────
def sketch_car_static(color: str) -> str:
    body = f'''
      <rect x="14" y="56" width="192" height="34" rx="12" />
      <rect x="52" y="24" width="116" height="34" rx="10" />
      <line x1="110" y1="24" x2="110" y2="58" />
      <line x1="80" y1="60" x2="80" y2="88" />
      <line x1="140" y1="60" x2="140" y2="88" />
      <circle cx="18" cy="66" r="3" fill="{color}" />
      <circle cx="202" cy="66" r="3" fill="{color}" />
      <g transform="translate(60 94)">
        <circle cx="0" cy="0" r="14" />
        <line x1="-10" y1="0" x2="10" y2="0" />
        <line x1="0" y1="-10" x2="0" y2="10" />
      </g>
      <g transform="translate(160 94)">
        <circle cx="0" cy="0" r="14" />
        <line x1="-10" y1="0" x2="10" y2="0" />
        <line x1="0" y1="-10" x2="0" y2="10" />
      </g>
    '''
    return _svg("0 0 220 110", body, color, stroke_width=5)


# ─── Document with paperclip + folded corner ──────────────────────────
def sketch_doc(color: str) -> str:
    body = f'''
      <path d="M28 16 L142 16 L172 46 L172 144 L28 144 Z" />
      <path d="M142 16 L142 46 L172 46" />
      <line x1="44" y1="62" x2="156" y2="62" />
      <line x1="44" y1="74" x2="142" y2="74" />
      <line x1="44" y1="86" x2="156" y2="86" />
      <line x1="44" y1="98" x2="132" y2="98" />
      <line x1="44" y1="110" x2="156" y2="110" />
      <line x1="44" y1="122" x2="120" y2="122" />
      <g transform="translate(30 8) rotate(-12)" fill="none">
        <path d="M0 0 L0 36 Q0 44, 8 44 L18 44 Q26 44, 26 36 L26 6 Q26 0, 20 0 L8 0 Q4 0, 4 4 L4 32" />
      </g>
      <path d="M150 102 L156 108 L168 96" stroke="{color}" stroke-width="2.4" opacity="0.85" />
    '''
    return _svg("0 0 200 156", body, color, stroke_width=2.2)


# ─── Magnifying glass over text lines ─────────────────────────────────
def sketch_loupe(color: str) -> str:
    body = f'''
      <path d="M16 30 L172 30 L172 142 L16 142 Z" opacity="0.6" />
      <line x1="32" y1="46" x2="156" y2="46" opacity="0.5" />
      <line x1="32" y1="60" x2="142" y2="60" opacity="0.5" />
      <line x1="32" y1="74" x2="156" y2="74" opacity="0.5" />
      <line x1="32" y1="88" x2="148" y2="88" opacity="0.5" />
      <line x1="32" y1="102" x2="156" y2="102" opacity="0.5" />
      <line x1="32" y1="116" x2="130" y2="116" opacity="0.5" />
      <circle cx="108" cy="82" r="38" />
      <line x1="138" y1="110" x2="178" y2="148" stroke-width="6" />
      <line x1="80" y1="74" x2="138" y2="74" stroke-width="3" />
      <line x1="80" y1="88" x2="124" y2="88" stroke-width="3" />
      <line x1="80" y1="100" x2="132" y2="100" stroke-width="3" />
      <circle cx="120" cy="88" r="9" stroke="{color}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.7" />
    '''
    return _svg("0 0 200 156", body, color, stroke_width=2.2)


# ─── Verdict sheet with checks + score badge + seal ───────────────────
def sketch_verdict(color: str, accent: str) -> str:
    body = f'''
      <path d="M22 14 L156 14 L178 36 L178 148 L22 148 Z" />
      <path d="M156 14 L156 36 L178 36" />
      <line x1="38" y1="38" x2="120" y2="38" stroke-width="3" />
      <line x1="38" y1="44" x2="98" y2="44" stroke-width="1.5" opacity="0.6" />
      <line x1="38" y1="64" x2="138" y2="64" opacity="0.5" />
      <path d="M150 60 L156 66 L168 54" stroke="{accent}" stroke-width="2.4" />
      <line x1="38" y1="80" x2="138" y2="80" opacity="0.5" />
      <path d="M150 76 L156 82 L168 70" stroke="{accent}" stroke-width="2.4" />
      <line x1="38" y1="96" x2="138" y2="96" opacity="0.5" />
      <path d="M150 90 L168 98 M168 90 L150 98" stroke="{color}" stroke-width="2.4" />
      <line x1="38" y1="112" x2="138" y2="112" opacity="0.5" />
      <path d="M150 108 L156 114 L168 102" stroke="{accent}" stroke-width="2.4" />
      <rect x="38" y="124" width="56" height="18" rx="3" />
      <text x="66" y="138" text-anchor="middle" font-family="monospace"
            font-size="12" font-weight="700" fill="{color}" stroke="none">SCORE 62</text>
      <g transform="translate(140 132) rotate(-8)">
        <circle cx="0" cy="0" r="14" stroke="{accent}" stroke-width="2" />
        <text x="0" y="3" text-anchor="middle" font-family="monospace"
              font-size="8" font-weight="700" fill="{accent}" stroke="none">RO·24</text>
      </g>
    '''
    return _svg("0 0 200 156", body, color, stroke_width=2.2)


# ─── Sedan in 3/4 view ────────────────────────────────────────────────
def sketch_sedan(color: str) -> str:
    body = f'''
      <path d="M28 144 Q40 110, 80 102 L120 96 Q138 92, 168 92 L210 96 Q244 100, 270 116 L298 130 Q308 136, 308 148 L308 162 L18 162 L18 146 Z" />
      <path d="M96 102 Q116 70, 150 68 L196 70 Q220 74, 232 102 Z" />
      <line x1="170" y1="68" x2="170" y2="102" />
      <line x1="132" y1="104" x2="132" y2="158" />
      <line x1="200" y1="104" x2="200" y2="160" />
      <line x1="232" y1="102" x2="252" y2="118" />
      <line x1="140" y1="124" x2="160" y2="122" />
      <line x1="206" y1="126" x2="222" y2="124" />
      <circle cx="298" cy="142" r="5" />
      <g><circle cx="84" cy="164" r="20" /><circle cx="84" cy="164" r="8" /><circle cx="84" cy="164" r="2" fill="{color}" /></g>
      <g><circle cx="244" cy="164" r="20" /><circle cx="244" cy="164" r="8" /><circle cx="244" cy="164" r="2" fill="{color}" /></g>
      <line x1="6" y1="186" x2="314" y2="186" stroke-dasharray="4 6" opacity="0.6" />
    '''
    return _svg("0 0 320 200", body, color, stroke_width=2.2)


# ─── Hatchback ────────────────────────────────────────────────────────
def sketch_hatchback(color: str) -> str:
    body = f'''
      <path d="M58 140 Q72 96, 116 90 L196 88 Q220 90, 234 100 L262 116 Q272 122, 272 138 L272 160 L52 160 L52 142 Z" />
      <path d="M104 90 Q120 56, 154 56 L218 56 Q230 60, 234 100 L234 100 Z" />
      <line x1="170" y1="56" x2="170" y2="90" />
      <line x1="138" y1="92" x2="138" y2="156" />
      <line x1="204" y1="92" x2="204" y2="158" />
      <line x1="146" y1="112" x2="166" y2="110" />
      <line x1="210" y1="114" x2="226" y2="112" />
      <circle cx="266" cy="124" r="5" />
      <rect x="54" y="100" width="6" height="18" />
      <g><circle cx="100" cy="164" r="20" /><circle cx="100" cy="164" r="8" /><circle cx="100" cy="164" r="2" fill="{color}" /></g>
      <g><circle cx="228" cy="164" r="20" /><circle cx="228" cy="164" r="8" /><circle cx="228" cy="164" r="2" fill="{color}" /></g>
      <line x1="6" y1="186" x2="314" y2="186" stroke-dasharray="4 6" opacity="0.6" />
    '''
    return _svg("0 0 320 200", body, color, stroke_width=2.2)


# ─── CarSmiley — 5-point rating face ──────────────────────────────────
def sketch_car_smiley(rating: int, color: str) -> str:
    """Direct port of src/components/car-smiley.tsx CarSmiley.

    rating: 1 = awful, 2 = bad, 3 = okay, 4 = good, 5 = delighted.
    """
    assert 1 <= rating <= 5
    # Shared parts (body + wheels + antenna + bonnet seam)
    base = f'''
      <line x1="50" y1="14" x2="50" y2="8" />
      <circle cx="50" cy="7" r="1.4" fill="{color}" stroke="none" />
      <path d="M14 32 Q14 18, 28 16 L72 16 Q86 18, 86 32 L86 78 L14 78 Z" />
      <line x1="14" y1="30" x2="86" y2="30" opacity="0.5" />
      <circle cx="22" cy="84" r="6" />
      <circle cx="22" cy="84" r="2" fill="{color}" stroke="none" />
      <circle cx="78" cy="84" r="6" />
      <circle cx="78" cy="84" r="2" fill="{color}" stroke="none" />
    '''
    if rating == 1:
        face = f'''
          <g stroke-width="1.8" opacity="0.6">
            <line x1="32" y1="10" x2="36" y2="4" />
            <line x1="42" y1="10" x2="44" y2="4" />
            <line x1="58" y1="10" x2="56" y2="4" />
            <line x1="68" y1="10" x2="64" y2="4" />
          </g>
          <line x1="22" y1="36" x2="38" y2="42" stroke-width="2.8" />
          <line x1="78" y1="36" x2="62" y2="42" stroke-width="2.8" />
          <path d="M26 46 L36 56" />
          <path d="M36 46 L26 56" />
          <path d="M64 46 L74 56" />
          <path d="M74 46 L64 56" />
          <path d="M30 70 Q50 58, 70 70" stroke-width="2.8" />
        '''
    elif rating == 2:
        face = '''
          <path d="M26 50 Q32 44, 38 50" />
          <path d="M62 50 Q68 44, 74 50" />
          <path d="M32 66 Q50 60, 68 66" />
        '''
    elif rating == 3:
        face = f'''
          <circle cx="32" cy="48" r="3" fill="{color}" stroke="none" />
          <circle cx="68" cy="48" r="3" fill="{color}" stroke="none" />
          <line x1="34" y1="64" x2="66" y2="64" stroke-width="2.6" />
        '''
    elif rating == 4:
        face = f'''
          <circle cx="32" cy="46" r="3" fill="{color}" stroke="none" />
          <circle cx="68" cy="46" r="3" fill="{color}" stroke="none" />
          <path d="M30 60 Q50 70, 70 60" stroke-width="2.6" />
        '''
    else:  # 5
        face = '''
          <g stroke-width="1.4" opacity="0.7">
            <line x1="18" y1="22" x2="22" y2="18" />
            <line x1="20" y1="18" x2="20" y2="14" />
            <line x1="78" y1="22" x2="82" y2="18" />
            <line x1="80" y1="18" x2="80" y2="14" />
          </g>
          <path d="M24 48 Q32 40, 40 48" />
          <path d="M60 48 Q68 40, 76 48" />
          <path d="M26 58 Q50 76, 74 58" stroke-width="2.6" />
        '''
    return _svg("0 0 100 100", base + face, color, stroke_width=2.6)


# ─── Thank-you car ────────────────────────────────────────────────────
def sketch_thank_you_car(color: str) -> str:
    """Direct port of src/components/car-smiley.tsx ThankYouCar."""
    body = f'''
      <g stroke-width="2.4">
        <path d="M 26 22 C 22 16, 14 18, 16 24 C 17 28, 26 34, 26 34 C 26 34, 35 28, 36 24 C 38 18, 30 16, 26 22 Z" />
        <path d="M 72 12 C 69 8, 63 9.5, 64.5 14 C 65.5 17, 72 22, 72 22 C 72 22, 78.5 17, 79.5 14 C 81 9.5, 75 8, 72 12 Z" />
      </g>
      <g stroke-width="1.4" opacity="0.7">
        <line x1="46" y1="14" x2="50" y2="18" />
        <line x1="50" y1="14" x2="46" y2="18" />
        <line x1="6" y1="36" x2="10" y2="32" />
        <line x1="8" y1="32" x2="8" y2="36" />
        <line x1="92" y1="32" x2="94" y2="28" />
        <line x1="93" y1="28" x2="93" y2="32" />
      </g>
      <line x1="50" y1="44" x2="50" y2="38" />
      <circle cx="50" cy="37" r="1.4" fill="{color}" stroke="none" />
      <path d="M14 62 Q14 48, 28 46 L72 46 Q86 48, 86 62 L86 108 L14 108 Z" />
      <line x1="14" y1="60" x2="86" y2="60" opacity="0.5" />
      <path d="M24 78 Q32 70, 40 78" />
      <path d="M60 78 Q68 70, 76 78" />
      <path d="M26 88 Q50 106, 74 88" stroke-width="2.6" />
      <circle cx="22" cy="114" r="6" />
      <circle cx="22" cy="114" r="2" fill="{color}" stroke="none" />
      <circle cx="78" cy="114" r="6" />
      <circle cx="78" cy="114" r="2" fill="{color}" stroke="none" />
    '''
    return _svg("0 0 100 120", body, color, stroke_width=2.6)


# ─── Envelope (for the CTA slide — "forward to") ─────────────────────
def sketch_envelope(color: str, accent: str) -> str:
    """Editorial ink-line envelope with a small RO·24 stamp top-right."""
    body = f'''
      <rect x="20" y="36" width="160" height="100" rx="4" />
      <path d="M 20 36 L 100 100 L 180 36" />
      <line x1="20" y1="136" x2="78" y2="92" opacity="0.4" />
      <line x1="180" y1="136" x2="122" y2="92" opacity="0.4" />
      <g transform="translate(160 28)">
        <rect x="-12" y="-10" width="24" height="20" rx="2" stroke="{accent}" stroke-width="1.6" />
        <text x="0" y="3" text-anchor="middle" font-family="monospace"
              font-size="6" font-weight="700" fill="{accent}" stroke="none">RO·24</text>
      </g>
    '''
    return _svg("0 0 200 160", body, color, stroke_width=2.4)


# ─── Mini report card (slide 6 — what you'll get) ─────────────────────
def sketch_minireport(color: str, accent: str) -> str:
    """A taller report card with five labelled rows + score badge.

    Each row has a sage check, a row title in plum, and a thin
    underline for visual weight. Reads as a real report at a glance.
    """
    rows = [
        ("COVERAGE",   "8/10"),
        ("GAPS",       "3 FOUND"),
        ("IDV",        "OK"),
        ("ADD-ONS",    "REVIEW"),
        ("RENEWAL",    "MAR ’26"),
    ]
    parts = []
    y = 60
    for title, status in rows:
        parts.append(
            f'<path d="M 28 {y} L 36 {y + 8} L 50 {y - 6}" '
            f'stroke="{accent}" stroke-width="2.4" />'
        )
        parts.append(
            f'<text x="64" y="{y + 5}" font-family="serif" font-style="italic" '
            f'font-size="13" font-weight="600" fill="{color}" stroke="none">{title}</text>'
        )
        parts.append(
            f'<text x="210" y="{y + 5}" text-anchor="end" font-family="monospace" '
            f'font-size="10" font-weight="700" fill="{accent}" stroke="none">{status}</text>'
        )
        parts.append(
            f'<line x1="28" y1="{y + 14}" x2="210" y2="{y + 14}" '
            f'opacity="0.25" stroke-width="1" />'
        )
        y += 28

    body = f'''
      <path d="M 16 16 L 196 16 L 224 44 L 224 244 L 16 244 Z" />
      <path d="M 196 16 L 196 44 L 224 44" />
      <text x="32" y="40" font-family="monospace" font-size="9" font-weight="700"
            fill="{accent}" stroke="none" letter-spacing="2">RIGHTOFFER REPORT</text>
      {''.join(parts)}
      <rect x="28" y="210" width="80" height="22" rx="3" />
      <text x="68" y="225" text-anchor="middle" font-family="monospace"
            font-size="12" font-weight="700" fill="{color}" stroke="none">SCORE 62</text>
      <g transform="translate(180 220) rotate(-8)">
        <circle cx="0" cy="0" r="16" stroke="{accent}" stroke-width="2" />
        <text x="0" y="4" text-anchor="middle" font-family="monospace"
              font-size="9" font-weight="700" fill="{accent}" stroke="none">RO·24</text>
      </g>
    '''
    return _svg("0 0 240 260", body, color, stroke_width=2.2)


# ─── Spotlight ring (used behind smileys on the 5-point slide) ────────
def sketch_spotlight(color: str) -> str:
    """Soft radial glow ring — sits behind a smiley to feel 'lit up'."""
    body = f'''
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stop-color="{color}" stop-opacity="0.30" />
          <stop offset="60%" stop-color="{color}" stop-opacity="0.08" />
          <stop offset="100%" stop-color="{color}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#g)" stroke="none" />
    '''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">{body}</svg>'


# ─── Motion-line strip (used as "road" under moving cars) ─────────────
def sketch_motion_strip(color: str, length: int = 600) -> str:
    """A short dashed road + a few speed lines behind the car.

    Renders as an SVG strip (length × ~50 px) that you place under or
    behind a car sketch for the 'in motion' feel.
    """
    body = f'''
      <line x1="0" y1="30" x2="{length}" y2="30"
            stroke="{color}" stroke-width="2" stroke-dasharray="14 10" opacity="0.55" />
      <g stroke="{color}" stroke-width="2.4" stroke-linecap="round" opacity="0.6">
        <line x1="6"  y1="10" x2="46" y2="10" />
        <line x1="2"  y1="20" x2="60" y2="20" />
        <line x1="10" y1="40" x2="40" y2="40" />
      </g>
    '''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {length} 50" fill="none">{body}</svg>'


# ─── SUV ──────────────────────────────────────────────────────────────
def sketch_suv(color: str) -> str:
    body = f'''
      <path d="M24 116 Q36 70, 86 64 L228 60 Q262 62, 280 78 L300 92 Q312 100, 312 116 L312 152 L18 152 L18 118 Z" />
      <path d="M88 64 Q96 28, 134 26 L222 26 Q252 28, 266 66 L266 66 Z" />
      <line x1="170" y1="26" x2="170" y2="66" />
      <line x1="98" y1="22" x2="252" y2="22" stroke-width="1.6" opacity="0.7" />
      <line x1="100" y1="22" x2="100" y2="26" stroke-width="1.2" opacity="0.7" />
      <line x1="250" y1="22" x2="250" y2="26" stroke-width="1.2" opacity="0.7" />
      <line x1="124" y1="68" x2="124" y2="148" />
      <line x1="216" y1="68" x2="216" y2="150" />
      <line x1="134" y1="98" x2="156" y2="96" />
      <line x1="222" y1="100" x2="244" y2="98" />
      <line x1="24" y1="138" x2="300" y2="138" stroke-dasharray="5 3" opacity="0.5" />
      <rect x="290" y="100" width="14" height="10" rx="1" />
      <circle cx="290" cy="86" r="5" />
      <g><circle cx="78" cy="156" r="28" /><circle cx="78" cy="156" r="11" /><circle cx="78" cy="156" r="2" fill="{color}" /></g>
      <g><circle cx="242" cy="156" r="28" /><circle cx="242" cy="156" r="11" /><circle cx="242" cy="156" r="2" fill="{color}" /></g>
      <line x1="6" y1="186" x2="314" y2="186" stroke-dasharray="4 6" opacity="0.6" />
    '''
    return _svg("0 0 320 200", body, color, stroke_width=2.2)
