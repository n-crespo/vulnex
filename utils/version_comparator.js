/**
 * Custom version comparator: Compares version strings numerically (e.g., "10.3" > "9.1").
 * This is needed because standard string sorting fails on version numbers.
 */
export const compareVersions = (v1, v2) => {
  // Treat null/empty versions as less than any concrete version
  if (!v1 || !v2) return v1 ? 1 : v2 ? -1 : 0;

  // Split by dot and map parts to numbers if possible (e.g., '11.2p' remains '11.2p', '10' becomes 10)
  const s1 = v1.split(".").map((p) => (isNaN(parseInt(p)) ? p : parseInt(p)));
  const s2 = v2.split(".").map((p) => (isNaN(parseInt(p)) ? p : parseInt(p)));

  const maxLength = Math.max(s1.length, s2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = s1[i] || 0;
    const part2 = s2[i] || 0;

    if (typeof part1 === "number" && typeof part2 === "number") {
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    } else {
      // Fallback for non-numeric parts (like '11.2p' vs '11.2')
      const str1 = String(part1);
      const str2 = String(part2);
      const comparison = str1.localeCompare(str2);
      if (comparison !== 0) return comparison;
    }
  }
  return 0;
};


