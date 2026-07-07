// Built-in demo catalog (fictional titles from the CineTrack design mockups).
// Lets the app work fully offline / without a TMDB key. Air dates are computed
// relative to "now" so the Upcoming screen always has content.

const DAY = 24 * 60 * 60 * 1000

function iso(daysFromNow) {
  return new Date(Date.now() + daysFromNow * DAY).toISOString().slice(0, 10)
}

// Build a season: `lastAired` = days ago the latest episode aired (negative = future premiere)
function season(n, count, { firstAt, everyDays = 7, runtime = 45, names = {} }) {
  const episodes = []
  for (let e = 1; e <= count; e++) {
    episodes.push({
      n: e,
      name: names[e] || `Episode ${e}`,
      air: iso(firstAt + (e - 1) * everyDays),
      runtime,
    })
  }
  return { n, episodes }
}

export function demoShows() {
  return [
    {
      id: 'd-tv-neotokyo', type: 'tv', name: 'Neo-Tokyo 2088', year: 2024,
      genres: ['Sci-Fi', 'Action'], vote: 8.6, network: 'HBO', airTime: '9:00 PM',
      overview: 'In a megacity run by sentient code, a rogue courier uncovers the signal that could reboot humanity — or erase it.',
      grad: ['#0f2027', '#4a00e0'], icon: 'location_city', episodeRunTime: 48,
      seasons: [
        season(1, 12, { firstAt: -400, runtime: 48 }),
        season(2, 12, { firstAt: -35, runtime: 48, names: { 6: 'Ghost Frequency' } }),
      ],
    },
    {
      id: 'd-tv-shadow', type: 'tv', name: 'Shadow Protocol', year: 2025,
      genres: ['Drama', 'Thriller'], vote: 8.2, network: 'Prime Video', airTime: '8:00 PM',
      overview: 'A character-driven drama of high-stakes corporate espionage where every handshake hides a knife.',
      grad: ['#232526', '#414345'], icon: 'business_center', episodeRunTime: 52,
      seasons: [season(1, 10, { firstAt: -60, runtime: 52, names: { 9: 'The Long Game' } })],
    },
    {
      id: 'd-tv-amber', type: 'tv', name: 'The Amber Woods', year: 2022,
      genres: ['Fantasy', 'Adventure'], vote: 8.0, network: 'Netflix', airTime: '10:00 AM',
      overview: 'Two wardens guard a bioluminescent forest whose magic wakes once a generation — and it just woke early.',
      grad: ['#134e5e', '#71b280'], icon: 'forest', episodeRunTime: 44,
      seasons: [
        season(1, 10, { firstAt: -900, runtime: 44 }),
        season(2, 10, { firstAt: -500, runtime: 44 }),
        season(3, 12, { firstAt: -14, runtime: 44 }),
      ],
    },
    {
      id: 'd-tv-street', type: 'tv', name: 'Street Logic', year: 2021,
      genres: ['Crime', 'Drama'], vote: 8.4, network: 'FX', airTime: '11:00 PM',
      overview: 'Crime noir in a rain-slicked city where the only law that holds is the logic of the street.',
      grad: ['#1f1c2c', '#928dab'], icon: 'ev_shadow', episodeRunTime: 50,
      seasons: [
        season(1, 22, { firstAt: -1200, everyDays: 5, runtime: 50 }),
        season(2, 22, { firstAt: -1000, everyDays: 5, runtime: 50 }),
        season(3, 22, { firstAt: -700, everyDays: 5, runtime: 50 }),
        season(4, 22, { firstAt: -70, everyDays: 5, runtime: 50 }),
      ],
    },
    {
      id: 'd-tv-estate', type: 'tv', name: 'Estate & Honor', year: 2020,
      genres: ['Drama', 'Romance'], vote: 7.9, network: 'BBC One', airTime: '7:00 PM',
      overview: 'The gilded legacy of a great house, where ambition always arrives dressed for dinner.',
      grad: ['#3e2723', '#b8860b'], icon: 'castle', episodeRunTime: 55,
      seasons: [
        season(1, 8, { firstAt: -1500, runtime: 55 }),
        season(2, 8, { firstAt: -1100, runtime: 55 }),
        season(3, 8, { firstAt: -800, runtime: 55 }),
        season(4, 8, { firstAt: -400, runtime: 55 }),
        season(5, 8, { firstAt: -21, runtime: 55 }),
      ],
    },
    {
      id: 'd-tv-vital', type: 'tv', name: 'Vital Signs', year: 2025,
      genres: ['Drama'], vote: 7.6, network: 'ABC', airTime: '9:00 PM',
      overview: 'A night-shift trauma team fights for every pulse. درامة نبض لا يتوقف.',
      grad: ['#dfe9f3', '#7f8c8d'], icon: 'ecg_heart', episodeRunTime: 43,
      seasons: [season(1, 13, { firstAt: -30, runtime: 43, names: { 6: 'Flatline' } })],
    },
    {
      id: 'd-tv-cyber', type: 'tv', name: 'Cyber-Pulse', year: 2025,
      genres: ['Animation', 'Sci-Fi'], vote: 8.8, network: 'Crunchyroll', airTime: '6:00 PM',
      overview: 'Luna and Jax surf the datastream in a neon riot of a future — a revolution told in 24 frames.',
      grad: ['#fc466b', '#3f5efb'], icon: 'bolt', episodeRunTime: 24,
      seasons: [season(1, 24, { firstAt: -10, runtime: 24 })],
    },
    {
      id: 'd-tv-lastempire', type: 'tv', name: 'The Last Empire', year: 2023,
      genres: ['Drama', 'History'], vote: 8.7, network: 'Apple TV+', airTime: '9:00 PM',
      overview: 'The final decade of an empire, told through the servants who kept its clocks running.',
      grad: ['#41295a', '#2f0743'], icon: 'account_balance', episodeRunTime: 50,
      seasons: [
        season(1, 10, { firstAt: -700, runtime: 50 }),
        season(2, 10, { firstAt: -350, runtime: 50 }),
        season(3, 10, { firstAt: -18, runtime: 50 }),
      ],
    },
    {
      id: 'd-tv-epoch', type: 'tv', name: 'The Last Epoch', year: 2024,
      genres: ['Sci-Fi', 'Mystery'], vote: 8.3, network: 'HBO', airTime: '9:00 PM',
      overview: 'Time is a resource, and the mines are running dry.',
      grad: ['#0f0c29', '#f5af19'], icon: 'hourglass_top', episodeRunTime: 55,
      seasons: [
        season(1, 8, { firstAt: -380, runtime: 55 }),
        season(2, 8, { firstAt: -49, runtime: 55, names: { 8: 'Echoes of Silence' } }),
      ],
    },
    {
      id: 'd-tv-bloodline', type: 'tv', name: 'Bloodline Tactics', year: 2025,
      genres: ['Thriller', 'Crime'], vote: 7.8, network: 'Netflix', airTime: '10:30 PM',
      overview: 'A family of fixers plays chess with the city — الساعة صفر تقترب.',
      grad: ['#200122', '#6f0000'], icon: 'swords', episodeRunTime: 47,
      seasons: [season(1, 8, { firstAt: -21, runtime: 47, names: { 4: 'The Vault' } })],
    },
    {
      id: 'd-tv-ether', type: 'tv', name: 'Ether Realm', year: 2021,
      genres: ['Animation', 'Fantasy'], vote: 8.5, network: 'Disney+', airTime: '8:00 AM',
      overview: 'Two siblings cross into the realm where dreams are drafted before we dream them.',
      grad: ['#1a2980', '#26d0ce'], icon: 'auto_awesome', episodeRunTime: 26,
      seasons: [
        season(1, 12, { firstAt: -1000, runtime: 26 }),
        season(2, 12, { firstAt: -650, runtime: 26 }),
        season(3, 12, { firstAt: -300, runtime: 26 }),
        season(4, 12, { firstAt: -76, runtime: 26, names: { 12: 'Dawn of the Spirit' } }),
      ],
    },
    {
      id: 'd-tv-dunes', type: 'tv', name: 'Dunes of Time', year: 2023,
      genres: ['Adventure', 'Drama'], vote: 8.9, network: 'HBO', airTime: '9:00 PM',
      overview: 'An epic ride across a desert that remembers every empire that tried to cross it.',
      grad: ['#c33764', '#f8b500'], icon: 'landscape', episodeRunTime: 58,
      seasons: [
        season(1, 9, { firstAt: -800, runtime: 58 }),
        season(2, 9, { firstAt: -450, runtime: 58 }),
        season(3, 9, { firstAt: 4, runtime: 58, names: { 1: 'Season Premiere' } }),
      ],
    },
    {
      id: 'd-tv-grid', type: 'tv', name: 'Grid Legend', year: 2024,
      genres: ['Documentary'], vote: 7.7, network: 'Netflix', airTime: '7:00 PM',
      overview: 'Trails of speed — ملاحق السرعة: a documentary series on the evolution of motorsports technology.',
      grad: ['#141e30', '#f7971e'], icon: 'sports_motorsports', episodeRunTime: 40,
      seasons: [season(1, 6, { firstAt: -18, everyDays: 7, runtime: 40 })],
    },
    {
      id: 'd-tv-cortex', type: 'tv', name: 'Cortex', year: 2025,
      genres: ['Mystery', 'Thriller'], vote: 8.1, network: 'Hulu', airTime: '11:00 PM',
      overview: 'Every mind is a locked room. She picks locks.',
      grad: ['#16222a', '#3a6073'], icon: 'extension', episodeRunTime: 46,
      seasons: [season(1, 10, { firstAt: -30, runtime: 46 })],
    },
    {
      id: 'd-tv-silentharbor', type: 'tv', name: 'Silent Harbor', year: 2024,
      genres: ['Drama', 'Mystery'], vote: 7.5, network: 'Showtime', airTime: '9:00 PM',
      overview: 'A lighthouse town where the fog keeps more secrets than the sea.',
      grad: ['#2c3e50', '#4ca1af'], icon: 'foggy', episodeRunTime: 49,
      seasons: [season(1, 8, { firstAt: -120, runtime: 49 })],
    },
    {
      id: 'd-tv-papercrowns', type: 'tv', name: 'Paper Crowns', year: 2023,
      genres: ['Comedy', 'Drama'], vote: 7.3, network: 'Peacock', airTime: '8:30 PM',
      overview: 'A bankrupt theater troupe fakes royalty for one last season of glory.',
      grad: ['#5d4157', '#a8caba'], icon: 'theater_comedy', episodeRunTime: 30,
      seasons: [season(1, 10, { firstAt: -200, runtime: 30 })],
    },
    {
      id: 'd-tv-irondynasty', type: 'tv', name: 'Iron Dynasty', year: 2024,
      genres: ['Drama', 'History'], vote: 9.0, network: 'FX', airTime: '10:00 PM',
      overview: 'A shogunate epic of steel, silk and succession.',
      grad: ['#1d1d1d', '#8e0e00'], icon: 'fort', episodeRunTime: 60,
      seasons: [season(1, 10, { firstAt: -300, runtime: 60 })],
    },
  ]
}

