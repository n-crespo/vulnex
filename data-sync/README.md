# Resources

> [!NOTE]
> For troubleshooting, find a SINGLE cve with the following URL:
>
> ```
> <https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={YOUR-CVE-ID}>
> ```
>
> For example, see
> <https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2021-21429>

- NVD CVE API JSON Schema
  - <https://nvd.nist.gov/vuln/data-feeds#:~:text=Schema%20Version%202.0%20%3A%C2%A0%20NVD%20JSON%202.0%20Schema)>
  - <https://csrc.nist.gov/schema/nvd/api/2.0/cve_api_json_2.0.schema>
  - [./schema/nvd-api-2.0.json](./schema/nvd-api-2.0.json)

- CVSS v4.0
  - <https://csrc.nist.gov/schema/nvd/api/2.0/external/cvss-v4.0.json>
  - [./schema/cvss-4.0.json](./schema/cvss-4.0.json)

- CVSS v3.1
  - <https://csrc.nist.gov/schema/nvd/api/2.0/external/cvss-v3.1.json>
  - [./schema/cvss-3.1.json](./schema/cvss-3.1.json)

- CVSS v3.0
  - <https://csrc.nist.gov/schema/nvd/api/2.0/external/cvss-v3.0.json>
  - [./schema/cvss-3.0.json](./schema/cvss-3.0.json)

- CVSS v2.0
  - <https://csrc.nist.gov/schema/nvd/api/2.0/external/cvss-v2.0.json>
  - [./schema/cvss-2.0.json](./schema/cvss-2.0.json)

[Suggested API Workflow](https://nvd.nist.gov/developers/api-workflows)

## Results

```
--- NVD Synchronization Complete ---
--- FINAL RESULTS ---
Total CVEs Retrieved (via NVD totalResults): 319612
Total CVEs Processed (in batches): 319612
Total Successful Records for Database: 303423
Total Rejected (Status 'Rejected'): 16189
Total Failed (Logged to badCVEs.jsonl): 0
Total Extraction Issues: NaN

- Total Unknown Severity Levels: 1869
- Total Unknown Product/Version: 44151
- Total Validation Fails: 0

```
