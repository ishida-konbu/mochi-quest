"""Make bark and leaf wash ramps from the two baked views of each crown."""
from pathlib import Path

import numpy as np
from PIL import Image

WORLD = Path(__file__).resolve().parents[1] / 'two/assets/world'
source = Image.open(WORLD / 'forest-crowns.webp').convert('RGBA')
tile = source.width // 16
forms = 60
ramp = np.linspace(0, 1, 256)
washes = np.empty((forms * 4, len(ramp), 3), dtype='uint8')


def linear(rgb):
    return np.where(rgb <= .04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)


def paint_wash(form, aspect):
    row, col = divmod(form, 8)
    col += aspect * 8
    region = (col * tile, row * tile, (col + 1) * tile, (row + 1) * tile)
    rgba = np.asarray(source.crop(region), dtype=float) / 255
    rgb = linear(rgba[:, :, :3])
    red, green = rgb[:, :, 0], rgb[:, :, 1]
    value = np.sqrt(rgb @ [.28, .56, .16])
    solid = rgba[:, :, 3] > .75
    family = form // 4
    autumn = family in (5, 6, 7, 10, 11)
    leaf = green > red * .94
    if autumn:
        # Yellow and red foliage can share the hue of the branches. Find the
        # dark wood beneath its canopy separately for each orthogonal view.
        cut = np.percentile(value[solid], 17)
        leaf = value > cut
    lo, hi = np.percentile(value[solid & leaf], [4, 96])
    tone = np.clip((ramp - lo) / max(.09, hi - lo), 0, 1)
    dark = np.array([42, 52, 41])
    if family in (2, 3, 4, 5):
        pale = np.array([133, 148, 124])
    elif family == 14:
        pale = np.array([157, 165, 116])
    else:
        pale = np.array([155, 162, 119])
    pigment = dark + (pale - dark) * (.19 + .72 * tone[:, None])
    bark = np.array([48, 43, 36]) + np.array([115, 105, 83]) * np.clip((ramp - .07) * 1.67, .09, .87)[:, None]
    if autumn:
        blend = np.clip((ramp - cut + .015) / .03, 0, 1)[:, None]
        bark = pigment = bark + (pigment - bark) * blend
    y = 2 * (aspect * forms + form)
    washes[y] = np.uint8(np.round(bark))
    washes[y + 1] = np.uint8(np.round(pigment))


for form in range(forms):
    for aspect in range(2):
        paint_wash(form, aspect)
Image.fromarray(washes).save(WORLD / 'kyo-crown-washes.webp', lossless=True, method=6)
