"""
Motion variants of the carousel.

Produces three artefacts under ./motion/:

  1. cover.gif  — 4-second loop of the cover slide with the plum car
                  driving in from the left and parking. Good for use as
                  a LinkedIn video post or as a teaser GIF in messaging.
  2. cover.mp4  — Same animation as cover.gif but 60fps MP4. Crisper
                  on LinkedIn feed than the GIF.
  3. deck.mp4   — All 10 slides, ~3.5s each, with crossfades. The car-
                  bearing slides (1, 9, 10) get an animated car driving
                  in; everything else uses the static render. ~36s total.

The MP4s are h264 + yuv420p so LinkedIn previews them as native video.
"""

import os
from PIL import Image
import imageio.v3 as iio

import sketches as sk

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR  = os.path.join(HERE, "assets")
PREVIEWS    = os.path.join(HERE, "previews")
MOTION_DIR  = os.path.join(HERE, "motion")
os.makedirs(MOTION_DIR, exist_ok=True)

CANVAS = (1080, 1080)
FPS = 30

HEX_PLUM = "#c485c9"
HEX_SAGE = "#a8baa0"
HEX_TEXT = "#f3eef0"

# Background colour matches the static deck (warm near-black)
BG = (0x13, 0x10, 0x0f)


# ─── Helpers ──────────────────────────────────────────────────────────

def load_rgba(path):
    return Image.open(path).convert("RGBA")


def render_svg_rgba(svg, w, h):
    png = sk.resvg_py.svg_to_bytes(svg_string=svg, width=w, height=h)
    import io
    return Image.open(io.BytesIO(bytes(png))).convert("RGBA")


def ease_out_cubic(t: float) -> float:
    """t in [0,1] → cushioned arrival (fast in, slow stop)."""
    return 1 - (1 - t) ** 3


def composite_centered(base: Image.Image, overlay: Image.Image,
                       cx: int, cy: int) -> Image.Image:
    """Paste overlay centered at (cx, cy) into a copy of base."""
    out = base.copy()
    ox = cx - overlay.width // 2
    oy = cy - overlay.height // 2
    out.alpha_composite(overlay, (ox, oy))
    return out


def crossfade(a: Image.Image, b: Image.Image, frames: int):
    """Yield `frames` images crossfading from a → b."""
    for i in range(frames):
        t = (i + 1) / frames
        out = Image.blend(a, b, t)
        yield out


# ─── Cover scene ──────────────────────────────────────────────────────

def build_cover_base():
    """Cover slide minus the plum car. We composite the car at animated
    positions per frame.

    Easiest path: load the rendered cover PNG and paint out the car
    area with the BG colour. The car sits around y=63%-77% of canvas
    and centers horizontally, with width ~ 40% of canvas.

    We keep the motion strip though — it gives the "road" a presence
    even when the car is offscreen.
    """
    cover = load_rgba(os.path.join(PREVIEWS, "slide-01.png"))
    # Erase a generous rectangle where the car is, but NOT where the
    # motion strip + subline + wordmark live. Coordinates derived from
    # build.py: car sits at top=Inches(6.3), height ~ Inches(2.0).
    # At 1080×1080 (10.8" canvas → 100px/in), that's y 630-830.
    # Width ~ 4.0" wide centered → x 340-740.
    car_box = (320, 605, 760, 845)
    blanker = Image.new("RGBA", (car_box[2] - car_box[0],
                                 car_box[3] - car_box[1]), BG + (255,))
    cover.alpha_composite(blanker, (car_box[0], car_box[1]))
    return cover


def build_cover_frames(seconds: float = 4.0):
    """Generator of (rgba) frames for the cover animation."""
    base = build_cover_base()

    # The plum car overlay — same size we use on the static cover
    # (width 4" = 400px). The car PNG asset is 1200×600, so we resize.
    car_full = load_rgba(os.path.join(ASSETS_DIR, "car-plum.png"))
    car_w = 400
    car_h = round(car_full.height * (car_w / car_full.width))
    car = car_full.resize((car_w, car_h), Image.LANCZOS)

    # Final resting position (centered horizontally, top=630)
    final_cx = CANVAS[0] // 2
    final_cy = 630 + car_h // 2

    # Animation timeline:
    #   0.0–2.0s :  drive in from offscreen-left to final position (ease-out)
    #   2.0–4.0s :  hold
    n_total = int(seconds * FPS)
    drive_frames = int(2.0 * FPS)
    for i in range(n_total):
        if i < drive_frames:
            t = i / max(drive_frames - 1, 1)
            t = ease_out_cubic(t)
            start_cx = -car_w  # fully offscreen-left
            cx = round(start_cx + (final_cx - start_cx) * t)
        else:
            cx = final_cx
        frame = composite_centered(base, car, cx, final_cy)
        yield frame


