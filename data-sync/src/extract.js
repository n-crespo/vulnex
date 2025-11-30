// functions to extract the data I want from CVE records

/**
 * Extracts and validates all required fields from a single NVD vulnerability record.
 * @param {object} vulnerability - A single item from the NVD 'vulnerabilities' array.
 * @returns {object} The standardized and validated CVE record.
 */
export const extractCveData = (vulnerability, metrics) => {
  const cve = vulnerability.cve;

  // Check for "Rejected" status first and discard
  if (cve?.vulnStatus === "Rejected") {
    const rejectedError = new Error(`Rejected CVE ID: ${cve.id}`);
    rejectedError.isRejected = true;
    throw rejectedError;
  }

  // extract mandatory fields and throw error if fails (shouldn't, hasn't)
  const requiredData = extractRequiredFields(cve);

  // optional fields (include failure counters, errors gracefully)
  const severityLevel = extractSeverityLevel(cve.metrics, metrics);
  const productDetails = extractProductDetails(cve, metrics); // returns object with 4 fields

  // discard the CVE if we can't extract product info properly
  if (!productDetails) {
    return null;
  }

  const record = {
    cveId: requiredData.id,
    published: requiredData.published,
    description: requiredData.description,
    severityLevel: severityLevel,
    productName: productDetails.productName,
    productVersions: productDetails.vulnerableRanges,
  };

  return record;
};

/**
 *  Extracts core fields needed for a valid record. Throws an error if any of
 *  these are missing, resulting in total record failure.
 * @param {object} cve - The cve object.
 * @returns {{id: string, published: string, lastModified: string, description: string}}
 */
export const extractRequiredFields = (cve) => {
  const id = cve?.id;
  const published = cve?.published;
  const lastModified = cve?.lastModified;
  const description = cve.descriptions?.find((d) => d.lang === "en")?.value;

  if (!id) throw new Error("Missing cve.id in vulnerability record.");
  if (!published) throw new Error(`Missing cve.published for CVE ID: ${id}`);
  if (!lastModified)
    throw new Error(`Missing cve.lastModified for CVE ID: ${id}`);
  if (!description)
    throw new Error(`Missing English description for CVE ID: ${id}`);

  return { id, published, lastModified, description };
};

/**
 *  Extracts the vulnerability status. Updates the global counter if the status
 *  cannot be determined.
 * @param {object} cve - The cve object.
 * @param {object} cveMetrics - The cve.metrics object.
 * @param {object} metrics - Object containing keys to track failures
 * @returns {string} "true", "false", or "Unknown".
 */
export const extractIsVulnerable = (cve, metrics) => {
  // recursive helper function
  const traverseNodes = (nodes) => {
    if (!nodes) return;
    let foundAnyConfigMatch = false;

    for (const node of nodes) {
      if (node.cpeMatch && node.cpeMatch.length > 0) {
        foundAnyConfigMatch = true;
        for (const match of node.cpeMatch) {
          if (match.vulnerable === true) return "true";
        }
      }
      if (node.nodes && node.nodes.length > 0) {
        const result = traverseNodes(node.nodes);
        if (result === "true") return "true";
      }
    }
    return foundAnyConfigMatch ? "partial_false" : null;
  };

  const configurations = cve.configurations;
  if (!configurations || configurations.length === 0) {
    metrics.totalUnknownVulnerability++;
    return "Unknown";
  }

  let foundConfig = false;
  for (const config of configurations) {
    if (config.nodes && config.nodes.length > 0) {
      const result = traverseNodes(config.nodes);
      if (result === "true") return "true";
      if (result === "partial_false") foundConfig = true;
    }
  }

  if (foundConfig) {
    return "false";
  }

  metrics.totalUnknownVulnerability++;
  return "Unknown";
};

/**
 *  Extracts the categorical severity level. Updates the global counter if the
 *  severity level is not recognized.
 * @param {object} cveMetrics - The cve.metrics object.
 * @param {object} metrics - Object containing keys to track failures
 * @returns {string} The base severity string ("NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL", or "UNKNOWN").
 */
