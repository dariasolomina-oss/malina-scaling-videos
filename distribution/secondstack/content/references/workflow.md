# Production workflow

1. Select the product and complete intake using runtime/templates/brief.md and the
   format reference. The brief opens with the core message (one sentence), which
   the user confirms before the script. Initialize a separate episode directory
   with pipeline.py init.
2. Follow research.md. Read the selected Collection and topic-specific sources;
   record evidence and essential gaps before scripting. Boards are optional
   read-only editorial context, not product evidence.
3. Fill runtime/templates/script.md with copy, scenes, timings and the visual
   source of every product scene. script_check.py points out editorial issues.
   Show the script to the user in plain words; after their clear approval record
   it with episode.py approve script.
4. After approval, import the voice (a user recording, edited to fit the picture,
   or a voice you generated) with timings. A supplied recording may be transcribed
   before the script as research.
5. Populate content.json from the approved copy and run pipeline.py build. Use the
   universal card layout for a single editorial page, `layout: scenes` for the
   shared multi-scene template, or `layout: custom` for a full-screen animation you
   write yourself (characters, mascots, generated product UI; see runtime.md).
   Screen scenes take a local image or video (a capture or one you generated).
   Visuals never replace sources for product claims.
6. Animatic by default, for every video: pipeline.py animatic builds
   `media/animatic.mp4` (a frame every 2 s with the voice, for the chat),
   `media/animatic-sheet.jpg` (one frame per scene) and `animatic/` (an
   interactive player), checks the layout of every frame and writes `review/`.
   Fix everything before the user sees it: fix the layout errors (or waive
   intended ones with pipeline.py waive), run pipeline.py review (vision models
   with frame-review.md), fix the findings, rebuild, and repeat until clean. Then
   send the video and the sheet in chat, publish `animatic/` as a private Spot
   site (see runtime.md), give its link and wait for the user's approval of this
   animatic; record it with episode.py approve animatic. If a problem survives
   several real attempts, list it to the user in plain words; if they say render
   as is, approve with `--accept-open-issues "<reason>"`. If the user insists on
   rendering without an animatic, render with `--user-skipped-animatic "<reason>"
   --human "<name>"`. Any change after approval needs a new animatic and approval.
7. Render the final directly with --final60 (a 30 fps preview only if the user
   asks). Review the output for facts, English, readability, clipping, brand, safe
   zones and audio. Add captions or music with FFmpeg when chosen. Make the cover
   with pipeline.py cover. Deliver the final; record the user's acceptance with
   episode.py approve video.
8. Attach the actual files in chat. After final acceptance ask whether the user
   wants YouTube copy; follow youtube.md on a yes. Never upload or publish.

Changed scripts invalidate script, animatic and video approvals; changed video
bytes invalidate the video acceptance. Approvals are records of the user's
decisions, kept in episode.yaml; they are not shown to the user.
