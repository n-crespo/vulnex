// for mock validation checks
const cveIdRegex = /^(CVE|VUL|TEST)-\d{4}-\d{4,}$/i;
const severityEnum = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"];
const vulnerableEnum = ["true", "false", "Unknown"];

/**
 * Verifies if all CVE objects in an array conform to the required regex and enum standards.
 * @param {Array<Object>} cveArray The array of parsed CVE objects.
 */
export function verifyCveArrayData(cveArray, metrics) {
  let failedCount = 0;

  cveArray.forEach((cve, index) => {
    let isValid = true;
    const errors = [];

    // cveid against regex
    if (!cveIdRegex.test(cve.cveId)) {
      errors.push(`cveId: '${cve.cveId}' failed regex check.`);
      isValid = false;
    }

    // severityLevel against enum
    if (!severityEnum.includes(cve.severityLevel)) {
      errors.push(
        `severityLevel: '${cve.severityLevel}' is not a valid enum value.`,
      );
      isValid = false;
    }

    // isVulnerable vs enum
    if (!vulnerableEnum.includes(cve.isVulnerable)) {
      errors.push(
        `isVulnerable: '${cve.isVulnerable}' is not a valid enum value.`,
      );
      isValid = false;
    }

    if (!isValid) {
      console.error(
        `Validation Failed for CVE at index ${index} (${cve.cveId || "No ID"}):`,
        errors,
      );
      failedCount++;
    }
  });

  if (failedCount === 0) {
    return true;
    // console.log(
    //   `Validation successful: ${cveArray.length} records passed all checks.`,
    // );
  } else {
    metrics.totalValidationFails += failedCount;
    console.warn(`${failedCount} records failed validation checks.`);
    return false;
  }
}