def write_gif(frames, out_path, fps=15, optimise=True):
    """Save list of RGBA frames as an animated GIF (palettised)."""
    pil_frames = [f.convert("P", palette=Image.ADAPTIVE) for f in frames]
    duration_ms = round(1000 / fps)
    pil_frames[0].save(
        out_path,
        save_all=True,
        append_images=pil_frames[1:],
        optimize=optimise,
        duration=duration_ms,
        loop=0,
        disposal=2,
    )


def write_mp4(frames, out_path, fps=FPS):
    """Save list of RGBA frames as h264 yuv420p MP4."""
    # iio.imwrite expects RGB or RGBA arrays; ffmpeg under the hood
    # picks h264 for .mp4. yuv420p ensures LinkedIn-friendly previews.
    import numpy as np
    arrs = [np.asarray(f.convert("RGB")) for f in frames]
    iio.imwrite(
        out_path,
        arrs,
        fps=fps,
        codec="libx264",
        pixelformat="yuv420p",
        macro_block_size=1,  # accept non-multiple-of-16 dims (1080)
    )


# ─── Per-slide animated layers for the full deck ──────────────────────

def cover_seq():
    """4-second cover animation."""
    return list(build_cover_frames(seconds=4.0))


def static_hold(slide_n: int, seconds: float = 3.0):
    """Hold the static rendered slide for N seconds."""
    img = load_rgba(os.path.join(PREVIEWS, f"slide-{slide_n:02d}.png"))
    n = int(seconds * FPS)
    return [img] * n


