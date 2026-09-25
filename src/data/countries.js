// UDDESHO country database.
// This is a friendly starting guide, NOT legal advice. Fees, visa rules and living costs
// change often, so students should always confirm on official government / university sites.
// To add a country, copy one block and give it a unique `id` and its 2-letter ISO `code`.

const flagEmoji = (code) =>
  code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

const RAW = [
  {
    id: "japan", code: "jp", name: "Japan", capital: "Tokyo",
    currency: "Japanese Yen (JPY)", currencyCode: "JPY",
    language: "Japanese. Many universities also offer English-taught programs.",
    education: "Bachelor 4 years, Master 2 years, PhD 3 years. Main intakes in April and October. MEXT is the best-known government scholarship.",
    visa: "Student visa with a Certificate of Eligibility arranged by your university. Part-time work is allowed with permission (up to 28 hours a week).",
    livingCost: "About $700 - $1,100 per month. Tokyo is at the higher end.",
  },
  {
    id: "germany", code: "de", name: "Germany", capital: "Berlin",
    currency: "Euro (EUR)", currencyCode: "EUR",
    language: "German. English-taught Master's programs are common.",
    education: "Bachelor about 3 years, Master about 2 years. Most public universities charge little or no tuition. Winter and summer semesters.",
    visa: "National student visa (type D). You usually need to show proof of funds, often through a blocked account. Students can work a limited number of days per year.",
    livingCost: "About $900 - $1,200 per month.",
  },
  {
    id: "italy", code: "it", name: "Italy", capital: "Rome",
    currency: "Euro (EUR)", currencyCode: "EUR",
    language: "Italian. A growing number of English-taught programs.",
    education: "3 + 2 system (Bachelor 3 years, Master 2 years). Public university tuition depends on family income. Regional scholarships (DSU) help many students.",
    visa: "Type D student visa. Pre-enrolment is done through the Universitaly portal. A residence permit is required after arrival.",
    livingCost: "About $700 - $1,100 per month. Cheaper in the south.",
  },
  {
    id: "south-korea", code: "kr", name: "South Korea", capital: "Seoul",
    currency: "South Korean Won (KRW)", currencyCode: "KRW",
    language: "Korean. Many universities offer English-taught programs.",
    education: "Bachelor 4 years, Master 2 years, PhD 3+ years. Intakes in March and September. GKS is the flagship government scholarship.",
    visa: "D-2 student visa. Part-time work is allowed after a waiting period and with permission.",
    livingCost: "About $700 - $1,000 per month.",
  },
  {
    id: "canada", code: "ca", name: "Canada", capital: "Ottawa",
    currency: "Canadian Dollar (CAD)", currencyCode: "CAD",
    language: "English and French.",
    education: "Bachelor 4 years, Master 1 - 2 years. Colleges and universities both offer degrees and diplomas. Co-op programs are popular.",
    visa: "Study permit. Proof of funds is required. Graduates may apply for a post-graduation work permit depending on the program.",
    livingCost: "About $900 - $1,400 per month.",
  },
  {
    id: "australia", code: "au", name: "Australia", capital: "Canberra",
    currency: "Australian Dollar (AUD)", currencyCode: "AUD",
    language: "English.",
    education: "Bachelor 3 - 4 years, Master 1 - 2 years. Two main intakes (February and July).",
    visa: "Student visa (subclass 500). You must show enough funds and a genuine student intention. Work hours are limited during study.",
    livingCost: "About $1,200 - $1,800 per month.",
  },
  {
    id: "united-kingdom", code: "gb", name: "United Kingdom", capital: "London",
    currency: "Pound Sterling (GBP)", currencyCode: "GBP",
    language: "English.",
    education: "Bachelor 3 years (4 in Scotland), Master 1 year. UCAS is used for undergraduate applications. Chevening is a well-known scholarship.",
    visa: "Student visa with a CAS from your university, plus proof of funds. Graduates can apply for the Graduate route.",
    livingCost: "About $1,200 - $1,800 per month. London is higher.",
  },
  {
    id: "united-states", code: "us", name: "United States", capital: "Washington, D.C.",
    currency: "US Dollar (USD)", currencyCode: "USD",
    language: "English.",
    education: "Bachelor 4 years, Master 1 - 2 years, PhD 4 - 6 years. Many universities look at SAT/ACT, essays and extracurriculars. Generous merit aid at some schools.",
    visa: "F-1 student visa after receiving an I-20. Optional Practical Training (OPT) allows work after graduation.",
    livingCost: "About $1,100 - $1,900 per month.",
  },
  {
    id: "netherlands", code: "nl", name: "Netherlands", capital: "Amsterdam",
    currency: "Euro (EUR)", currencyCode: "EUR",
    language: "Dutch. Very many English-taught programs.",
    education: "Bachelor 3 years, Master 1 - 2 years. Research universities and universities of applied sciences. Application deadlines are often early.",
    visa: "Residence permit, usually arranged by the university. Proof of funds required.",
    livingCost: "About $1,000 - $1,500 per month.",
  },
  {
    id: "france", code: "fr", name: "France", capital: "Paris",
    currency: "Euro (EUR)", currencyCode: "EUR",
    language: "French. Some English-taught programs.",
    education: "Licence 3 years, Master 2 years, Doctorat 3 years. Applications often go through Campus France and Parcoursup / Mon Master.",
    visa: "Long-stay student visa (VLS-TS), usually after Campus France approval.",
    livingCost: "About $900 - $1,400 per month. Paris is higher.",
  },
  {
    id: "sweden", code: "se", name: "Sweden", capital: "Stockholm",
    currency: "Swedish Krona (SEK)", currencyCode: "SEK",
    language: "Swedish. Many Master's programs in English.",
    education: "Bachelor 3 years, Master 1 - 2 years. Non-EU students pay tuition. Swedish Institute scholarships exist for some countries.",
    visa: "Residence permit for studies. You must show funds for living costs.",
    livingCost: "About $900 - $1,300 per month.",
  },
  {
    id: "finland", code: "fi", name: "Finland", capital: "Helsinki",
    currency: "Euro (EUR)", currencyCode: "EUR",
    language: "Finnish and Swedish. Many English-taught degrees.",
    education: "Bachelor 3 years, Master 2 years. Non-EU students pay tuition for English-taught degrees, with scholarships available.",
    visa: "Residence permit for studies, with proof of funds.",
    livingCost: "About $800 - $1,200 per month.",
  },
  {
    id: "norway", code: "no", name: "Norway", capital: "Oslo",
    currency: "Norwegian Krone (NOK)", currencyCode: "NOK",
    language: "Norwegian. Some programs in English.",
    education: "Bachelor 3 years, Master 2 years. Tuition rules for non-EU students have changed recently, so check each university.",
    visa: "Residence permit for studies with proof of funds.",
    livingCost: "About $1,200 - $1,700 per month.",
  },
  {
    id: "denmark", code: "dk", name: "Denmark", capital: "Copenhagen",
    currency: "Danish Krone (DKK)", currencyCode: "DKK",
    language: "Danish. Many English-taught programs.",
    education: "Bachelor 3 years, Master 2 years. Non-EU students pay tuition. Project-based learning is common.",
    visa: "Residence permit for studies. Proof of funds required.",
    livingCost: "About $1,100 - $1,500 per month.",
  },
  {
    id: "ireland", code: "ie", name: "Ireland", capital: "Dublin",
    currency: "Euro (EUR)", currencyCode: "EUR",
    language: "English and Irish.",
    education: "Bachelor 3 - 4 years, Master 1 year. Strong in technology, pharma and business.",
    visa: "Study visa where required, then immigration permission after arrival. Limited work hours during term.",
    livingCost: "About $1,100 - $1,700 per month. Dublin is higher.",
  },
  {
    id: "new-zealand", code: "nz", name: "New Zealand", capital: "Wellington",
    currency: "New Zealand Dollar (NZD)", currencyCode: "NZD",
    language: "English and Te Reo Māori.",
    education: "Bachelor 3 years, Master 1 - 2 years. Eight public universities. Post-study work options depend on the qualification.",
    visa: "Student visa with proof of funds and an offer of place.",
    livingCost: "About $1,000 - $1,500 per month.",
  },
  {
    id: "singapore", code: "sg", name: "Singapore", capital: "Singapore",
    currency: "Singapore Dollar (SGD)", currencyCode: "SGD",
    language: "English, Mandarin, Malay and Tamil.",
    education: "Bachelor 3 - 4 years, Master 1 - 2 years. Highly ranked universities with competitive admissions. Tuition grants may require a work bond.",
    visa: "Student's Pass applied for through the university after admission.",
    livingCost: "About $1,100 - $1,800 per month.",
  },
  {
    id: "malaysia", code: "my", name: "Malaysia", capital: "Kuala Lumpur",
    currency: "Malaysian Ringgit (MYR)", currencyCode: "MYR",
    language: "Malay and English.",
    education: "Bachelor 3 - 4 years, Master 1 - 2 years. Public and private universities, plus branch campuses of foreign universities. Lower cost than many countries.",
    visa: "Student pass through the university and EMGS.",
    livingCost: "About $400 - $800 per month.",
  },
  {
    id: "china", code: "cn", name: "China", capital: "Beijing",
    currency: "Chinese Yuan (CNY)", currencyCode: "CNY",
    language: "Mandarin. Some programs in English.",
    education: "Bachelor 4 years, Master 2 - 3 years, PhD 3 - 4 years. The CSC scholarship is widely used by international students.",
    visa: "X1 (long-term study) visa using the admission notice and JW201 / JW202 form.",
    livingCost: "About $400 - $900 per month.",
  },
  {
    id: "turkiye", code: "tr", name: "Türkiye", capital: "Ankara",
    currency: "Turkish Lira (TRY)", currencyCode: "TRY",
    language: "Turkish. Some programs in English.",
    education: "Bachelor 4 years, Master 2 years. Türkiye Scholarships (Türkiye Bursları) is a popular full scholarship.",
    visa: "Student visa, then a student residence permit after arrival.",
    livingCost: "About $400 - $800 per month.",
  },
  {
    id: "hungary", code: "hu", name: "Hungary", capital: "Budapest",
    currency: "Hungarian Forint (HUF)", currencyCode: "HUF",
    language: "Hungarian. Many English-taught programs.",
    education: "Bachelor 3 - 4 years, Master 2 years. Stipendium Hungaricum offers scholarships to students from partner countries.",
    visa: "Residence permit for study purposes with proof of admission and funds.",
    livingCost: "About $500 - $900 per month.",
  },
  {
    id: "poland", code: "pl", name: "Poland", capital: "Warsaw",
    currency: "Polish Zloty (PLN)", currencyCode: "PLN",
    language: "Polish. English-taught programs are widely available.",
    education: "Bachelor 3 - 4 years, Master 1.5 - 2 years. Tuition is affordable compared with much of Europe.",
    visa: "National visa (D) for studies, followed by a residence card.",
    livingCost: "About $500 - $900 per month.",
  },
  {
    id: "spain", code: "es", name: "Spain", capital: "Madrid",
    currency: "Euro (EUR)", currencyCode: "EUR",
    language: "Spanish. Some programs in English.",
    education: "Grado 4 years, Master 1 - 2 years. Public universities have relatively low tuition. Business schools are well known.",
    visa: "Student visa applied for at the Spanish consulate, with proof of funds and insurance.",
    livingCost: "About $800 - $1,300 per month.",
  },
  {
    id: "switzerland", code: "ch", name: "Switzerland", capital: "Bern",
    currency: "Swiss Franc (CHF)", currencyCode: "CHF",
    language: "German, French, Italian and Romansh. English in many Master's programs.",
    education: "Bachelor 3 years, Master 1.5 - 2 years. Top technical universities such as ETH Zurich and EPFL. Very competitive.",
    visa: "National visa (D) and a residence permit. Proof of funds required.",
    livingCost: "About $1,800 - $2,600 per month.",
  },
  {
    id: "austria", code: "at", name: "Austria", capital: "Vienna",
    currency: "Euro (EUR)", currencyCode: "EUR",
    language: "German. Some programs in English.",
    education: "Bachelor 3 years, Master 2 years. Low tuition at public universities, with a semester fee.",
    visa: "Residence permit for students. German language proof is often required for German-taught programs.",
    livingCost: "About $900 - $1,300 per month.",
  },
  {
    id: "czech-republic", code: "cz", name: "Czech Republic", capital: "Prague",
    currency: "Czech Koruna (CZK)", currencyCode: "CZK",
    language: "Czech. English-taught programs are available for a fee.",
    education: "Bachelor 3 years, Master 2 years. Czech-taught public programs are free, English-taught ones charge tuition.",
    visa: "Long-term visa for studies and then a residence permit.",
    livingCost: "About $600 - $1,000 per month.",
  },
];

export const COUNTRIES = RAW.map((c) => ({ ...c, emoji: flagEmoji(c.code) }));

export const getCountry = (id) => COUNTRIES.find((c) => c.id === id) || null;

// Flags come from flagcdn.com (works on every device, unlike flag emoji on Windows).
export const flagUrl = (code, width = 160) =>
  `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;

export const CURRENCY_CODES = Array.from(
  new Set(["USD", "EUR", "GBP", "BDT", ...COUNTRIES.map((c) => c.currencyCode)])
).sort();
