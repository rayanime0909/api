function translateStatus(status) {
  const statusMap = {
    "Finished Airing": "مُكتمل",
    "Currently Airing": "مستمر",
    "Not yet aired": "لم يُبث بعد",
  };
  return statusMap[status] || status;
}

function translateSeason(season) {
  const seasonMap = {
    fall: "خريف",
    spring: "ربيع",
    summer: "صيف",
    winter: "شتاء",
  };
  return seasonMap[season] || season;
}

function translateGenres(genres) {
  const genreMap = {
    Action: "أكشن",
    Adventure: "مغامرات",
    "Avant Garde": "أفان غارد",
    "Award Winning": "حائز على جوائز",
    "Boys Love": "حب الأولاد",
    Comedy: "كوميديا",
    Drama: "دراما",
    Fantasy: "فانتازيا",
    "Girls Love": "حب الفتيات",
    Gourmet: "الذواقة",
    Horror: "رعب",
    Mystery: "غموض",
    Romance: "رومانسية",
    "Sci-Fi": "خيال علمي",
    "Slice of Life": "شريحة من الحياة",
    Sports: "رياضة",
    Supernatural: "خارق للطبيعة",
    Suspense: "تشويق",
    Ecchi: "إيتشي",
    Erotica: "إيروتيكا",
    Hentai: "هنتاي",
    "Adult Cast": "طاقم بالغين",
    Anthropomorphic: "أنثروبومورفي",
    CGDCT: "فتيات لطيفات يفعلون أشياء لطيفة",
    Childcare: "رعاية الأطفال",
    "Combat Sports": "رياضات قتالية",
    Crossdressing: "تنكر الجنس",
    Delinquents: "جانحين",
    Detective: "تحري",
    Educational: "تعليمي",
    "Gag Humor": "نكتة",
    Gore: "دموي",
    Harem: "حريم",
    "High Stakes Game": "لعبة رهان عالي",
    Historical: "تاريخي",
    "Idols (Female)": "أيدولز (إناث)",
    "Idols (Male)": "أيدولز (ذكور)",
    Isekai: "عالم آخر",
    Iyashikei: "إياشيكي",
    "Love Polygon": "علاقة متعددة الأطراف",
    "Magical Sex Shift": "تحول سحري للجنس",
    "Mahou Shoujo": "فتاة سحرية",
    "Martial Arts": "فنون قتالية",
    Mecha: "ميكا",
    Medical: "طبي",
    Military: "عسكري",
    Music: "موسيقى",
    Mythology: "أساطير",
    "Organized Crime": "جريمة منظمة",
    "Otaku Culture": "ثقافة الأوتاكو",
    Parody: "محاكاة ساخرة",
    "Performing Arts": "الفنون المسرحية",
    Pets: "حيوانات أليفة",
    Psychological: "نفسي",
    Racing: "سباق",
    Reincarnation: "تناسخ",
    "Reverse Harem": "حريم عكسي",
    "Love Status Quo": "الحب الراهن",
    Samurai: "ساموراي",
    School: "مدرسة",
    Showbiz: "عالم الترفيه",
    Space: "فضاء",
    "Strategy Game": "لعبة استراتيجية",
    "Super Power": "قوى خارقة",
    Survival: "بقاء",
    "Team Sports": "رياضات جماعية",
    "Time Travel": "سفر عبر الزمن",
    Vampire: "مصاصي دماء",
    "Video Game": "لعبة فيديو",
    "Visual Arts": "الفنون البصرية",
    Workplace: "مكان العمل",
    "Urban Fantasy": "فانتازيا حضرية",
    Villainess: "شريرة",
    Josei: "جوسي",
    Kids: "أطفال",
    Seinen: "سينين",
    Shoujo: "شوجو",
    Shounen: "شونين",
  };
  return genres.map((genre) => genreMap[genre.name] || genre.name);
}

function formatAiredDate(date) {
  return date ? new Date(date).toISOString().split("T")[0] : null;
}

function formatRating(rating) {
  if (rating === null || rating === undefined) {
    return "N/A";
  }
  const match = rating.match(/(\d+)/);
  return match ? match[1] : "غير متوفر";
}

function formatDuration(duration) {
  return duration ? duration.split(" ")[0] : "غير محدد";
}

function translateSources(source) {
  const sourceMap = {
    Manga: "مانغا",
    "Light novel": "رواية خفيفة",
    Original: "أصلي",
    "Visual novel": "رواية مرئية",
    Novel: "رواية",
    Game: "لعبة",
    "4-koma manga": "مانغا من 4 إطارات",
    "Web manga": "مانغا ويب",
    "Digital manga": "مانغا رقمية",
    "Card game": "لعبة بطاقات",
    Music: "موسيقى",
    "Picture book": "كتاب مصور",
    Other: "أخرى",
  };
  return sourceMap[source] || source;
}
module.exports = {
  translateStatus,
  translateSeason,
  translateGenres,
  formatAiredDate,
  formatRating,
  formatDuration,
  translateSources,
};
