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
  const finalStatus = extractStatus(cve, metrics);
  const isVulnerableString = extractIsVulnerable(cve, metrics);
  const severityLevel = extractSeverityLevel(cve.metrics, metrics);
  const productDetails = extractProductDetails(cve, metrics); // returns object with 4 fields

  const record = {
    cveId: requiredData.id,
    published: requiredData.published,
    lastModified: requiredData.lastModified,
    description: requiredData.description,
    status: finalStatus,
    isVulnerable: isVulnerableString,
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
 *  Extracts the CVE status. Updates the global counter if the status is
 *  missing.
 * @param {object} cve - The cve object.
 * @param {object} metrics - Object containing keys to track failures
 * @returns {string} The status string or "Unknown".
 */
export const extractStatus = (cve, metrics) => {
  const status = cve?.vulnStatus;
  if (!status) {
    metrics.totalMissingStatus++;
    return "Unknown";
  }
  return status;
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
 *  Extracts the product name and the version status (patch version or affected
 *  range). Prioritizes 'versionEndExcluding' as the definitive patch version.
 * Updates the global counter if product details cannot be determined.
 * @param {object} cve - The cve object.
 * @param {object} metrics - Object containing keys to track failures
 * @returns {{productName: string, patchedInVersion: string, minAffectedVersion: string, maxAffectedVersion: string}}
 * An object containing the product name and the version status. Note: 'patchedInVersion' is the primary focus.
 */
export const extractProductDetails = (cve, metrics) => {
  const UNKNOWN_PRODUCT_VALUE = "UNKNOWN";
  const UNKNOWN_VERSION_VALUE = "UNKNOWN_VERSION";

  const configurations = cve.configurations;

  let firstProductName = null;
  let patchedVersion = null;
  const specificVersions = new Set();

  const isWildcard = (v) => v === "*" || v === "-" || !v;

  // Recursive helper to traverse all nodes and collect data
  const traverseAndCollect = (nodes) => {
    if (!nodes) return;

    for (const node of nodes) {
      if (node.cpeMatch && node.cpeMatch.length > 0) {
        for (const match of node.cpeMatch) {
          const parts = match.criteria ? match.criteria.split(":") : [];

          if (parts.length >= 6) {
            const productName = parts[4];
            let versionInCriteria = parts[5];

            // Capture the first valid product name found
            if (
              !firstProductName &&
              productName &&
              productName !== UNKNOWN_PRODUCT_VALUE
            ) {
              firstProductName = productName;
            }

            // capture the patch version
            if (!patchedVersion && match.versionEndExcluding) {
              patchedVersion = match.versionEndExcluding;
            } else if (!patchedVersion && match.versionEndIncluding) {
              // sometimes versionEndIncluding is used to define the last vulnerable version
              patchedVersion = match.versionEndIncluding;
            }

            // collect specific version numbers from criteria as fallback
            if (!isWildcard(versionInCriteria)) {
              specificVersions.add(versionInCriteria);
            }
          }
        }
      }

      if (node.nodes && node.nodes.length > 0) {
        traverseAndCollect(node.nodes);
      }
    }
  };

  if (configurations && configurations.length > 0) {
    for (const config of configurations) {
      traverseAndCollect(config.nodes);
    }
  }

  // Determine Final Range and Product Name
  if (!firstProductName) {
    metrics.totalUnknownProduct++;
    return {
      productName: UNKNOWN_PRODUCT_VALUE,
      patchedInVersion: UNKNOWN_VERSION_VALUE,
      minAffectedVersion: UNKNOWN_VERSION_VALUE,
      maxAffectedVersion: UNKNOWN_VERSION_VALUE,
    };
  }

  let minVersion = UNKNOWN_VERSION_VALUE;
  let maxVersion = UNKNOWN_VERSION_VALUE;

  if (specificVersions.size > 0) {
    const sortedVersions = Array.from(specificVersions).sort();
    minVersion = sortedVersions[0];
    maxVersion = sortedVersions[sortedVersions.length - 1];
  }

  // UNKNOWN as fallback value
  const finalPatchedVersion = patchedVersion || UNKNOWN_VERSION_VALUE;

  // Final check for unknown status
  if (
    finalPatchedVersion === UNKNOWN_VERSION_VALUE &&
    specificVersions.size === 0
  ) {
    // only count as failure if we found no patch version AND no criteria versions.
    metrics.totalUnknownProduct++;
  }

  // Success!
  return {
    productName: firstProductName,
    patchedInVersion: finalPatchedVersion, // Primary Field
    minAffectedVersion: minVersion,
    maxAffectedVersion: maxVersion,
  };
};
