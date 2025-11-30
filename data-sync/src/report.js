// Function to generate the final report
export function generateFinalReport(metrics) {
  let reportLines = [];

  // Iterate over every key in the object
  for (const key in metrics) {
    if (metrics.hasOwnProperty(key)) {
      // Use the key itself as the label
      reportLines.push(`${key}: ${metrics[key]}`);
    }
  }

  console.log(reportLines.join("\n"));
}

/**
 * Function to generate a report comparing metrics from two objects.
 * Prints output in the format: key: object1Value (object1Value - object2Value)
 * * @param {Object<string, number>} metricsObject1 The first object containing metrics.
 * @param {Object<string, number>} metricsObject2 The second object containing metrics (should have the same keys).
 */
export function generateBatchReport(metricsObject1, metricsObject2) {
  let reportLines = [];

  // Iterate over every key in the first object
  for (const key in metricsObject1) {
    // Check if the property is directly on the object
    if (Object.prototype.hasOwnProperty.call(metricsObject1, key)) {
      const value1 = metricsObject1[key];
      // Safely get the corresponding value from the second object, 0 if not present
      const value2 = metricsObject2[key] || 0;

      const difference = value1 - value2;

      // Construct the output line: key: value1 (difference)
      reportLines.push(
        `${key}: ${value1} (${difference >= 0 ? "+" : "-"}${difference})`,
      );
    }
  }

  console.log(reportLines.join("\n"));
}