export function demoMovies() {
  return [
    {
      id: 'd-mv-neon', type: 'movie', title: 'Neon Shadows: Genesis', year: 2024,
      genres: ['Sci-Fi', 'Thriller'], vote: 8.1, runtime: 132,
      overview: 'In a world where memories can be traded, a detective must solve a murder where the only witness sold what she saw.',
      grad: ['#20002c', '#cbb4d4'], icon: 'psychology', hero: true,
    },
    {
      id: 'd-mv-grove', type: 'movie', title: 'The Silent Grove', year: 2023,
      genres: ['Thriller', 'Horror'], vote: 8.4, runtime: 118,
      overview: 'الكسوف الداخلي — a lantern, a forest, and a silence that answers back.',
      grad: ['#000000', '#434343'], icon: 'dark_mode',
    },
    {
      id: 'd-mv-skybound', type: 'movie', title: 'Skybound Legends', year: 2024,
      genres: ['Animation', 'Adventure'], vote: 7.9, runtime: 104,
      overview: 'مملكة السحاب: رحلة الأساطير — a flight through the kingdom of clouds.',
      grad: ['#7f00ff', '#e100ff'], icon: 'flight_takeoff',
    },
    {
      id: 'd-mv-frequency', type: 'movie', title: 'Midnight Frequency', year: 2024,
      genres: ['Mystery', 'Sci-Fi'], vote: 7.4, runtime: 111,
      overview: 'A late-night radio host takes a call from tomorrow.',
      grad: ['#0f2027', '#2c5364'], icon: 'radio',
    },
    {
      id: 'd-mv-royal', type: 'movie', title: 'Royal Bloodline', year: 2023,
      genres: ['Drama', 'History'], vote: 7.8, runtime: 126,
      overview: 'التاج المذهب — in a kingdom built on secrets, her reign begins in the silliest of gowns and the sharpest of knives.',
      grad: ['#3a1c71', '#d76d77'], icon: 'crown',
    },
    {
      id: 'd-mv-echoes', type: 'movie', title: 'Echoes of Summer', year: 2024,
      genres: ['Romance', 'Drama'], vote: 7.2, runtime: 98,
      overview: 'المد بيننا — two souls find solace in the quiet dawn before the inevitable tide.',
      grad: ['#355c7d', '#c06c84'], icon: 'waves',
    },
    {
      id: 'd-mv-tide', type: 'movie', title: 'The Tide Between Us', year: 2023,
      genres: ['Romance'], vote: 7.0, runtime: 102,
      overview: 'A modern romantic drama about what the sea returns.',
      grad: ['#4b6cb7', '#182848'], icon: 'sailing',
    },
    {
      id: 'd-mv-circuit', type: 'movie', title: 'Crimson Circuit', year: 2022,
      genres: ['Action'], vote: 6.9, runtime: 121,
      overview: 'One night. One city. Every red light means go.',
      grad: ['#93291e', '#ed213a'], icon: 'speed',
    },
    {
      id: 'd-mv-dust', type: 'movie', title: 'Dust of Empires', year: 2021,
      genres: ['History', 'Drama'], vote: 8.0, runtime: 143,
      overview: 'The archaeologists who dug too deep and the empire that was waiting.',
      grad: ['#ba8b02', '#181818'], icon: 'temple_hindu',
    },
    {
      id: 'd-mv-laughing', type: 'movie', title: 'Laughing Matters', year: 2023,
      genres: ['Comedy'], vote: 6.8, runtime: 95,
      overview: 'A grief counselor moonlights as a stand-up comic. Both jobs get complicated.',
      grad: ['#f2994a', '#f2c94c'], icon: 'sentiment_very_satisfied',
    },
  ]
}

