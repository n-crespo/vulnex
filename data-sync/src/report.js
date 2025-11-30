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

export function generateBatchReport(metrics, batchMetrics) {
  console.log(`Processed batch: ${batchMetrics.batchProcessed}
  -> Total: ${metrics.totalProcessed} (+${batchMetrics.batchProcessed})
  -> Successful: ${metrics.totalSuccessful} (+${batchMetrics.batchSuccessCount})
  -> Rejected:   ${metrics.totalRejected} (+${batchMetrics.batchRejectedCount})
  -> Failed (Total Validation): ${metrics.totalFailed} (+${batchMetrics.batchFailedCount})
  -> Unknown Severity Levels: ${metrics.totalUnknownSeverity} (+${batchMetrics.batchUnknownSeverity})
  -> Unknown Product/Version: ${metrics.totalUnknownProduct} (+${batchMetrics.batchUnknownProduct})
  -> Failed Validations: ${metrics.totalValidationFails}
`);
}
