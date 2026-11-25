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
   universal card layout for a single editorial page or `layout: scenes` for the
   shared multi-scene template. Screen scenes require an authorized local capture;
   the template does not turn an unverified mockup into product evidence. Report
   missing trusted scene support before promising a requested visual.
6. Inspect control frames, then render the full timeline at 30 fps. Review actual
   output for facts, English, readability, clipping, brand, safe zones and audio.
   Deliver preview bytes/hash and wait for explicit acceptance. Render the cover
   with pipeline.py cover and review it with the preview.
7. Preserve preview bytes and evidence, record that real decision, then render
   --final60. New bytes do not inherit preview acceptance; review/deliver and obtain
   separate acceptance of the final file/hash.
8. Verify delivery filenames, sizes and checksums against the accepted bytes.
   Attach the actual files in chat and record transfer failures and limits.
   After final acceptance ask whether the author wants YouTube copy; follow
   youtube.md only on a yes. Never upload or publish.

Freeze inputs and use one writer. Script edits invalidate script/video approvals;
video edits invalidate video acceptance. Guards/hashes are not IAM or signatures.
Raw render helpers cannot bypass production gates. TEST ONLY attestations apply
only to explicitly requested isolated technical fixtures, not production content.
Local exports never prove external publication.