def brewing_seq(seconds: float = 4.0):
    """Slide 9 — three cars race in from the right."""
    base = load_rgba(os.path.join(PREVIEWS, f"slide-{9:02d}.png"))
    # Blank out the car row to compose drivers on top
    # Cars sit at top=Inches(5.0)=500px, width=Inches(3.2)=320px each
    # plus left margins: sedan x=40, hatch x=380, suv x=720
    blank_box = (20, 480, 1060, 770)
    car_strip = Image.new("RGBA",
                          (blank_box[2] - blank_box[0],
                           blank_box[3] - blank_box[1]),
                          BG + (255,))
    base = base.copy()
    base.alpha_composite(car_strip, (blank_box[0], blank_box[1]))

    sedan = load_rgba(os.path.join(ASSETS_DIR, "sedan.png"))
    hatch = load_rgba(os.path.join(ASSETS_DIR, "hatchback.png"))
    suv   = load_rgba(os.path.join(ASSETS_DIR, "suv.png"))
    # Each car resized to ~320px wide (Inches(3.2) at 100ppi)
    target_w = 320
    def resize(im):
        h = round(im.height * (target_w / im.width))
        return im.resize((target_w, h), Image.LANCZOS)
    sedan, hatch, suv = resize(sedan), resize(hatch), resize(suv)

    final_y = 500 + sedan.height // 2
    finals = [
        (40  + target_w // 2,  final_y),  # sedan
        (380 + target_w // 2,  final_y),  # hatch
        (720 + target_w // 2,  final_y),  # suv
    ]
    cars = [sedan, hatch, suv]

    n_total = int(seconds * FPS)
    drive_frames = int(2.0 * FPS)
    stagger = int(0.25 * FPS)  # second car starts 0.25s after first, etc.
    out = []
    for i in range(n_total):
        frame = base.copy()
        for idx, car in enumerate(cars):
            local_i = i - idx * stagger
            if local_i < 0:
                cx = CANVAS[0] + car.width  # offscreen-right
            elif local_i < drive_frames:
                t = local_i / max(drive_frames - 1, 1)
                t = ease_out_cubic(t)
                start_cx = CANVAS[0] + car.width
                cx = round(start_cx + (finals[idx][0] - start_cx) * t)
            else:
                cx = finals[idx][0]
            ox = cx - car.width // 2
            oy = finals[idx][1] - car.height // 2
            frame.alpha_composite(car, (ox, oy))
        out.append(frame)
    return out


def cta_seq(seconds: float = 4.0):
    """Slide 10 — envelope-primary CTA.

    The slide now leads with an envelope sketch + plum email address.
    For motion: envelope flies in from above with a gentle settle, then
    the underline draws across left→right on a 0.4s sweep.
    """
    base_full = load_rgba(os.path.join(PREVIEWS, f"slide-{10:02d}.png"))

    # Erase envelope + underline area so we can animate them.
    env_box = (340, 180, 740, 500)  # envelope sits ~ x[400,720] y[200,460]
    underline_box = (140, 645, 940, 685)
    base = base_full.copy()
    for box in (env_box, underline_box):
        blank = Image.new("RGBA",
                          (box[2] - box[0], box[3] - box[1]),
                          BG + (255,))
        base.alpha_composite(blank, (box[0], box[1]))

    env_full = load_rgba(os.path.join(ASSETS_DIR, "envelope.png"))
    env_w = 280
    env_h = round(env_full.height * (env_w / env_full.width))
    env = env_full.resize((env_w, env_h), Image.LANCZOS)
    final_cx = CANVAS[0] // 2
    final_cy = 200 + env_h // 2

    # Sage underline from build.py — Inches(1.5) → x=150, Inches(7.8) wide → 780
    underline_y = 655
    underline_x_start = 150
    underline_w_full  = 780

    n_total = int(seconds * FPS)
    drop_frames = int(0.9 * FPS)
    underline_start_f = int(1.1 * FPS)
    underline_dur     = int(0.6 * FPS)

    out = []
    for i in range(n_total):
        # Envelope: y eases from -env_h (offscreen top) to final_cy
        if i < drop_frames:
            t = ease_out_cubic(i / max(drop_frames - 1, 1))
            cy = round(-env_h // 2 + (final_cy - (-env_h // 2)) * t)
        else:
            cy = final_cy
        frame = composite_centered(base, env, final_cx, cy)

        # Underline draws in from left to right
        if i >= underline_start_f:
            local = i - underline_start_f
            tt = min(local / max(underline_dur - 1, 1), 1.0)
            current_w = max(1, round(underline_w_full * tt))
            line_img = Image.new("RGBA", (current_w, 6),
                                 (0xa8, 0xba, 0xa0, 255))
            frame.alpha_composite(line_img,
                                  (underline_x_start, underline_y))
        out.append(frame)
    return out


def build_full_deck_frames():
    """Concatenate per-slide sequences with crossfades."""
    XFADE = int(0.4 * FPS)
    HOLD = 3.0  # default static hold per slide

    sequences = [
        cover_seq(),             # 1
        static_hold(2, HOLD),    # 2  Behavior
        static_hold(3, HOLD),    # 3  Stake
        static_hold(4, HOLD),    # 4  Wedge
        static_hold(5, HOLD + 1),  # 5  How it works (longer)
        static_hold(6, HOLD),    # 6  Five things
        static_hold(7, HOLD + 1),  # 7  5-point scale
        static_hold(8, HOLD),    # 8  Before/After
        brewing_seq(seconds=4.0),  # 9  Phase 2 brewing
        cta_seq(seconds=4.0),      # 10 CTA
    ]

    frames = list(sequences[0])
    for nxt in sequences[1:]:
        # Crossfade last XFADE frames of `frames` into first XFADE of `nxt`
        if XFADE > 0 and frames and nxt:
            a = frames[-1]
            b = nxt[0]
            blended = list(crossfade(a, b, XFADE))
            frames.extend(blended)
        frames.extend(nxt)
    return frames


# ─── Drive ────────────────────────────────────────────────────────────

def main():
    print("Building cover-only animation…")
    cover_frames = list(build_cover_frames(seconds=4.0))
    # GIF at 15fps to keep file small
    gif_frames = cover_frames[::2]  # ~15fps
    write_gif(gif_frames, os.path.join(MOTION_DIR, "cover.gif"), fps=15)
    write_mp4(cover_frames, os.path.join(MOTION_DIR, "cover.mp4"))

    print("Building full-deck motion…")
    deck = build_full_deck_frames()
    write_mp4(deck, os.path.join(MOTION_DIR, "deck.mp4"))

    print("Done.")
    for f in ("cover.gif", "cover.mp4", "deck.mp4"):
        path = os.path.join(MOTION_DIR, f)
        size_kb = os.path.getsize(path) // 1024
        print(f"  {f}  ->  {size_kb} KB")


if __name__ == "__main__":
    main()
