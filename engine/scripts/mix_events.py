#!/usr/bin/env python3
"""Build a sound-design track by placing sound files from _assets at exact times.

Usage: python3 mix_events.py events.json out.wav
events.json:
{ "duration": 14,
  "assets": "../../_assets",
  "events": [
    {"file": "dragon-studio-keyboard-typing-sound-effect-335503.mp3", "at": 0.75, "vol": 0.5,
     "trim": [0.5, 2.25], "fx": "afade=t=in:d=0.05,afade=t=out:st=1.6:d=0.15,highpass=f=180,lowpass=f=4200"},
    {"file": "matthewvakaliuk73627-mouse-click-290204.mp3", "at": 2.58, "vol": 0.5}
  ] }
Paths in "assets" are relative to the JSON file.
"""
import json, os, subprocess, sys
cfg_path, out = sys.argv[1], sys.argv[2]
cfg = json.load(open(cfg_path)); base = os.path.join(os.path.dirname(os.path.abspath(cfg_path)), cfg.get("assets", "."))
args = ["ffmpeg", "-loglevel", "error", "-y"]; chains = []; labels = []
for i, e in enumerate(cfg["events"]):
    args += ["-i", os.path.join(base, e["file"])]
    c = f"[{i}:a]aformat=sample_rates=48000:channel_layouts=stereo"
    if e.get("trim"): c += f",atrim={e['trim'][0]}:{e['trim'][1]},asetpts=PTS-STARTPTS"
    if e.get("fx"): c += "," + e["fx"]
    ms = int(e["at"] * 1000); c += f",volume={e.get('vol', 0.3)},adelay={ms}|{ms}[e{i}]"
    chains.append(c); labels.append(f"[e{i}]")
chains.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0,apad=whole_dur={cfg['duration']}[a]")
args += ["-filter_complex", ";".join(chains), "-map", "[a]", "-t", str(cfg["duration"]), out]
subprocess.run(args, check=True); print("wrote", out)
