const themes = {
  Africa:        { primary: "#E8A838", background: "#1A1200", glow: "#E8A83855" },
  Europe:        { primary: "#4A90D9", background: "#00101A", glow: "#4A90D955" },
  Asia:          { primary: "#2ECC8A", background: "#001A0E", glow: "#2ECC8A55" },
  "North America": { primary: "#E85D4A", background: "#1A0800", glow: "#E85D4A55" },
  "South America": { primary: "#9B59B6", background: "#1A0030", glow: "#9B59B655" },
  Oceania:       { primary: "#5B8CFF", background: "#00081A", glow: "#5B8CFF55" },
  Antarctica:    { primary: "#B0C4DE", background: "#0A0F14", glow: "#B0C4DE55" },
}

const fallback = { primary: "#FFFFFF", background: "#0A0E1A", glow: "#FFFFFF55" }

export function getContinentTheme(continent) {
  return themes[continent] ?? fallback
}
