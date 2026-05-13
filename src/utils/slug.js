// Map a country name to a URL-safe slug. Examples:
//   "Japan"                    -> "japan"
//   "South Korea"              -> "south-korea"
//   "São Tomé and Príncipe"    -> "sao-tome-and-principe"
//   "Côte d'Ivoire"            -> "cote-divoire"
//   "Trinidad and Tobago"      -> "trinidad-and-tobago"
export function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function findCountryBySlug(countries, slug) {
  return countries.find(c => slugify(c.name) === slug)
}
