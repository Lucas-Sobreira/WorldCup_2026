const COUNTRY_CODES = {
  "Brazil": "br", "France": "fr", "Argentina": "ar", "Germany": "de",
  "Spain": "es", "England": "gb-eng", "Portugal": "pt", "Netherlands": "nl",
  "Belgium": "be", "Uruguay": "uy", "Croatia": "hr", "Denmark": "dk",
  "Switzerland": "ch", "Mexico": "mx", "United States": "us", "Canada": "ca",
  "Japan": "jp", "South Korea": "kr", "Morocco": "ma", "Senegal": "sn",
  "Ecuador": "ec", "Colombia": "co", "Chile": "cl", "Peru": "pe",
  "Australia": "au", "Saudi Arabia": "sa", "Iran": "ir", "Qatar": "qa",
  "Poland": "pl", "Serbia": "rs", "Czechia": "cz", "Austria": "at",
  "Sweden": "se", "Norway": "no", "Scotland": "gb-sct", "Tunisia": "tn",
  "Egypt": "eg", "Algeria": "dz", "Ivory Coast": "ci", "Ghana": "gh",
  "Cameroon": "cm", "Nigeria": "ng", "Paraguay": "py", "Bolivia": "bo",
  "Turkey": "tr", "Türkiye": "tr", "Ukraine": "ua", "Hungary": "hu",
  "New Zealand": "nz", "Panama": "pa", "Haiti": "ht", "Costa Rica": "cr",
  "Honduras": "hn", "Jamaica": "jm", "Curacao": "cw", "Cape Verde": "cv",
  "DR Congo": "cd", "South Africa": "za", "Jordan": "jo", "Iraq": "iq",
  "Uzbekistan": "uz", "Bosnia-Herzegovina": "ba", "Bosnia Herzegovina": "ba",
};

export default function TeamFlag({ team, size = 20 }) {
  const code = COUNTRY_CODES[team];
  if (!code) {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: size, height: size, borderRadius: 3, background: "#334155",
          fontSize: size * 0.45, fontWeight: 700, color: "#94a3b8",
        }}
      >
        {team?.[0] ?? "?"}
      </span>
    );
  }
  return (
    <img
      src={`https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${code}.png`}
      srcSet={`https://flagcdn.com/${size * 2}x${Math.round(size * 1.5)}/${code}.png 2x`}
      alt={team}
      style={{ borderRadius: 2, objectFit: "cover", display: "inline-block" }}
      onError={(e) => { e.target.style.display = "none"; }}
    />
  );
}
