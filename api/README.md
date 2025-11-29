# VulnEx Backend

## Development Setup

```sh
npm run dev
```

## Components

Database: mongoDB
API: expressJS, deployed with Render

## The CVE Data Model

A **CVE (Common Vulnerabilities and Exposures)** record contains the following
essential fields. All are required and enforced by the database. Invalid CVEs
will be rejected. Restricting CVEs stored in our database to these fields only
allows us to reeduce our data storage requirements by over 50 TIMES. This is
especially important because of the 0.5GB data limit on MongoDB's free tier and
the fact that there are over 300k CVEs in total.

### Core Identification and Dates

- **`id`**: The unique identifier of the CVE record.
  - _Regex_: `^CVE-[\d]{4}-[\d]{4,}$`
- **`published`**: The date on which the CVE record was first published (Modified ISO 8601 format).
  - _Example_: `1988-10-01T04:00:00.000`
  - _Regex_: `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?$`
- **`lastModified`**: The date on which the CVE record was last modified (Modified ISO 8601 format).
  - _Example_: `1988-10-01T04:00:00.000`
  - _Regex_: `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?$`
- **`status`**: The current NVD enrichment stage. See the definitions table below.
  - _Regex_: `^(Received|Awaiting\ Analysis|Undergoing\ Analysis|Analyzed|Modified|Deferred|Rejected)$`
- **`description`**: A brief description of the CVE.
  - _Regex_: `none`
- **`baseSeverityScore`**: A numerical value from 0-10, where 10 is the highest severity.
  - _Regex_: `[0-9][0-9]?`
- **`isVulnerable`**: A boolean that describes the patch status: `true` (still vulnerable) or `false` (patched).
  - _Regex_: `true|false`
- **`cpeId`**: An ID containing information on the affected software product/version (CPE v2.3 format).
  - _Note_: Uses the [official](https://cpe.mitre.org/specification/) CPE v2.3 regex.

### Status Definitions

| Status Value              | Meaning                                         |
| :------------------------ | :---------------------------------------------- |
| **`Received`**            | Recently published to the CVE List.             |
| **`Awaiting Analysis`**   | Marked for NVD enrichment efforts.              |
| **`Undergoing Analysis`** | Currently being enriched (CVSS, CWE, CPE data). |
| **`Analyzed`**            | Enrichment is complete.                         |
| **`Modified`**            | Updated after NVD enrichment.                   |
| **`Deferred`**            | Not prioritized for NVD enrichment.             |
| **`Rejected`**            | Marked Rejected in the CVE List.                |

### Example

A sample CVE: ([sample-cve.json](../data-sync/sample-cve.json) )

```json
{
  "cveId": "CVE-1999-0095",
  "published": "1988-10-01T04:00:00.000",
  "lastModified": "2025-04-03T01:03:51.193",
  "status": "Deferred",
  "description": "The debug command in Sendmail is enabled, allowing attackers to execute commands as root.",
  "baseSeverityScore": 10,
  "isVulnerable": true,
  "cpeId": "cpe:2.3:a:eric_allman:sendmail:5.58:*:*:*:*:*:*:*"
}
```
