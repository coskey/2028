# 2028 Primary Tier List

Drag-and-drop tier maker for the 2028 presidential fields, in the style of TierMaker. A D/R toggle in the
lower right switches between parties (D is the default). Each party keeps its own saved list.

- Democratic tiers: Frontrunner, Contender, Dark Horse, VP Audition, <5%, Joever.
- Republican tiers: Frontrunner, Contender, Dark Horse, Long Shot, Joever.
  Candidates: JD Vance, Marco Rubio, Ron DeSantis, Donald Trump Jr., Tucker Carlson,
  Glenn Youngkin, Thomas Massie.

Democratic field:

Candidates are everyone listed as having expressed interest or as a potential candidate on Wikipedia's
[2028 Democratic Party presidential primaries](https://en.wikipedia.org/wiki/2028_Democratic_Party_presidential_primaries) page,
plus Jon Ossoff, Wes Moore, Stephen A. Smith and Cory Booker (added by request; their photos are the lead images
from their own Wikipedia articles).

## Features

- Drag with mouse, or press and hold on touch screens. Tap a photo, then a tier, also works.
- Keyboard: focus a photo, press 1–9 to send it to a tier, 0 to return it to Unranked.
- Edit tiers: rename, recolor, add, delete, reorder.
- Rankings save in the browser automatically.
- Copy share link encodes the whole tier list in the URL.
- Save as image exports a PNG (of whichever view is on).
- Click (or tap) a ranked candidate twice to open their profile: photo, tier, total out of 50,
  rank in the field, and a bar for each score against the field average. Close with the X, Esc,
  or a click outside.
- Expanded view lists each tier's candidates as rows with 1–10 ratings for Juice, Fundraising,
  Policy, Favorability and Debate skills, plus a total out of 50. Click any score to change it.
  Edits save in the browser and travel with share links. Reset ratings restores the defaults.
  In expanded view each tier sorts by total (ties keep their dragged order), and Unranked candidates
  show as photos only. Normal view keeps the hand-arranged order.

## Files

- `index.html`, `style.css`, `app.js`: the app. Static, no build step.
- `candidates.js`: both parties' settings (header text, default tiers) and candidate lists. Ids must be unique
  across parties.
- `scores.js`: the default 1–10 scores, one line per candidate, plus the attribute names. Edit this to change
  anyone's starting scores or rename an attribute. Keys match the `id` in `candidates.js`.
- `images/<id>.jpg`: portraits from the Wikipedia article (see `images/CREDITS.md`). If a file is missing, the app loads the lead photo from the person's Wikipedia article.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Q3 2026 fundraising bubbles

`fundraising.html` is a standalone page: a packed bubble chart of 2026 Senate and Governor candidates,
sized by money raised (Democrats left, Republicans right), with a Senate/Governor toggle. Click a bubble
or a table row to open the candidate's donor profile: raised vs cash on hand, head-to-head bar, average gift,
small-dollar share, in-state share, the CAWP donor-gender benchmark for their party, race notes and sources.
Data comes from the Q3 2026 Senate/Governor/PAC fundraising workbook compiled Oct 16, 2026.
