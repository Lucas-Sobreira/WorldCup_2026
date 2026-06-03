# Maps historical/variant team names → canonical name used in bracket_2026.json
# Canonical names follow current FIFA/official usage as of 2026.

ALIASES: dict[str, str] = {
    # Germany reunification
    "West Germany": "Germany",
    "Germany DR": "Germany",
    # Korea
    "Korea Republic": "South Korea",
    "Korea DPR": "Korea DPR",
    # Iran
    "IR Iran": "Iran",
    # Ivory Coast
    "Côte d'Ivoire": "Ivory Coast",
    "Cote d'Ivoire": "Ivory Coast",
    "C\u00f4te d'Ivoire": "Ivory Coast",
    # Turkey
    "Türkiye": "Türkiye",
    "Turkey": "Türkiye",
    # Bosnia
    "Bosnia and Herzegovina": "Bosnia-Herzegovina",
    # Czech Republic
    "Czech Republic": "Czechia",
    # Congo DR / Zaire
    "Zaire": "DR Congo",
    "Congo DR": "DR Congo",
    # USA
    "USA": "United States",
    # Yugoslavia variants (no modern successor claim; kept separate)
    "FR Yugoslavia": "Serbia",
    "Serbia and Montenegro": "Serbia",
    # Soviet Union / Russia
    "Soviet Union": "Russia",
    # Czechoslovakia (split into Czech Republic/Slovakia — no merge)
    # Dutch East Indies (now Indonesia — not in 2026)
}


def normalize(name: str) -> str:
    """Return canonical team name; pass-through if no alias found."""
    return ALIASES.get(name, name)