export const extractSeverityLevel = (cveMetrics, metrics) => {
  if (!cveMetrics) {
    metrics.totalUnknownSeverity++;
    return "UNKNOWN";
  }

  const validSeverities = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

  const getSeverity = (cveMetrics) => {
    if (cveMetrics) {
      const v34Severity = cveMetrics[0]?.cvssData?.baseSeverity;
      const v2Severity = cveMetrics[0]?.baseSeverity;
      const severity = v34Severity || v2Severity;

      if (severity !== undefined) {
        const upperSeverity = severity.toUpperCase();
        if (validSeverities.includes(upperSeverity)) {
          return upperSeverity;
        }
      }
    }
    return null;
  };

  // Priority: V4.0, V3.1, V3.0, V2.0
  let severity = getSeverity(cveMetrics.cvssMetricV40);
  if (severity) return severity;

  severity = getSeverity(cveMetrics.cvssMetricV31);
  if (severity) return severity;

  severity = getSeverity(cveMetrics.cvssMetricV30);
  if (severity) return severity;

  severity = getSeverity(cveMetrics.cvssMetricV2);
  if (severity) return severity;

  metrics.totalUnknownSeverity++;
  return "UNKNOWN";
};

/**
 * Helper to convert disparate NVD version constraint fields into a unified,
 * standardized range object for efficient storage and application filtering.
 * @param {object} match - The cpeMatch object from NVD.
 * @param {string} versionInCriteria - The version found in the criteria string (parts[5]).
 * @param {function} isWildcard - The wildcard check function.
 * @returns {object | null} The standardized range object, or null if no version info is present.
 */
const transformRange = (match, versionInCriteria, isWildcard) => {
  const range = {};

  // A safe placeholder for the lowest possible version when a range is open-ended at the start.
  const MIN_VERSION_PLACEHOLDER = "0";

  const hasStart = match.versionStartIncluding || match.versionStartExcluding;
  const hasEnd = match.versionEndIncluding || match.versionEndExcluding;

  // --- Define Start Boundary ---
  if (match.versionStartIncluding) {
    range.start = match.versionStartIncluding;
    range.s_type = "i"; // inclusive (>=)
  } else if (match.versionStartExcluding) {
    range.start = match.versionStartExcluding;
    range.s_type = "e"; // exclusive (>)
  } else if (hasEnd || !isWildcard(versionInCriteria)) {
    // If an end is specified (open-ended start) or a single version is implied,
    // we set the start to the MIN_VERSION_PLACEHOLDER
    range.start = MIN_VERSION_PLACEHOLDER;
    range.s_type = "i";
  }

  // --- Define End Boundary ---
  if (match.versionEndIncluding) {
    range.end = match.versionEndIncluding;
    range.e_type = "i"; // inclusive (<=)
  } else if (match.versionEndExcluding) {
    range.end = match.versionEndExcluding;
    range.e_type = "e"; // exclusive (<)
  } else if (hasStart || !isWildcard(versionInCriteria)) {
    // If a start is specified (open-ended end) or a single version is implied,
    // we use a large version string as the placeholder for "unlimited".
    range.end = "9999.9999.9999";
    range.e_type = "i"; // Treat max placeholder as inclusive
  }

  // --- Handle Single Version (versionEquals) Fallback ---
  // If the CPE has NO version constraints, but a concrete version in the criteria:
  if (!hasStart && !hasEnd && !isWildcard(versionInCriteria)) {
    range.start = versionInCriteria;
    range.end = versionInCriteria;
    range.s_type = "i";
    range.e_type = "i";
  }

  // Ensure we captured a valid start/end combination
  if (range.start && range.end) {
    return range;
  }

  return null;
};

/**
 * Merges overlapping or continuous standardized version ranges to optimize storage.
 * Assumes 'compareVersions' is available in the scope (0 if equal, < 0 if v1 is smaller).
 * @param {Array<object>} ranges - The array of standardized range objects.
 * @returns {Array<object>} The minimized array of merged ranges.
 */
