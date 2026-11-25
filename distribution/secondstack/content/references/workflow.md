# Production workflow

1. Select product explicitly and complete intake using runtime/templates/brief.md
   and the format reference. Initialize a separate episode directory with
   pipeline.py init. It creates local text/state, not approval.
2. Follow research.md. Read selected Collection and actual topic-specific sources;
   record evidence and essential gaps before scripting. Boards are optional read-only
   editorial context, not product-function evidence or operational authority.
3. Fill runtime/templates/script.md with exact copy, scenes, timings and evidence
   disclosures. Use script_check.py to identify editorial issues.
   Present revision and SHA-256; wait for the actual explicit human decision. Only
   then record it through episode.py approve. A name/confirm flag is not identity.
4. After approval, import selected authorized English audio and timings, if any.
   A supplied recording may be transcribed before the script as research.
   Verify actual speech and alignment. Never replace supplied narration without
   permission. No-voice is an explicit intake choice, not an integration fallback.
5. Populate content.json from approved copy and use pipeline.py build. Use the
   universal card layout for a single editorial page, `layout: scenes` for the
   shared multi-scene template, or `layout: custom` for a full-screen animation you
   write yourself (characters, mascots, generated product UI; see runtime.md). Screen scenes take
   a local image or video (a capture or one you generated). Visuals never replace
   sources for product claims.
6. Animatic before any render, for every video: pipeline.py animatic builds, in
   minutes, `media/animatic.mp4` (a frame every 2 s with the voice, for the chat),
   `media/animatic-sheet.jpg` (one frame per scene) and `animatic/` (an
   interactive browser player of the real pages). Check the frames yourself, send
   the video and the sheet in chat, publish `animatic/` as a private Spot site
   (see runtime.md) and give its link, then wait for an explicit human approval
   of this animatic. Record it with
   episode.py approve animatic. Any change after that needs a rebuild, a new
   animatic and a new approval; the renderer refuses otherwise.
7. After animatic approval render the final directly with --final60 (no 30 fps
   preview unless the user asks for one). Review the actual output for facts,
   English, readability, clipping, brand, safe zones and audio. Render the cover
   with pipeline.py cover. Deliver the final and obtain separate acceptance of
   the final file (episode.py approve video).
8. Verify delivery filenames, sizes and checksums against the accepted bytes.
   Attach the actual files in chat and record transfer failures and limits.
   After final acceptance ask whether the author wants YouTube copy; follow
   youtube.md only on a yes. Never upload or publish.

Freeze inputs and use one writer. Script edits invalidate script/video approvals;
video edits invalidate video acceptance. Guards/hashes are not IAM or signatures.
Raw render helpers cannot bypass production gates. TEST ONLY attestations apply
only to explicitly requested isolated technical fixtures, not production content.
Local exports never prove external publication.
