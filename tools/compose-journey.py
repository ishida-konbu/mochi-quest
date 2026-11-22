"""Render the original Mochi Quest 2 chamber pieces (CC0). Requires NumPy and ffmpeg."""
from pathlib import Path
import subprocess
import numpy as np

RATE = 32000
OUT = Path(__file__).resolve().parents[1] / "audio" / "journey"
# Each pair of bars is written in eighth notes. Dots sustain, dashes leave space.
# Mode, tonic (MIDI), bpm, lead, and the call and answer of each landscape.
PIECES = {
    "river": ("yo", 62, 82, "koto", "2.34.2-1 0..12.-0 2.45.4-2 1...0--- 2.34.5-4 2..1.0-1 3.21.-10 0...----"),
    "shrine": ("in", 62, 65, "flute", "0...1.2. 4.....-- 3...21.. 0....--- 2...4.5. 4..3.2.. 1..0..1. 0....---"),
    "market": ("yo", 65, 102, "shamisen", "0-212-43 2.01-2-- 3-453-21 2.10-.-- 5054-321 2321-00- 1234-210 0..-0---"),
    "spring": ("minyo", 60, 65, "koto", "4..32... 1..02--- 3..24.3. 2...1--- 4..35... 3.21.0.. 1..2.1.. 0....---"),
    "terraces": ("yo", 60, 75, "flute", "0..12... 4.3.2--- 1..23... 2..1.0-- 2..34... 5..4.2.. 3..12.1. 0...----"),
    "coast": ("minyo", 64, 77, "koto", "0.2-4..5 4.3.2--- 2.3-5..6 5..4.3-- 4.5-6..7 5.43.2-- 3.2-1..2 0...----"),
    "snow": ("in", 64, 59, "bell", "4...2--- 1.....-- 3...4..2 1...---- 5...4--- 2..1..-- 3.2.1... 0...----"),
    "autumn": ("in", 65, 86, "shamisen", "5.43.2-1 2..1..0- 4.32.1-0 1..2..-- 6.54.3-2 4..31.2- 3.21.-10 0....---"),
    "moon": ("in", 57, 56, "flute", "2.....-- 4...3.-- 1..2.... 0....--- 4.....5. 3...2.-- 1...2.1. 0....---"),
    "dawn": ("ritsu", 62, 74, "flute", "0...2.3. 4....--- 2..34... 5..4.2-- 3..45..6 7...5.-- 4.32.1.. 0....---"),
    "kyo": ("yo", 64, 97, "shamisen", "2-342.10 1.23-24. 5.423.21 2.10-.-- 3-453.21 0.21-24. 5432.1-2 0...0---"),
    "peach": ("ritsu", 67, 63, "flute", "3...4.5. 7...6.-- 4..32.4. 2....--- 5.6.7... 4...3.-- 2..12.3. 0....---"),
    "ryugu": ("minyo", 56, 60, "bell", "0...2.-- 5...4.3. 2.....-- 1...0--- 4...6.-- 7..54... 3..2..1. 0....---"),
    "todaiji": ("ritsu", 52, 56, "bell", "0.....-- 2...3.-- 4...2... 0.....-- 5...4.2. 3....--- 1..2..1. 0.....--"),
    "inari": ("in", 66, 88, "flute", "0.12-12. 4.3.2.1. 2-345.4. 2...1--- 3.45-65. 4..3.21. 2-1.20.1 0....---"),
    "tsuruga": ("ritsu", 58, 68, "flute", "0...3.2. 1...0--- 2.4.5..4 2..1.0-- 0.2.4... 5.7.5--- 4.2..1.. 0....---"),
    "sakai": ("yo", 62, 92, "koto", "0-2.42.1 2.10..-- 4.54-3.2 1...0--- 2-3-5.4. 3.21-2.1 4.3.2.1. 0..-0---"),
}
SCALES = {"yo": [0,2,5,7,9], "in": [0,1,5,7,8], "minyo": [0,3,5,7,10], "ritsu": [0,2,5,7,10]}
def voice(kind, hz, sustain, rng):
    tail = {"flute":.22, "bell":2.8, "shamisen":.6, "koto":1.7, "drum":.22}[kind]
    t = np.arange(int(RATE*(sustain+tail))) / RATE
    phase = 2*np.pi*hz*t
    if kind == "flute":
        breath = rng.normal(0,1,len(t))
        # Filtered air and a late, shallow yuri around the sustained pitch.
        air = np.convolve(breath, np.ones(7)/7, mode="same") - np.convolve(breath,np.ones(27)/27,mode="same")
        phi = phase + .17*np.sin(2*np.pi*4.7*t)*np.minimum(1,t/.7) + .35*np.exp(-14*t)
        wave = np.sin(phi)+.21*np.sin(2*phi)+.085*np.sin(3*phi)+.032*np.sin(5*phi)+.115*air
        env = (1-np.exp(-12*t))*np.exp(-14*np.maximum(0,t-sustain))*(.96+.04*np.sin(8.1*t))
    elif kind == "bell":
        wave = sum(a*np.sin(r*phase)*np.exp(-k*t) for r,a,k in [(1,1,1.3),(2.71,.26,2.4),(4.12,.13,3.1),(5.62,.05,5)])
        env = 1-np.exp(-110*t)
    elif kind == "drum":
        wave = np.sin(phase + 5*(1-np.exp(-35*t))) + .3*rng.normal(0,1,len(t))*np.exp(-70*t)
        env = (1-np.exp(-230*t))*np.exp(-16*t)
    else:
        bright = kind == "shamisen"
        wave = np.zeros_like(t)
        for h in range(1,13):
            # Bridge inharmonicity, pick position and separate decay of the upper partials.
            pick = np.sin(h*(.21 if bright else .145)*np.pi)/h**1.22
            wave += pick*np.sin(phase*h*(1+.000085*h*h))*np.exp(-t*(1.05+.26*h)*(1.65 if bright else 1))
        wave += .065*rng.normal(0,1,len(t))*np.exp(-105*t)
        env = (1-np.exp(-290*t))*np.exp(-3.3*np.maximum(0,t-sustain-.35))
    return wave*env*np.minimum(1,(len(t)-np.arange(len(t)))/(RATE*.012))

