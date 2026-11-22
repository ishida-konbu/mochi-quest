"""Bake the repeating ink density for the coastal winter sky and its water reflection."""
from pathlib import Path

import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent.parent
size = 768
rng = np.random.default_rng(18732)
y, x = np.mgrid[0:size, 0:size]
fx, fy = np.meshgrid(np.fft.rfftfreq(size), np.fft.fftfreq(size))


def wash(nx, ny):
    # Filtering on the torus makes even the longest watery fibres join at the rim.
    field = np.fft.rfft2(rng.normal(size=(size, size)))
    filter_ = np.exp(-.5*((fx*size/nx)**2+(fy*size/ny)**2))
    cloud = np.fft.irfft2(field*filter_, s=(size,size))
    return cloud / cloud.std()


def dip(plate, u, v):
    a, b = np.floor(u).astype(int), np.floor(v).astype(int)
    dx, dy = u-a, v-b
    return ((1-dx)*(1-dy)*plate[b%size, a%size] + dx*(1-dy)*plate[b%size,(a+1)%size]
            + (1-dx)*dy*plate[(b+1)%size,a%size] + dx*dy*plate[(b+1)%size,(a+1)%size])


flow = wash(3, 2)
u = x + 12*flow + 5*wash(6, 5)
v = y + 19*wash(2, 3) + 7*wash(5, 7)
broad = dip(wash(2.7, 4.5), u, v)
middle = dip(wash(5.7, 11), u + 9*broad, v - 7*flow)
blot = dip(wash(14, 21), u + 6*middle, v + 4*flow)
dry = dip(wash(31, 72), u + 4*blot, v - 5*middle)
fold = .47*broad + .33*middle + .15*blot + .05*dry
# Two restrained tide marks and a fine dragged brush break up the undersides
# of the cloud banks without imprinting screen-space grain or crisp outlines.
tide = .06*np.exp(-((fold-.24)/.13)**2) - .042*np.exp(-((fold+.38)/.095)**2)
density = .50 + .46*np.tanh(fold*1.07) + tide + .014*dry
image = Image.fromarray(np.uint8(np.clip(density,0,1)*255))
image.save(root/'two/assets/world/winter-cloud-wash.webp',quality=92,method=6)
