// Candidate lists for each party. Scores live in scores.js; photos are images/<id>.jpg.
// `wiki` is the Wikipedia article title, used to fetch a portrait if images/<id>.jpg is missing.
// Every id must be unique across both parties, because scores.js uses one shared map.

window.PARTIES = {
  D: {
    name: 'Democratic',
    eyebrow: 'Democratic presidential primaries · 2028',
    exportTitle: 'MY 2028 DEMOCRATIC TIER LIST',
    exportSource: 'Candidates from Wikipedia: 2028 Democratic Party presidential primaries',
    sourcesHtml: 'Candidates: everyone listed as having expressed interest or as a potential candidate on Wikipedia\'s ' +
      '<a href="https://en.wikipedia.org/wiki/2028_Democratic_Party_presidential_primaries" target="_blank" rel="noopener">2028 Democratic Party presidential primaries</a> page, ' +
      'plus Jon Ossoff, Wes Moore, Stephen A. Smith and Cory Booker. No one has formally declared. Photos via Wikimedia Commons.',
    tiers: [
      { label: 'Frontrunner', color: '#3fbf6b' },
      { label: 'Contender', color: '#9acd52' },
      { label: 'Dark Horse', color: '#e2cf45' },
      { label: 'VP Audition', color: '#f0a948' },
      { label: '<5%', color: '#ec7f4a' },
      { label: 'Joever', color: '#df4d55' },
    ],
    candidates: [
      { id: 'beshear', name: 'Andy Beshear', role: 'Governor of Kentucky', years: '2019–present', group: 'interest', wiki: 'Andy_Beshear' },
      { id: 'buttigieg', name: 'Pete Buttigieg', role: 'Former Secretary of Transportation, Michigan', years: '2021–2025', group: 'interest', wiki: 'Pete_Buttigieg' },
      { id: 'emanuel', name: 'Rahm Emanuel', role: 'Former Ambassador to Japan, Illinois', years: '2022–2025', group: 'interest', wiki: 'Rahm_Emanuel' },
      { id: 'harris', name: 'Kamala Harris', role: 'Former Vice President, California', years: '2021–2025', group: 'interest', wiki: 'Kamala_Harris' },
      { id: 'kelly', name: 'Mark Kelly', role: 'Senator from Arizona', years: '2020–present', group: 'interest', wiki: 'Mark_Kelly' },
      { id: 'khanna', name: 'Ro Khanna', role: 'Representative from California', years: '2017–present', group: 'interest', wiki: 'Ro_Khanna' },
      { id: 'landrieu', name: 'Mitch Landrieu', role: 'Former Senior Advisor to the President, Louisiana', years: '2021–2024', group: 'interest', wiki: 'Mitch_Landrieu' },
      { id: 'lemon', name: 'Don Lemon', role: 'Former news anchor, Louisiana', years: '', group: 'interest', wiki: 'Don_Lemon' },
      { id: 'newsom', name: 'Gavin Newsom', role: 'Governor of California', years: '2019–present', group: 'interest', wiki: 'Gavin_Newsom', note: "Won't run if Harris runs" },
      { id: 'ocasio-cortez', name: 'Alexandria Ocasio-Cortez', role: 'Representative from New York', years: '2019–present', group: 'interest', wiki: 'Alexandria_Ocasio-Cortez' },
      { id: 'slotkin', name: 'Elissa Slotkin', role: 'Senator from Michigan', years: '2025–present', group: 'interest', wiki: 'Elissa_Slotkin' },
      { id: 'van-hollen', name: 'Chris Van Hollen', role: 'Senator from Maryland', years: '2017–present', group: 'interest', wiki: 'Chris_Van_Hollen' },
      { id: 'whitmer', name: 'Gretchen Whitmer', role: 'Governor of Michigan', years: '2019–present', group: 'interest', wiki: 'Gretchen_Whitmer' },
      { id: 'murphy', name: 'Chris Murphy', role: 'Senator from Connecticut', years: '2013–present', group: 'potential', wiki: 'Chris_Murphy' },
      { id: 'pritzker', name: 'JB Pritzker', role: 'Governor of Illinois', years: '2019–present', group: 'potential', wiki: 'JB_Pritzker' },
      { id: 'shapiro', name: 'Josh Shapiro', role: 'Governor of Pennsylvania', years: '2023–present', group: 'potential', wiki: 'Josh_Shapiro' },
      { id: 'warnock', name: 'Raphael Warnock', role: 'Senator from Georgia', years: '2021–present', group: 'potential', wiki: 'Raphael_Warnock' },
      { id: 'ossoff', name: 'Jon Ossoff', role: 'Senator from Georgia', years: '2021–present', group: 'added', wiki: 'Jon_Ossoff' },
      { id: 'moore', name: 'Wes Moore', role: 'Governor of Maryland', years: '2023–present', group: 'added', wiki: 'Wes_Moore' },
      { id: 'smith', name: 'Stephen A. Smith', role: 'ESPN commentator, New York', years: '', group: 'added', wiki: 'Stephen_A._Smith' },
      { id: 'booker', name: 'Cory Booker', role: 'Senator from New Jersey', years: '2013–present', group: 'added', wiki: 'Cory_Booker' },
    ],
  },

  R: {
    name: 'Republican',
    eyebrow: 'Republican presidential primaries · 2028',
    exportTitle: 'MY 2028 REPUBLICAN TIER LIST',
    exportSource: '2028 Republican field. Photos via Wikimedia Commons',
    sourcesHtml: 'Candidates: JD Vance, Marco Rubio, Ron DeSantis, Donald Trump Jr., Tucker Carlson, Glenn Youngkin and Thomas Massie. ' +
      'Photos are the lead images from each person\'s Wikipedia article, via Wikimedia Commons.',
    tiers: [
      { label: 'Frontrunner', color: '#3fbf6b' },
      { label: 'Contender', color: '#9acd52' },
      { label: 'Dark Horse', color: '#e2cf45' },
      { label: 'Long Shot', color: '#f0a948' },
      { label: 'Joever', color: '#df4d55' },
    ],
    candidates: [
      { id: 'vance', name: 'JD Vance', role: 'Vice President, Ohio', years: '2025–present', wiki: 'JD_Vance' },
      { id: 'rubio', name: 'Marco Rubio', role: 'Secretary of State, Florida', years: '2025–present', wiki: 'Marco_Rubio' },
      { id: 'desantis', name: 'Ron DeSantis', role: 'Governor of Florida', years: '2019–present', wiki: 'Ron_DeSantis' },
      { id: 'trump-jr', name: 'Donald Trump Jr.', role: 'Businessman and political commentator, Florida', years: '', wiki: 'Donald_Trump_Jr.' },
      { id: 'carlson', name: 'Tucker Carlson', role: 'Podcaster and former Fox News host', years: '', wiki: 'Tucker_Carlson' },
      { id: 'youngkin', name: 'Glenn Youngkin', role: 'Former Governor of Virginia', years: '2022–2026', wiki: 'Glenn_Youngkin' },
      { id: 'massie', name: 'Thomas Massie', role: 'Representative from Kentucky', years: '2012–present', wiki: 'Thomas_Massie' },
    ],
  },
};