// Watch-progress the app is seeded with on first run (matches the design mockups).
export const DEMO_SEED = {
  shows: [
    { id: 'd-tv-neotokyo', status: 'watching', watchedThrough: { 1: 12, 2: 5 } },
    { id: 'd-tv-shadow', status: 'watching', watchedThrough: { 1: 8 } },
    { id: 'd-tv-amber', status: 'watching', watchedThrough: { 1: 10, 2: 10, 3: 1 } },
    { id: 'd-tv-street', status: 'watching', watchedThrough: { 1: 22, 2: 22, 3: 22, 4: 10 } },
    { id: 'd-tv-estate', status: 'watching', watchedThrough: { 1: 8, 2: 8, 3: 8, 4: 8, 5: 3 } },
    { id: 'd-tv-vital', status: 'watching', watchedThrough: { 1: 5 } },
    { id: 'd-tv-cyber', status: 'watching', watchedThrough: { 1: 2 } },
    { id: 'd-tv-lastempire', status: 'watching', watchedThrough: { 1: 10, 2: 10, 3: 4 } },
    { id: 'd-tv-epoch', status: 'watching', watchedThrough: { 1: 8, 2: 7 } },
    { id: 'd-tv-bloodline', status: 'watching', watchedThrough: { 1: 3 } },
    { id: 'd-tv-ether', status: 'watching', watchedThrough: { 1: 12, 2: 12, 3: 12, 4: 11 } },
    { id: 'd-tv-dunes', status: 'watching', watchedThrough: { 1: 9, 2: 9 } },
    { id: 'd-tv-grid', status: 'watching', watchedThrough: { 1: 2 } },
    { id: 'd-tv-cortex', status: 'watching', watchedThrough: { 1: 5 } },
    { id: 'd-tv-silentharbor', status: 'plan', watchedThrough: {} },
    { id: 'd-tv-papercrowns', status: 'plan', watchedThrough: {} },
    { id: 'd-tv-irondynasty', status: 'completed', watchedThrough: { 1: 10 }, rating: 5 },
  ],
  movies: [
    { id: 'd-mv-royal', status: 'watchlist' },
    { id: 'd-mv-echoes', status: 'watchlist' },
    { id: 'd-mv-tide', status: 'watched', rating: 4 },
    { id: 'd-mv-circuit', status: 'watched', rating: 3 },
    { id: 'd-mv-dust', status: 'watched', rating: 5 },
  ],
}

export const DEMO_GENRES = [
  'Action', 'Sci-Fi', 'Documentary', 'Comedy', 'Horror', 'Anime', 'Thriller', 'Romance',
]
