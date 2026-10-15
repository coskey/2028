// Candidates from https://en.wikipedia.org/wiki/2028_Democratic_Party_presidential_primaries
// `wiki` is the article title, used to fetch the portrait if images/<id>.jpg is missing.
window.CANDIDATE_GROUPS = {
  interest: 'Expressed interest',
  potential: 'Potential',
  added: 'Added by request (not listed in the article)',
};

// Default 1–10 ratings for expanded view, in RATING_FIELDS order. Viewers can edit their own copy.
window.RATING_FIELDS = ['Juice', 'Fundraising', 'Policy', 'Favorability', 'Debate skills'];

window.CANDIDATES = [
  { id: 'beshear', name: 'Andy Beshear', role: 'Governor of Kentucky', years: '2019–present', group: 'interest', wiki: 'Andy_Beshear', ratings: [5, 6, 7, 7, 6] },
  { id: 'buttigieg', name: 'Pete Buttigieg', role: 'Former Secretary of Transportation, Michigan', years: '2021–2025', group: 'interest', wiki: 'Pete_Buttigieg', ratings: [8, 8, 7, 6, 9] },
  { id: 'emanuel', name: 'Rahm Emanuel', role: 'Former Ambassador to Japan, Illinois', years: '2022–2025', group: 'interest', wiki: 'Rahm_Emanuel', ratings: [4, 7, 6, 3, 7] },
  { id: 'harris', name: 'Kamala Harris', role: 'Former Vice President, California', years: '2021–2025', group: 'interest', wiki: 'Kamala_Harris', ratings: [6, 10, 6, 4, 6] },
  { id: 'kelly', name: 'Mark Kelly', role: 'Senator from Arizona', years: '2020–present', group: 'interest', wiki: 'Mark_Kelly', ratings: [5, 8, 6, 7, 5] },
  { id: 'khanna', name: 'Ro Khanna', role: 'Representative from California', years: '2017–present', group: 'interest', wiki: 'Ro_Khanna', ratings: [5, 6, 7, 5, 7] },
  { id: 'landrieu', name: 'Mitch Landrieu', role: 'Former Senior Advisor to the President, Louisiana', years: '2021–2024', group: 'interest', wiki: 'Mitch_Landrieu', ratings: [2, 5, 6, 5, 6] },
  { id: 'lemon', name: 'Don Lemon', role: 'Former news anchor, Louisiana', years: '', group: 'interest', wiki: 'Don_Lemon', ratings: [2, 3, 3, 3, 6] },
  { id: 'newsom', name: 'Gavin Newsom', role: 'Governor of California', years: '2019–present', group: 'interest', wiki: 'Gavin_Newsom', note: "Won't run if Harris runs", ratings: [8, 9, 6, 4, 8] },
  { id: 'ocasio-cortez', name: 'Alexandria Ocasio-Cortez', role: 'Representative from New York', years: '2019–present', group: 'interest', wiki: 'Alexandria_Ocasio-Cortez', ratings: [9, 10, 7, 5, 8] },
  { id: 'slotkin', name: 'Elissa Slotkin', role: 'Senator from Michigan', years: '2025–present', group: 'interest', wiki: 'Elissa_Slotkin', ratings: [4, 6, 6, 6, 5] },
  { id: 'van-hollen', name: 'Chris Van Hollen', role: 'Senator from Maryland', years: '2017–present', group: 'interest', wiki: 'Chris_Van_Hollen', ratings: [4, 5, 6, 5, 5] },
  { id: 'whitmer', name: 'Gretchen Whitmer', role: 'Governor of Michigan', years: '2019–present', group: 'interest', wiki: 'Gretchen_Whitmer', ratings: [5, 7, 7, 6, 6] },
  { id: 'murphy', name: 'Chris Murphy', role: 'Senator from Connecticut', years: '2013–present', group: 'potential', wiki: 'Chris_Murphy', ratings: [5, 7, 7, 5, 7] },
  { id: 'pritzker', name: 'JB Pritzker', role: 'Governor of Illinois', years: '2019–present', group: 'potential', wiki: 'JB_Pritzker', ratings: [6, 10, 7, 6, 6] },
  { id: 'shapiro', name: 'Josh Shapiro', role: 'Governor of Pennsylvania', years: '2023–present', group: 'potential', wiki: 'Josh_Shapiro', ratings: [7, 8, 6, 7, 7] },
  { id: 'warnock', name: 'Raphael Warnock', role: 'Senator from Georgia', years: '2021–present', group: 'potential', wiki: 'Raphael_Warnock', ratings: [4, 7, 6, 6, 7] },
  { id: 'ossoff', name: 'Jon Ossoff', role: 'Senator from Georgia', years: '2021–present', group: 'added', wiki: 'Jon_Ossoff', ratings: [6, 9, 6, 6, 7] },
  { id: 'moore', name: 'Wes Moore', role: 'Governor of Maryland', years: '2023–present', group: 'added', wiki: 'Wes_Moore', ratings: [7, 8, 6, 7, 7] },
  { id: 'smith', name: 'Stephen A. Smith', role: 'ESPN commentator, New York', years: '', group: 'added', wiki: 'Stephen_A._Smith', ratings: [6, 5, 2, 4, 8] },
  { id: 'booker', name: 'Cory Booker', role: 'Senator from New Jersey', years: '2013–present', group: 'added', wiki: 'Cory_Booker', ratings: [6, 8, 6, 5, 7] },
];
