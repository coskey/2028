// Primary vote choice from the Times/Siena poll of registered voters, Oct. 12-19, 2026.
// Only candidates who are on the tier list AND named in the poll get a lane.
// `pct` is the topline as printed. '<1' and '<.5' are placed at 0.75 and 0.25 points.
// Lane order follows this list (first = inside lane), so ties keep the poll's printed order.
window.POLL = {
  source: 'Times/Siena poll of registered voters, Oct. 12–19, 2026',
  D: {
    title: 'Democrats',
    universe: 'Voters planning to vote in the Democratic primary (n = 1,170)',
    field: [
      { id: 'harris', name: 'Kamala Harris', pct: 12 },
      { id: 'newsom', name: 'Gavin Newsom', pct: 9 },
      { id: 'buttigieg', name: 'Pete Buttigieg', pct: 7 },
      { id: 'ocasio-cortez', name: 'Alexandria Ocasio-Cortez', pct: 6 },
      { id: 'ossoff', name: 'Jon Ossoff', pct: 4 },
      { id: 'kelly', name: 'Mark Kelly', pct: 3 },
      { id: 'pritzker', name: 'JB Pritzker', pct: 2 },
      { id: 'shapiro', name: 'Josh Shapiro', pct: 1 },
      { id: 'beshear', name: 'Andy Beshear', pct: 1 },
      { id: 'moore', name: 'Wes Moore', pct: '<1' },
      { id: 'booker', name: 'Cory Booker', pct: '<.5' },
      { id: 'emanuel', name: 'Rahm Emanuel', pct: '<.5' },
    ],
  },
  R: {
    title: 'Republicans',
    universe: 'Voters planning to vote in the Republican primary (n = 850)',
    field: [
      { id: 'vance', name: 'JD Vance', pct: 33 },
      { id: 'rubio', name: 'Marco Rubio', pct: 23 },
      { id: 'desantis', name: 'Ron DeSantis', pct: 3 },
      { id: 'trump-jr', name: 'Donald Trump Jr.', pct: 1 },
      { id: 'carlson', name: 'Tucker Carlson', pct: '<1' },
      { id: 'massie', name: 'Thomas Massie', pct: '<.5' },
    ],
  },
};
