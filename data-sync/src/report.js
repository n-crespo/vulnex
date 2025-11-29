// Function to generate the final report
export function generateFinalReport(metrics) {
  console.log(
    "--- NVD Synchronization Complete ---\n" +
      "--- FINAL RESULTS ---\n" +
      `Total CVEs Retrieved (via NVD totalResults): ${metrics.totalResults}\n` +
      `Total CVEs Processed (in batches): ${metrics.totalProcessed}\n` +
      `Total Successful Records for Database: ${metrics.totalSuccessful}\n` +
      `Total Rejected (Status 'Rejected'): ${metrics.totalRejected}\n` +
      `Total Failed (Logged to badCVEs.jsonl): ${metrics.totalFailed}\n` +
      `Total Extraction Issues: ${metrics.totalUnknownVulnerability + metrics.totalUnknownSeverity + metrics.totalUnknownProduct + metrics.totalValidationFails}\n` +
      `  - Total Unknown Severity Levels: ${metrics.totalUnknownSeverity}\n` +
      `  - Total Unknown Product/Version: ${metrics.totalUnknownProduct}\n` +
      `  - Total Validation Fails: ${metrics.totalValidationFails}`,
  );
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
