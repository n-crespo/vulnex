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

  const record = {
    cveId: requiredData.id,
    published: requiredData.published,
    description: requiredData.description,
    severityLevel: severityLevel,
    productName: productDetails.productName,
    patchedInVersion: productDetails.patchedInVersion,
    minAffectedVersion: productDetails.minAffectedVersion,
    maxAffectedVersion: productDetails.maxAffectedVersion,
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
 * Extracts product name (vendor:product) and version details from NVD configurations.
 * @param {object} cve - The complete CVE object from the NVD data feed.
 * @param {object} metrics - Object for tracking parsing failures.
 * @returns {{productName: string, patchedInVersion?: string, minAffectedVersion?: string, maxAffectedVersion?: string}}
 */
export const extractProductDetails = (cve, metrics) => {
  const UNKNOWN_PRODUCT_VALUE = "UNKNOWN";
  const configurations = cve.configurations || [];

  let firstFullProductName = null;
  let explicitPatchVersion = null;
  const allVulnerableVersions = new Set();
  const isWildcard = (v) => v === "*" || v === "-" || !v;

  // Recursive helper to deeply traverse configuration nodes
  const traverse = (nodes) => {
    if (!nodes) return;

    for (const node of nodes) {
      // Process all CPE matches in the current node
      (node.cpeMatch || []).forEach((match) => {
        if (!match.vulnerable) return;

        // split by colon
        const parts = match.criteria ? match.criteria.split(":") : [];

        // Criteria should be long enough: cpe:2.3:<part>:<vendor>:<product>:<version>:...
        if (parts.length >= 6) {
          const vendor = parts[3];
          const product = parts[4];
          const versionInCriteria = parts[5];

          // capture the first full product name ("cisco:ios")
          if (!firstFullProductName && vendor && product) {
            firstFullProductName = `${vendor}:${product}`;
          }

          // Capture the explicit patch version (versionEndExcluding preferred)
          if (!explicitPatchVersion && match.versionEndExcluding) {
            explicitPatchVersion = match.versionEndExcluding;
          }

          // Collect all vulnerable version strings for min/max calculation
          if (!isWildcard(versionInCriteria)) {
            allVulnerableVersions.add(versionInCriteria);
          }
          if (
            match.versionStartIncluding &&
            !isWildcard(match.versionStartIncluding)
          ) {
            allVulnerableVersions.add(match.versionStartIncluding);
          }
          if (
            match.versionEndIncluding &&
            !isWildcard(match.versionEndIncluding)
          ) {
            allVulnerableVersions.add(match.versionEndIncluding);
          }
        }
      });

      // Recurse into nested nodes
      if (node.nodes && node.nodes.length > 0) {
        traverse(node.nodes);
      }
    }
  };

  // Start traversal from the top level configurations
  configurations.forEach((config) => traverse(config.nodes));

  // product name
  if (!firstFullProductName) {
    metrics.totalUnknownProduct++;
    return { productName: UNKNOWN_PRODUCT_VALUE };
  }

  // Determine Min/Max Affected Version Range using the robust comparator
  let minVersion = null;
  let maxVersion = null;

  for (const version of allVulnerableVersions) {
    if (minVersion === null || compareVersions(version, minVersion) < 0) {
      minVersion = version;
    }
    if (maxVersion === null || compareVersions(version, maxVersion) > 0) {
      maxVersion = version;
    }
  }

  const result = {
    productName: firstFullProductName,
  };

  if (explicitPatchVersion) {
    result.patchedInVersion = explicitPatchVersion;
  }

  // Include min/max only if found and ensure max is only added if different from min
  if (minVersion) {
    result.minAffectedVersion = minVersion;
  }
  if (maxVersion && maxVersion !== minVersion) {
    result.maxAffectedVersion = maxVersion;
  }

  // check for unknown status
  if (!explicitPatchVersion && allVulnerableVersions.size === 0) {
    metrics.totalUnknownProduct++;
  }

  return result;
};
