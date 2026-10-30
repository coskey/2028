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

## Horse race (`/horserace`)

`horserace/index.html` draws each party's field as a straightaway under the title "WHO'S YOUR FRONTRUNNER?".
Each candidate gets a lane and a bubble head (no names). Lane order and positions come from the
Times/Siena poll of registered voters, Oct. 12–19, 2026 (primary vote choice), stored in `horserace/poll.js`.
Only candidates on the tier list who are named in the poll are included. The leader runs in the top lane
just short of the green-and-white checkered finish. Positions use a square-root scale (the lowest share starts
about a third of the way down), so the field sits closer together than a straight proportion.
Heads can be dragged along their own lane (mouse or touch) or moved with the arrow keys; clicking a head shows
the candidate's name. "Replay the race" puts everyone back at their poll positions.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.
