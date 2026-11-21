#!/usr/bin/env python3
"""Bring every gift sound to the same loudness: -37 LUFS integrated (EBU R128).

Pure gain, no compression: the sound itself is unchanged, only louder/quieter.
Files already within ±TOL dB of the target are left alone. Peaks are checked so
nothing clips after a boost.

    python tools/normalize_sound.py                 # all assets/anim640/*.mp3
    python tools/normalize_sound.py --check         # only measure, write nothing
    python tools/normalize_sound.py --ffmpeg C:/path/ffmpeg.exe  a.mp3 b.mp3

ffmpeg: from PATH, or --ffmpeg, or `pip install imageio-ffmpeg` (its bundled binary).
"""
import argparse, glob, os, re, shutil, subprocess, sys, tempfile

TARGET = -37.0   # LUFS: the level the catalog sounds were tuned to — quiet background, not loud
TOL = 1.0        # dB: closer than this — leave the file as is
MAX_PEAK = -1.0  # dBFS: never boost above this


def find_ffmpeg(arg):
    if arg: return arg
    if shutil.which("ffmpeg"): return "ffmpeg"
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found: install it, pass --ffmpeg, or pip install imageio-ffmpeg")


def measure(ff, path):
    out = subprocess.run([ff, "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    summary = out[out.rfind("Summary:"):]
    i = re.search(r"I:\s*(-?[\d.]+) LUFS", summary)
    p = re.search(r"Peak:\s*(-?[\d.]+|-inf) dBFS", summary)
    if not (i and p):  # ffmpeg couldn't read the file: no summary
        return None
    return float(i.group(1)), float(p.group(1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="*")
    ap.add_argument("--ffmpeg")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    ff = find_ffmpeg(a.ffmpeg)
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    files = a.files or sorted(glob.glob(os.path.join(root, "assets", "anim640", "*.mp3")))
    changed = 0
    for f in files:
        name = os.path.basename(f)
        m = measure(ff, f)
        if m is None:
            print(f"  skip {name:40s} ffmpeg could not measure it")
            continue
        lufs, peak = m
        gain = TARGET - lufs
        gain = min(gain, MAX_PEAK - peak)  # a boost must not clip
        if abs(gain) < TOL:
            print(f"  ok   {name:40s} {lufs:6.1f} LUFS")
            continue
        print(f"  {'fix ' if not a.check else 'off '} {name:40s} {lufs:6.1f} LUFS  peak {peak:6.1f}  ->  {gain:+.1f} dB")
        if a.check: continue
        fd, tmp = tempfile.mkstemp(suffix=".mp3"); os.close(fd)
        subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-i", f, "-map_metadata", "-1",
                        "-af", f"volume={gain:.2f}dB", "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "48000", tmp], check=True)
        shutil.move(tmp, f)
        changed += 1
    print(f"{changed} file(s) changed, target {TARGET} LUFS")


if __name__ == "__main__":
    main()
