# Fix food scanner for desi / ethnic dishes and any-angle photos

## Goal
The food scanner should correctly name South Asian dishes (e.g. Chicken Karahi, Aloo Gobi, Daal Makhani, Nihari, Keema, Saag, Chana Masala), work on photos taken from any angle, and stay fast.

## Steps
1. **Confirm the real cause first** — check recent logs from the food recognition service to see which AI model answered, how long it took, and what it returned for failed scans (generic name, "Unrecognized", timeout, or error).
2. **Sharper photo** — send a slightly larger, clearer photo (about 1024 px, higher quality) so curry textures, garnishes and bread types are visible. Orientation is already fixed from the camera data; also keep sideways/top-down/close-up shots handled.
3. **Better instructions to the AI** — add a curry-focused guide: tell it to look at gravy colour, oil sheen, visible meat/veg, breads (naan, roti, paratha) and rice, and to pick the closest specific dish name rather than "Curry" or "Mixed Food". Include a longer list of common desi dishes as examples.
4. **Stronger model first** — use the more accurate Gemini Flash model as the main answer (with reasoning off for speed), with the lite model only as a backup, instead of letting the lite model win on speed with a weaker guess.
5. **Handle "unsure" answers** — if the AI returns a generic label, retry once with the stronger model before showing the result.
6. **Test** with real desi curry photos (upright, rotated, top-down) and check name, calories and speed.

## Technical details
- `src/services/FoodRecognitionService.ts`: MAX_DIM 640 -> 1024, QUALITY 0.62 -> 0.8.
- `supabase/functions/recognize-food/index.ts`: expanded SYSTEM_PROMPT with visual cues + dish list; primary `gemini-flash-latest` (thinkingBudget 0), `gemini-flash-lite-latest` fallback; generic-name detection ("curry", "mixed", "rice with", "food") triggers one retry; timeout ~8s. Redeploy the function.
