// Candidates from https://en.wikipedia.org/wiki/2028_Democratic_Party_presidential_primaries
// `wiki` is the article title, used to fetch the portrait if images/<id>.jpg is missing.
window.CANDIDATE_GROUPS = {
  interest: 'Expressed interest',
  potential: 'Potential',
  added: 'Added by request (not listed in the article)',
};

// Scores live in scores.js.

window.CANDIDATES = [
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
];
