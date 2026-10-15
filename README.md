# 2028 Democratic Tier List

Drag-and-drop tier maker for the 2028 Democratic presidential field, in the style of TierMaker.

Tiers: Frontrunner, Contender, Dark Horse, VP Audition, <5%, Joever.

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
- Expanded view lists each tier's candidates as rows with 1–10 ratings for Juice, Fundraising,
  Policy, Favorability and Debate skills, plus a total out of 50. Click any score to change it.
  Edits save in the browser and travel with share links. Reset ratings restores the defaults.

## Files

- `index.html`, `style.css`, `app.js`: the app. Static, no build step.
- `candidates.js`: the candidate list and default ratings. Edit this to add or remove people or change the starting scores.
- `images/<id>.jpg`: portraits from the Wikipedia article (see `images/CREDITS.md`). If a file is missing, the app loads the lead photo from the person's Wikipedia article.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.
