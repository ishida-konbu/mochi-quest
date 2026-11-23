"""Paint the ink and wash plate shared by the loose leaves in the maple gorge."""
from math import cos, exp, hypot, pi, sin
from pathlib import Path
from random import Random

import numpy as np
from PIL import Image, ImageChops, ImageDraw

WORLD = Path(__file__).resolve().parents[1] / 'two/assets/world'
TILE, SCALE = 256, 3
SIDE = TILE * SCALE


def curve(a, b, bend=0, steps=20):
    dx, dy = b[0] - a[0], b[1] - a[1]
    return [(a[0] + t * dx - sin(t * pi) * dy * bend,
             a[1] + t * dy + sin(t * pi) * dx * bend) for t in np.linspace(0, 1, steps)]


def polygon(draw, points, color):
    draw.polygon([(round(x * SCALE), round(y * SCALE)) for x, y in points], fill=color)


def stroke(draw, points, base, tip, color):
    edges = [[], []]
    for j, (x, y) in enumerate(points):
        a, b = points[max(j - 1, 0)], points[min(j + 1, len(points) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        width = (base + (tip - base) * j / (len(points) - 1)) / max(.01, 2 * hypot(dx, dy))
        edges[0].append((x - dy * width, y + dx * width))
        edges[1].append((x + dy * width, y - dx * width))
    polygon(draw, edges[0] + edges[1][::-1], color)


def maple_margin(a, b, rng):
    # Each side of a lobe bows away from its midrib; the teeth turn towards the tip.
    edge = curve(a, b, -.065, 3 + int(hypot(b[0] - a[0], b[1] - a[1]) / 15))
    margin = [a]
    for (x, y), (xx, yy) in zip(edge[:-2], edge[1:-1]):
        dx, dy = xx - x, yy - y
        tooth = rng.uniform(.6, 2.1) / hypot(dx, dy)
        margin.extend([(x + .74 * dx + tooth * dy, y + .74 * dy - tooth * dx), (xx, yy)])
    return margin


def maple(draw, rng):
    root = (127, 165)
    sinuses = [(116, 167), (78, 151), (83, 130), (111, 111),
               (141, 106), (169, 120), (182, 143), (139, 166)]
    tips = [(42, 186), (8, 112), (49, 53), (118, 8), (196, 40), (247, 103), (219, 172)]
    outline = []
    for i, tip in enumerate(tips):
        outline.extend(maple_margin(sinuses[i], tip, rng))
        outline.extend(maple_margin(tip, sinuses[i + 1], rng))
        vein = curve(root, tip, (-1) ** i * .025)
        stroke(draw, vein[:-1], 2.2, .28, (164, 152, 136))
        # Slender subsidiary veins branch off the midrib into the teeth.
        for j in (7, 11, 14):
            for side in (i, i + 1):
                end = curve(sinuses[side], tip)[j + 2]
                stroke(draw, curve(vein[j], end, .06), .95, .16, (185, 183, 163))
    return outline + [sinuses[-1], root], root, (99, 240)


def ginkgo(draw):
    root = (127, 163)

    def blade(t):
        a = (-76 + 151 * t) * pi / 180
        r = 118 + 12 * cos(a) + 9 * sin(2.7 * a + .35) + 2.2 * sin(27 * a) + 1.4 * cos(45 * a)
        # A deep central cleft separates the two uneven lobes.
        r -= 31 * exp(-abs(a - .056) * 16) + 10 * exp(-abs(a + .70) * 20)
        return root[0] + r * sin(a), root[1] - r * cos(a)

    rim = [blade(t) for t in np.linspace(0, 1, 193)]
    for j in range(1, 18):
        vein = curve(root, blade(j / 18), .12 * (.5 - j / 18))
        stroke(draw, vein[2:-1], .98, .24, (179, 174, 143))
        fork = curve(vein[9], blade((j - .48) / 18), -.018)
        stroke(draw, fork[:-1], .74, .19, (192, 186, 156))
    return curve(root, rim[0], .095)[:-1] + rim + curve(rim[-1], root, .09)[1:], root, (147, 240)


def paint(kind):
    rng = Random(917 if kind == 'maple' else 1314)
    noise = np.random.default_rng(179)
    grain = noise.normal(0, 3.4, (SIDE, SIDE))
    pools = Image.fromarray(noise.integers(0, 256, (17, 17), dtype='uint8'))
    pools = np.asarray(pools.resize((SIDE, SIDE), Image.Resampling.BICUBIC)) / 255
    y, x = np.mgrid[:SIDE, :SIDE] / SCALE
    angle = np.arctan2(x - 127, 163 - y)
    ribs = 10 if kind == 'maple' else 23
    wash = 235 + 8 * np.sin(.033 * x + .017 * y) + 7 * np.sin(ribs * angle + .4) + grain
    wash -= 6 * pools + 12 * np.maximum(0, pools - .63) / .37
    wash += 4 * np.cos(x / 13 + y / 19) - 13 * np.exp(-((x - 107) ** 2 + (y - 163) ** 2) / 660)
    image = Image.fromarray(np.clip(np.stack([wash + 8, wash + 3, wash - 5], axis=2), 0, 255).astype('uint8'))
    draw = ImageDraw.Draw(image)
    outline, root, end = maple(draw, rng) if kind == 'maple' else ginkgo(draw)

    # Broken touches of ink catch along the edge where the wash has dried.
    for j, a in enumerate(outline):
        b = outline[(j + 1) % len(outline)]
        stroke(draw, [a, b], 1.7 + .5 * sin(j * .17), .85, (155, 145, 128))
    mask = Image.new('L', (SIDE, SIDE))
    polygon(ImageDraw.Draw(mask), outline, 255)
    stalk = curve(root, end, -.13 if kind == 'maple' else .105)
    stroke(ImageDraw.Draw(mask), stalk, 3.8, 1.8, 255)
    stroke(draw, stalk, 4.0, 2.0, (153, 139, 117))
    stroke(draw, [(x + .55, y) for x, y in stalk[:-2]], 1.4, .4, (207, 185, 149))
    image.putalpha(mask)
    return image.resize((TILE, TILE), Image.Resampling.LANCZOS)


def windrows(blades):
    """Print a pocket of overlapping leaves, with loose blades beyond its crest."""
    width, height = 384, 192
    sheet = Image.new('RGBA', (width * 2, height))
    madder = ['#9f3033', '#b82630', '#ca3026', '#de4326', '#c9552c', '#e46632']
    gold = ['#d9982f', '#eabe45', '#c79033', '#e8b136']
    for column in range(2):
        rng = Random(4195 + 113 * column)
        drift = Image.new('RGBA', (width, height))
        # Several unequal pockets share a curving spine. The gaps between them
        # leave the ground showing through even when the texture is minified.
        pockets = [(.23, .57, .076, .107), (.45, .47, .103, .114),
                   (.66, .41, .066, .081), (.78, .54, .060, .074)]
        for i in range(176):
            cx, cy, sx, sy = rng.choices(pockets, weights=(27, 46, 18, 9))[0]
            x, y = rng.gauss(cx, sx), rng.gauss(cy, sy)
            if i % 7 == 0:
                y += rng.uniform(-.19, .17)
            if not (.075 < x < .93 and .12 < y < .88):
                continue
            kind = 'ginkgo' if rng.random() < (.54 if column else .072) else 'maple'
            tint = rng.choice(gold if kind == 'ginkgo' else madder)
            size = rng.randrange(18, 33)
            blade = blades[kind].resize((size, round(size * rng.uniform(.66, 1.05))), Image.Resampling.LANCZOS)
            tint_layer = Image.new('RGBA', blade.size, tint)
            blade = ImageChops.multiply(blade, tint_layer)
            blade = blade.rotate(rng.randrange(360), Image.Resampling.BICUBIC, expand=True)
            drift.alpha_composite(blade, (round(x * width - blade.width/2), round(y * height - blade.height/2)))
        sheet.paste(drift, (column * width, 0))
    return sheet


if __name__ == '__main__':
    blades = {kind: paint(kind) for kind in ('maple', 'ginkgo')}
    atlas = Image.new('RGBA', (TILE * 2, TILE))
    for col, blade in enumerate(blades.values()):
        atlas.paste(blade, (TILE * col, 0))
    atlas.save(WORLD / 'autumn-leaves.webp', quality=91, alpha_quality=100, method=6)
    windrows(blades).save(WORLD / 'autumn-windrows.webp', quality=90, alpha_quality=100, method=6)
