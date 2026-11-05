# Runtime commands and limits

Resolve SKILL_ROOT from the installed location. Run its verify.py. For dependency
installation use a clean writable copy of runtime/ outside installed assets and
verify copied source files. Keep EP, an absolute episode directory, outside both
library trees. Record toolkit version and preserve that release for continuing
episodes. Activation may reinstall assets, not restore episode work.

Core Python requires >=3.10 and standard library only. Video needs Node >=18,
npm, FFmpeg/ffprobe and compatible Chromium or authorized CDP. Optional transcription,
isolation, TTS and desktop tools require separate capabilities. Credentials remain
in authorized connections; never transfer browser authentication between users.

From the writable runtime copy:

```sh
python3 engine/scripts/doctor.py --path /workspace
cd engine/render
npm ci --ignore-scripts
cd ../..
python3 engine/scripts/pipeline.py init --episode "$EP" --id example \
  --brand brands/antares --format vertical --duration 14 --voice none \
  --author 'Actual episode author'
python3 engine/scripts/episode.py status "$EP"
```

The pinned Playwright 1.48.2 has browser-download certificate-authenticity advisory
GHSA-7mvr-c777-76hp. Do not blindly download browsers. Use trusted pre-provisioned
compatible Chromium/CDP or request separate dependency remediation. This candidate
retains pinned dependencies; host smoke tests do not certify all environments.

Research/draft first. Record episode.py approve only after a real human decision
on the exact script. Its flags are local attestations, not identity verification.
After that approval:

```sh
python3 engine/scripts/pipeline.py build --episode "$EP"
python3 engine/scripts/pipeline.py render --episode "$EP" --fps 30
```

After review, preserved preview bytes/hash and explicit preview acceptance:

```sh
python3 engine/scripts/pipeline.py render --episode "$EP" --final60
```

Final bytes require separate acceptance. Audio import uses pipeline.py voice after
script approval with actual MP3/word timings or authorized connector response.
voice_elevenlabs.py is an offline parser, not a live API. Review speech, codec,
duration and timing. Use --help for actual supported options.

## Resume an interrupted render

Repeat the same guarded render command with `--resume`. Use the same episode,
build, frame rate and `--chunk-frames` value (default 240). For an interrupted
preview, for example:

```sh
python3 engine/scripts/pipeline.py render --episode "$EP" --fps 30 --resume
```

For an interrupted final, repeat `--final60` with `--resume`. Keep the cache and
approved inputs available. The renderer skips verified chunks and recreates
missing or corrupt ones. If inputs or settings change, follow the applicable
review gate and start a fresh render.

## Authorized product capture

Use dated capture from an authorized demo environment. Before launching the
recorder, require approval for the current script and run the production guard
through an authorized wrapper. `record_screen.js` is a raw helper. If guarded
capture or a suitable session is unavailable, report the blocker or request an
authorized recording from the user.

- If login is needed, open an isolated browser and let the authorized user sign
  in there. Use a verified `LOGIN_URL` and `record_screen.js --login STATE_PATH`
  with an explicit private temporary path. For capture, set `STATE` to that
  same path and pass the approved shots JSON and output MP4 path to
  `record_screen.js`. The helper saves login state for reuse. Delete it on
  completion or failure. Keep it outside the episode, `HTML_ROOT` and all
  delivery or backup paths.
- Review the shot list and the actual frames for private data. Record the
  capture date, environment, authorization and sample/anonymized status.
  Treat a screencast as a real-time capture, with different timing and resume
  behavior from the guarded offline renderer.
- For remote Chromium, use an authorized `CDP_URL`. If it needs to load local
  HTML, set `BROWSER_HTTP_HOST` to an address reachable from that browser over
  a private network. Serve only the prepared asset directory as `HTML_ROOT`.

## Episode state and delivery

Episode state is JSON in episode.yaml. Status inspection can invalidate stale
approvals. LocalDirectoryStorage is local only; restore revokes current approvals.
Snapshot directories and temporary files are not cloud backups. Attach actual files
and hashes in Chat and report measured transfer/restoration limits honestly.