const mergeVulnerableRanges = (ranges) => {
  if (ranges.length <= 1) {
    return ranges;
  }

  // sort the ranges primarily by the 'start' version.
  ranges.sort((a, b) => compareVersions(a.start, b.start));

  const merged = [ranges[0]];

  for (let i = 1; i < ranges.length; i++) {
    const current = ranges[i];
    const lastMerged = merged[merged.length - 1];

    // Check if the current range starts before or at the end of the last merged range.
    // If compareVersions(current.start, lastMerged.end) <= 0, they overlap or are contiguous.
    // We must handle the type ('i' vs 'e') to check for true contiguity (e.g., [1, 2e] and [2i, 3e] are contiguous).

    let isOverlappingOrContiguous = false;

    const comparison = compareVersions(current.start, lastMerged.end);

    if (comparison < 0) {
      // Current start is definitely before the last end (they overlap)
      isOverlappingOrContiguous = true;
    } else if (comparison === 0) {
      // Starts exactly at the last end. Contiguous if one end is 'i' or both are 'e'.
      // Ex: [1, 5i] and [5i, 10] -> Contiguous.
      // Ex: [1, 5e] and [5i, 10] -> Contiguous (v5 is skipped in the first, included in the second).
      // Ex: [1, 5e] and [5e, 10] -> DISJOINT (v5 is missing).
      if (lastMerged.e_type === "i" || current.s_type === "i") {
        isOverlappingOrContiguous = true;
      }
    }

    if (isOverlappingOrContiguous) {
      // Merge: Update the end of the last merged range if the current range extends further.
      if (compareVersions(current.end, lastMerged.end) > 0) {
        lastMerged.end = current.end;
        // Keep the more restrictive type: if the current one is 'e', and it extends further, use 'e'.
        lastMerged.e_type = current.e_type;
      }
      // If the current range ends before the last one, keep the last one's boundary.
    } else {
      // Disjoint: Add the current range to the merged list.
      merged.push(current);
    }
  }

  return merged;
};

/**
 * Custom version comparator: Compares version strings numerically (e.g., "10.3" > "9.1").
 * This is needed because standard string sorting fails on version numbers.
 */
const compareVersions = (v1, v2) => {
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

/**
 * Extracts product name and all distinct vulnerable version ranges from NVD
 * configurations, storing ranges in a standardized format.
 * @param {object} cve - The complete CVE object from the NVD data feed.
 * @param {object} metrics - Object for tracking parsing failures.
 * @returns {{productName: string, vulnerableRanges: Array<object>} | null}
 */
export const extractProductDetails = (cve, metrics) => {
  // grab the first config node
  const firstConfigNodes = cve.configurations?.[0]?.nodes || [];

  let firstFullProductName = null;
  const vulnerableRanges = [];
  const isWildcard = (v) => v === "*" || v === "-" || !v;

  // define some helper functions

  const captureProductName = (parts) => {
    const vendor = parts[3];
    const product = parts[4];
    if (!firstFullProductName && vendor && product) {
      firstFullProductName = `${vendor}:${product}`;
    }
  };

  const processCpeMatches = (cpeMatches) => {
    (cpeMatches || []).forEach((match) => {
      if (!match.vulnerable) return;

      const parts = match.criteria ? match.criteria.split(":") : [];

      if (parts.length >= 6) {
        // Capture the product name immediately (before version validation)
        captureProductName(parts);
        const versionInCriteria = parts[5];

        // Attempt to create the standardized range
        const standardizedRange = transformRange(
          match,
          versionInCriteria,
          isWildcard,
        );

        if (standardizedRange) {
          vulnerableRanges.push(standardizedRange);
        }
      }
    });
  };

  // Iterate over the primary nodes in the first configuration block
  for (const node of firstConfigNodes) {
    processCpeMatches(node.cpeMatch);

    // Check for one level of nested nodes
    if (node.nodes && node.nodes.length > 0) {
      for (const nestedNode of node.nodes) {
        processCpeMatches(nestedNode.cpeMatch);
      }
    }
  }

  // --- Final Validation ---

  // 1. Return null if product name is missing
  if (!firstFullProductName) {
    metrics.totalUnknownProductName++;
    return null;
  }

  // 2. DISCARD the CVE if no actionable version ranges were successfully extracted.
  if (vulnerableRanges.length === 0) {
    metrics.totalUnknownProductVersion++;
    return null;
  }

  // merge version ranges to reduce data storage
  const optimizedRanges = mergeVulnerableRanges(vulnerableRanges);
  const rangeDifference = vulnerableRanges.length - optimizedRanges.length;

  // if optimized range is BIGGER, something very bad happened
  if (rangeDifference < 0) {
    console.error("CRITICAL ERROR IN VERSION RANGES");
    throw new Error("CRITICAL ERROR IN VERSION RANGES");
  }

  return {
    productName: firstFullProductName,
    vulnerableRanges: optimizedRanges,
  };
};
