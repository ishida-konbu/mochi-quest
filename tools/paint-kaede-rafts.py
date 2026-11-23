"""Bake tileable leaf coverage for the three pigments of the Kaede watercourses."""
from math import cos, pi, sin
from pathlib import Path
from random import Random

from PIL import Image, ImageChops


WORLD = Path(__file__).resolve().parents[1] / 'two/assets/world'
W, H = 768, 384
rng = Random(42719)
plate = Image.new('RGB', (W, H))
leaf_atlas = Image.open(WORLD / 'autumn-leaves.webp').convert('RGBA')
leaves = [leaf_atlas.crop((i * 256, 0, (i + 1) * 256, 256)) for i in range(2)]


def stamp(x, y, gold=0.16):
    # Red, orange and gold are independent coverage channels, so mipmaps
    # average even the smallest marks correctly against clear water.
    golden = rng.random() < gold
    leaf = leaves[int(golden and rng.random() < .78)]
    width = rng.randrange(11, 25)
    height = round(width * rng.uniform(.68, 1.06))
    leaf = leaf.resize((width, height), Image.Resampling.LANCZOS)
    leaf = leaf.rotate(rng.randrange(360), Image.Resampling.BICUBIC, expand=True)
    vein = leaf.getchannel('G').point(lambda v: 137 + v * .46)
    mask = ImageChops.multiply(leaf.getchannel('A'), vein)
    orange = rng.uniform(.50, .96) if rng.random() < .25 else rng.uniform(.01, .24)
    if golden:
        ochre = rng.randrange(5, 55)
        tint = (0, ochre, 255 - ochre)
    else:
        tint = (round(255 * (1 - orange)), round(255 * orange), 0)
    left = round(x * W - leaf.width / 2) % W
    top = round(y * H - leaf.height / 2) % H
    for xx in ([left, left - W] if left + leaf.width > W else [left]):
        for yy in ([top, top - H] if top + leaf.height > H else [top]):
            plate.paste(tint, (xx, yy, xx + leaf.width, yy + leaf.height), mask)


def spine(x):
    return .49 + .066 * sin(2 * pi * x) + .038 * sin(4 * pi * x + .8)


# The long crimson spine pinches apart, forks, and collects in pockets.
# All envelopes and wrapped edge impressions agree at both ends of a tile.
for _ in range(660):
    x = rng.random()
    width = .050 + .020 * cos(2 * pi * x + 1.9)
    stamp(x, spine(x) + rng.gauss(0, width), .075)
for _ in range(48):
    center = rng.random()
    cross = rng.gauss(0, .069)
    span = rng.uniform(.013, .052)
    for _ in range(rng.randrange(12, 32)):
        x = rng.gauss(center, span)
        stamp(x, spine(x) + cross + rng.gauss(0, .026), .14 + .16 * abs(cross) / .12)
for _ in range(315):
    x = rng.random()
    # The ochre fork curves back into the main skein at both ends.
    y = spine(x) + .235 * sin(pi * x) ** 2 + rng.gauss(0, .036)
    stamp(x, y, .36)
for _ in range(110):
    stamp(rng.random(), rng.random(), .23)

# Keep channels independent (lossy WebP would bleed colour into open water).
steps = [17 * round(i / 17) for i in range(256)]
plate.point(steps * 3).save(WORLD / 'kaede-water-rafts.webp', lossless=True, method=6)
