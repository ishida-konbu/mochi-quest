"""Paint the Kyoto forest's distant crowns over two surveyed views of each tree."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

WORLD = Path(__file__).resolve().parents[1] / 'two/assets/world'
source = Image.open(WORLD / 'forest-crowns.webp').convert('RGBA')
tile = source.width // 16
# 128 texels span a complete far tree, including its empty margins.
out_tile = tile // 2
atlas = Image.new('RGBA', (16 * out_tile, 8 * out_tile))
ink = np.array([37, 42, 35])


def blur(a, radius):
    plate = Image.fromarray(np.uint8(np.clip(a, 0, 1) * 255))
    return np.asarray(plate.filter(ImageFilter.GaussianBlur(radius)), dtype=float) / 255


def paint_tile(form, aspect):
    row, col = divmod(form, 8)
    col += aspect * 8
    source_tile = source.crop((col * tile, row * tile, (col + 1) * tile, (row + 1) * tile))
    rgba = np.asarray(source_tile, dtype=float) / 255
    red, green, blue, alpha = rgba.transpose((2, 0, 1))
    solid = alpha > .65
    # Bare wood stays in the same place as the branch the player can land on.
    family = form // 4
    leaf = green - red > -.005
    if family in (5, 6, 7, 10, 11):
        # Blossom and autumn forms have red or yellow crowns above brown bark.
        pigment = .4 * red + .6 * green
        leaf = pigment > np.percentile(pigment[solid], 30)
    density = blur(alpha, 2.4)
    broad = blur(alpha, 5.6)
    grey = (.28 * red + .56 * green + .16 * blue)
    value = blur(grey * alpha, 2.1) / np.maximum(density, .02)
    lo, hi = np.percentile(value[solid & leaf], [9, 94])
    light = np.clip((value - lo) / max(.06, hi - lo), 0, 1)
    # The pooled edge sits under each tier of leaves, with a narrow reserve of
    # paper on the upper bank. The large marks survive the atlas mip levels.
    lip = np.roll(density, (3, 1), axis=(0, 1)) - np.roll(density, (-3, -1), axis=(0, 1))
    tone = np.clip(.26 + .48 * light - .54 * lip + .18 * (density - broad), 0, 1)
    tone = .54 * tone + .46 * (np.tanh((tone - .48) * 4) * .5 + .5)
    if family in (2, 3, 4, 5):
        pale = np.array([112, 128, 103])
    elif family in (0, 1):
        pale = np.array([133, 139, 102])
    else:
        pale = np.array([147, 149, 110])
    # Only the light-facing edge gets the final dilute wash. The crown below
    # holds a warmer, deeper ink, so densely overlapping trees retain tiers.
    tone = tone ** 1.23
    rgb = ink + (pale - ink) * tone[:, :, None]

    # A little split brush on the lit boughs. Pine needles fan from one heel,
    # cedar tips fall in pairs, and the deciduous leaves are rounder dabs.
    marks = Image.new('L', (tile, tile), 0)
    brush = ImageDraw.Draw(marks)
    rand = np.random.default_rng(7709 + form * 3 + aspect)
    for _ in range(350):
        x, y = rand.integers(4, tile - 7, size=2)
        if not (solid[y, x] and leaf[y, x] and density[y, x] > .55):
            continue
        side = 1 if x > tile / 2 else -1
        if family in (0, 1):
            for dx, dy in [(1, -4), (4, -3), (6, -1)]:
                brush.line([(x, y), (x + side * dx, y + dy)], fill=135)
        elif family in (2, 3, 4, 5):
            brush.line([(x - side * 2, y - 3), (x, y), (x + side * 3, y + 1)], fill=130)
        else:
            brush.arc((x - 3, y - 2, x + 3, y + 3), 200, 327, fill=150)
    marks = np.asarray(marks) / 255
    rgb *= (1 - .40 * marks[:, :, None])
    wood = np.clip(.12 + (grey - .10) * 1.75, .06, .70)
    bark = ink + (np.array([149, 137, 111]) - ink) * wood[:, :, None]
    rgb = np.where(leaf[:, :, None], rgb, bark)
    # Keep thin twigs and negative spaces through premultiplied downsampling.
    alpha = np.clip(.93 * alpha + .12 * density, 0, 1)
    result = Image.fromarray(np.uint8(np.dstack((rgb, alpha * 255)).clip(0, 255)))
    return result.resize((out_tile, out_tile), Image.Resampling.LANCZOS)


for form in range(60):
    row, col = divmod(form, 8)
    for aspect in range(2):
        atlas.paste(paint_tile(form, aspect), ((col + aspect * 8) * out_tile, row * out_tile))
atlas.save(WORLD / 'kyo-ink-crowns.webp', quality=90, method=6)
