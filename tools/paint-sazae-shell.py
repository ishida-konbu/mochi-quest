"""Paint the outer periostracum of the Ryugu turban shell, in growth coordinates."""
from pathlib import Path

import numpy as np
from PIL import Image

N = 1024
rng = np.random.default_rng(7708)
tau = np.pi * 2
a, growth = np.meshgrid(np.arange(N) * tau / N, np.arange(N) * tau / N)


def clouds(size):
    # Interpolate one wrapped field so the whorl closes at both joins.
    grid = rng.uniform(-1, 1, (size, size))
    s = np.arange(N) * size / N
    i, f = s.astype(int), s % 1
    f = f * f * (3 - 2 * f)
    row = grid[:, i] * (1 - f) + grid[:, (i + 1) % size] * f
    return row[i] * (1 - f[:, None]) + row[(i + 1) % size] * f[:, None]


def glaze(color, opacity):
    global rgb
    amount = np.clip(opacity, 0, 1)[..., None]
    rgb = rgb * (1 - amount) + np.array(color) * amount


field = .62 * clouds(9) + .28 * clouds(27) + .10 * clouds(91)
brush = clouds(68)
grain = rng.normal(0, 1, (N, N))
rgb = np.empty((N, N, 3))
rgb[:] = [166, 165, 133]
# Buff limestone shows through water-worn grey-green and burnt umber.
glaze([107, 126, 111], .48 + .79 * field)
glaze([196, 174, 129], .13 + .37 * np.sin(3 * a + np.sin(growth)) + .56 * field)
meander = .38 * np.sin(4 * a + .47 * np.sin(3 * growth)) + .21 * np.sin(9 * a - growth)
blotch = np.cos(13 * growth + 3.5 * np.sin(3 * a + meander) + 2.2 * field)
glaze([123, 90, 65], .42 * np.clip((blotch - .19) * 3, 0, 1) * (.64 + .6 * field))
glaze([86, 100, 83], .38 * np.clip((blotch + .15) * 2.1, 0, 1) * (.8 - field))

# Chalk tesserae between the darker cords, and minute, uneven accretion lines.
rows = 8 * a + .62 * np.cos(4 * growth) + .33 * field
chevron = np.cos(22 * growth + 1.53 * np.arccos(np.cos(rows)) + 3.5 * field)
tiles = np.clip((chevron - .16) * 1.8, 0, 1) * np.clip((np.cos(rows) + .84) * 1.5, 0, 1)
glaze([232, 217, 176], tiles * (.38 + .26 * brush))
cord = np.cos(16 * a + .32 * np.sin(growth * 2 + a))
glaze([76, 80, 66], np.clip((cord - .71) * 2.9, 0, 1) * (.42 + .22 * brush))
glaze([212, 207, 170], np.clip((-cord - .55) * 1.3, 0, 1) * .40)
# Two heavier shoulder cords catch the eye from the deck. Pale, irregular
# dashes break their dark seams where the raised knobs have worn to chalk.
for shoulder, width in [(2.40, .085), (.71, .065)]:
    offset = np.arctan2(np.sin(a - shoulder), np.cos(a - shoulder)) + .023 * np.sin(4 * growth)
    glaze([68, 79, 66], np.exp(-(offset / width)**2) * (.61 + .24 * brush))
    checks = np.clip((np.cos(17 * growth + .8 * np.sin(growth * 4)) + .56) * 2, 0, 1)
    glaze([227, 219, 177], np.exp(-((offset - width * 1.8) / width)**2) * (.37 + .52 * checks))
striae = 143 * growth + 4.8 * np.sin(a + .42 * np.sin(3 * growth)) + 1.9 * brush
glaze([81, 80, 65], (.5 + .5 * np.cos(striae)) ** 5 * (.15 + .11 * brush))
glaze([237, 226, 196], (.5 + .5 * np.cos(striae - 1.45)) ** 8 * .21)
rgb += (4.2 * grain + 6.0 * clouds(222) + 9.3 * field)[..., None]
path = Path(__file__).resolve().parents[1] / 'two/assets/world/sazae-calcite.webp'
Image.fromarray(np.uint8(np.clip(rgb, 0, 255))).save(path, quality=85, method=6)
