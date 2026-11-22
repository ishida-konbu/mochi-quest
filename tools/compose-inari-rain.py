"""Original Fushimi Inari rain and distant thunder, CC0. Requires NumPy and ffmpeg."""
from pathlib import Path
import subprocess
import numpy as np

RATE = 32000
OUT = Path(__file__).resolve().parents[1] / "audio" / "journey"
RNG = np.random.default_rng(75913)


def band_noise(n, low, high):
    """Independent, loopable band-limited air or water noise at unit RMS."""
    hz = np.fft.rfftfreq(n, 1 / RATE)
    response = (hz / np.maximum(low, hz)) ** 2 / (1 + (hz / high) ** 4)
    samples = np.fft.irfft(np.fft.rfft(RNG.normal(size=n)) * response, n=n)
    return samples / np.sqrt(np.mean(samples ** 2))


def drizzle(seconds):
    # A leaf bends under the drop, then shakes off smaller beads. Wood and
    # stone return a shorter, brighter contact. Scatter both across the path.
    n = seconds * RATE
    bed = np.column_stack([band_noise(n, 850, 5800) for _ in range(2)]) * .032
    for _ in range(seconds * 54):
        decay = RNG.uniform(.008, .035)
        t = np.arange(round(6 * decay * RATE)) / RATE
        hz = RNG.uniform(580, 3100)
        ring = np.sin(2*np.pi * (hz*t + .003*hz*(1-np.exp(-55*t))))
        splash = RNG.normal(size=len(t))
        splash[1:] -= .48 * splash[:-1]
        drop = (1 - np.exp(-1300*t)) * (
            .47 * ring * np.exp(-t/decay) + .37 * splash * np.exp(-1.8*t/decay)
        ) * RNG.uniform(.3, 1) ** 2
        pan = RNG.uniform(-.94, .94)
        start = int(RNG.uniform(0, n))
        idx = (start + np.arange(len(drop))) % n
        bed[idx] += drop[:, None] * np.sqrt([(1-pan)/2, (1+pan)/2])
    return bed


def downpour(seconds):
    # Pooled noise represents innumerable impacts on the slope; slow, smooth
    # gusts bring the patter at the near left and right canopy in and out.
    n = seconds * RATE
    phase = np.linspace(0, 2*np.pi, n, endpoint=False)
    common = band_noise(n, 210, 3300)
    channels = []
    for side in [-1, 1]:
        swells = .78 + .12*np.sin(3*phase+side*.5) + .06*np.sin(7*phase+side*1.1)
        soft = .55*common + .61*band_noise(n, 300, 2400)
        hiss = .27*band_noise(n, 1800, 6300)*(1+.25*np.sin(11*phase+side))
        channels.append(swells * (soft+hiss))
    return np.column_stack(channels)


def thunder():
    # A far hillside carries the soft first report, then answers twice at
    # lower pitches. Keep mid-low energy so the roll survives phone speakers.
    n = 6 * RATE
    t = np.arange(n) / RATE
    wave = np.zeros(n)
    for lag, attack, fall, level, low, high in [
        (.03, .11, .61, .61, 108, 540), (.49, .22, 1.1, 1, 64, 295),
        (1.65, .24, 1.17, .75, 54, 222), (2.73, .27, .9, .43, 83, 248),
    ]:
        age = np.maximum(0, t-lag)
        env = (1-np.exp(-age/attack))*np.exp(-age/fall)
        ripple = 1 + .17*np.sin(2*np.pi*(2.3*t+.13*t*t))
        wave += level * env * ripple * band_noise(n, low, high)
    wave *= np.minimum(1, (6-t)/.65)
    return wave[:, None]


def encode(name, signal, rms, loop=False):
    signal *= rms / np.sqrt(np.mean(signal**2))
    # Match mixBed's quarter-second pickup and trailer outside the loop.
    if loop:
        pad = RATE // 4
        signal = np.concatenate([signal[-pad:], signal, signal[:pad]])
    pcm = np.round(32767*np.clip(signal, -.95, .95)).astype('<i2')
    subprocess.run([
        "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le",
        "-ar", str(RATE), "-ac", str(signal.shape[1]), "-i", "pipe:0", "-c:a", "libmp3lame",
        "-b:a", "80k" if loop else "48k", str(OUT / (name + ".mp3")),
    ], input=pcm.tobytes(), check=True)


if __name__ == "__main__":
    encode("inari-rain-drops", drizzle(19), .115, loop=True)
    encode("inari-rain-curtain", downpour(23), .135, loop=True)
    encode("inari-thunder", thunder(), .14)
