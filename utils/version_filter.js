import { compareVersions } from "./version_comparator.js";

/**
 * Filters an array of CVE objects to only include those applicable to a specific version number.
 * Assumes 'compareVersions' is imported and available in the file scope.
 *
 * @param {Array<Object>} cves The array of CVE documents to filter.
 * @param {string} targetVersion The version string to check for applicability (e.g., '17.5.1').
 * @returns {Array<Object>} The filtered array of CVEs.
 */
export const filterCvesByVersion = (cves, targetVersion) => {
  if (!targetVersion) {
    return cves;
  }

  return cves.filter((cve) => {
    // if CVE lacks version data ignore it
    if (!cve.productVersions || cve.productVersions.length === 0) {
      return false;
    }

    // check if the target version falls within ANY of the CVE's defined version ranges.
    return cve.productVersions.some((range) => {
      const { start, end, s_type, e_type } = range;

      // start boundary
      const startComparison = compareVersions(targetVersion, start);
      let meetsStartCondition = false;
      if (s_type === "i") {
        // inclusive: targetVersion >= start
        meetsStartCondition = startComparison >= 0;
      } else if (s_type === "e") {
        // exclusive: targetVersion > start
        meetsStartCondition = startComparison > 0;
      } else {
        meetsStartCondition = startComparison >= 0; // Default to inclusive
      }

      // end boundary
      const endComparison = compareVersions(targetVersion, end);
      let meetsEndCondition = false;
      if (e_type === "i") {
        // inclusive: targetVersion <= end
        meetsEndCondition = endComparison <= 0;
      } else if (e_type === "e") {
        // exclusive: targetVersion < end
        meetsEndCondition = endComparison < 0;
      } else {
        meetsEndCondition = endComparison <= 0; // Default to inclusive
      }

      return meetsStartCondition && meetsEndCondition;
    });
  });
};
