// Candidate scores for expanded view and profiles. Edit freely: each score is a whole number from 1 to 10.
// Keys must match the `id` in candidates.js (both parties share this map). A missing score shows as 5.
// Viewers can change scores on the page; their edits are saved in their own browser and in share links,
// and only override the scores that differ from this file.

// Attribute key -> column title, in display order.
window.SCORE_FIELDS = {
  juice: 'Juice',
  fundraising: 'Fundraising',
  policy: 'Policy',
  favorability: 'Favorability',
  debate: 'Debate skills',
};

window.CANDIDATE_SCORES = {
  // Democrats
  beshear:         { juice:  5, fundraising:  6, policy:  7, favorability:  7, debate:  6 },
  buttigieg:       { juice:  8, fundraising:  8, policy:  7, favorability:  6, debate:  9 },
  emanuel:         { juice:  4, fundraising:  7, policy:  6, favorability:  3, debate:  7 },
  harris:          { juice:  6, fundraising: 10, policy:  6, favorability:  4, debate:  6 },
  kelly:           { juice:  5, fundraising:  8, policy:  6, favorability:  7, debate:  5 },
  khanna:          { juice:  5, fundraising:  6, policy:  7, favorability:  5, debate:  7 },
  landrieu:        { juice:  2, fundraising:  5, policy:  6, favorability:  5, debate:  6 },
  lemon:           { juice:  2, fundraising:  3, policy:  3, favorability:  3, debate:  6 },
  newsom:          { juice:  8, fundraising:  9, policy:  6, favorability:  4, debate:  8 },
  'ocasio-cortez': { juice:  9, fundraising: 10, policy:  7, favorability:  5, debate:  8 },
  slotkin:         { juice:  4, fundraising:  6, policy:  6, favorability:  6, debate:  5 },
  'van-hollen':    { juice:  4, fundraising:  5, policy:  6, favorability:  5, debate:  5 },
  whitmer:         { juice:  5, fundraising:  7, policy:  7, favorability:  6, debate:  6 },
  murphy:          { juice:  5, fundraising:  7, policy:  7, favorability:  5, debate:  7 },
  pritzker:        { juice:  6, fundraising: 10, policy:  7, favorability:  6, debate:  6 },
  shapiro:         { juice:  7, fundraising:  8, policy:  6, favorability:  7, debate:  7 },
  warnock:         { juice:  4, fundraising:  7, policy:  6, favorability:  6, debate:  7 },
  ossoff:          { juice:  6, fundraising:  9, policy:  6, favorability:  6, debate:  7 },
  moore:           { juice:  7, fundraising:  8, policy:  6, favorability:  7, debate:  7 },
  smith:           { juice:  6, fundraising:  5, policy:  2, favorability:  4, debate:  8 },
  booker:          { juice:  6, fundraising:  8, policy:  6, favorability:  5, debate:  7 },

  // Republicans
  vance:           { juice:  8, fundraising:  9, policy:  7, favorability:  5, debate:  8 },
  rubio:           { juice:  6, fundraising:  8, policy:  8, favorability:  6, debate:  8 },
  desantis:        { juice:  4, fundraising:  8, policy:  7, favorability:  5, debate:  6 },
  trump:           { juice: 10, fundraising: 10, policy:  5, favorability:  5, debate:  7 },
  'trump-jr':      { juice:  6, fundraising:  8, policy:  3, favorability:  4, debate:  6 },
  carlson:         { juice:  6, fundraising:  6, policy:  4, favorability:  4, debate:  8 },
  youngkin:        { juice:  4, fundraising:  8, policy:  6, favorability:  6, debate:  6 },
  massie:          { juice:  5, fundraising:  6, policy:  6, favorability:  4, debate:  6 },
};