def render(name, spec, seed):
    mode, tonic, bpm, lead, song = spec
    bars = song.split()
    assert len(bars)==8 and all(len(b)==8 for b in bars)
    eighth = 30/bpm
    n = round(64*eighth*RATE)
    mix = np.zeros((n,2))
    rng = np.random.default_rng(seed)
    def note(tick, degree, duration, kind, level, pan):
        scale = SCALES[mode]
        octave, index = divmod(degree,5)
        pitch = tonic + octave*12 + scale[index]
        hz = 440*2**((pitch-69)/12)
        wave = voice(kind,hz,duration*eighth,rng)*level
        start = round((tick*eighth+rng.uniform(-.009,.009))*RATE)%n
        stereo = wave[:,None]*np.sqrt([1-pan,1+pan])
        split = min(len(wave),n-start)
        mix[start:start+split] += stereo[:split]
        mix[:len(wave)-split] += stereo[split:]
    for i,bar in enumerate(bars):
        for j,c in enumerate(bar):
            if not c.isdigit(): continue
            sustain=1
            while j+sustain < 8 and bar[j+sustain]=='.': sustain+=1
            note(i*8+j,int(c),sustain*.91,lead,.44 if lead=="flute" else .75,-.14)
        bass = (-5,-3,-4,-5,-2,-4,-3,-5)[i]
        note(i*8, bass,3,"koto",.48,.22)
        if i%2==0 or lead=="shamisen":
            note(i*8+4.1,bass+2,2,"koto",.34,.32)
        if name in ("market","dawn","autumn","kyo","inari"):
            note(i*8+4, -13, .24, "drum", .25 if name=="market" else .15,-.15)
        if lead in ("koto","shamisen") and i%2==1:
            note(i*8+4.5, [2,1,3,0][i//2],2.5,"flute",.18,.25)
    # Wrap reflections across the loop for a tail without a silent seam.
    wet=mix.copy()
    for delay,level in [(.061,.12),(.143,.09),(.233,.06),(.369,.025)]:
        wet += np.roll(mix[:,::-1],round(delay*RATE),axis=0)*level
    wet *= .16 / max(.01,np.sqrt(np.mean(wet**2)))
    pcm=np.int16(np.clip(wet,-.94,.94)*32767)
    subprocess.run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-f","s16le","-ar",str(RATE),
                    "-ac","2","-i","pipe:0","-codec:a","libmp3lame","-b:a","80k",str(OUT/("score-"+name+".mp3"))],
                   input=pcm.tobytes(),check=True)
if __name__ == "__main__":
    for i,(name,spec) in enumerate(PIECES.items()): render(name,spec,753+i)
