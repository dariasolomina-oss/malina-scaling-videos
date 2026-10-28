"""Tidy a rembg cutout for the thumbnail sticker: birefnet keeps every flyaway hair, and the white sticker outline
then traces each strand, so the hair looks wild. This removes strands thinner than ~1% of the width (morphological
opening), smooths the silhouette, keeps it inside the original matte (no background pockets), and anti-aliases the edge.
usage: uv run --with numpy --with scipy --with pillow python smooth_cutout.py face_cut.png face_smooth.png [strength=1.0]"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

src, out = sys.argv[1], sys.argv[2]
k = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
a = im[..., 3] / 255.0
h, w = a.shape
r = max(3, int(0.011 * w * k))                       # strand width to remove (~19 px on a 1728-wide 4K frame)

m = a > 0.5
lab, n = nd.label(m)                                  # keep the person, drop specks
if n > 1: m = lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1)
m = nd.binary_fill_holes(m)
yy, xx = np.ogrid[-r:r + 1, -r:r + 1]
disk = xx * xx + yy * yy <= r * r
m = nd.binary_opening(m, structure=disk)              # strands thinner than the disk disappear
m = nd.gaussian_filter(m.astype(np.float32), sigma=r * 0.7) > 0.5   # smooth the contour
m &= nd.binary_dilation(a > 0.25, iterations=2)       # never grow into background the matte didn't cover
m = nd.binary_fill_holes(m)
alpha = nd.gaussian_filter(m.astype(np.float32), sigma=1.3)          # soft 1–2 px edge
im[..., 3] = np.clip(alpha, 0, 1) * 255
Image.fromarray(im.astype(np.uint8)).save(out)
print(f'{out}: removed strands < {2 * r}px, opaque area {m.mean():.1%} (was {(a > 0.5).mean():.1%})')
