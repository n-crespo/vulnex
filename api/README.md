# VulnEx Backend

## Development Setup

```sh
npm run dev
```

## Production Setup

```sh
npm run start
```

## Components

Database: mongoDB
API: expressJS, deployed with Render

## CVE Data Model Info

A CVE record will contain the following fields:

```text
"id"
the unique id of the CVE record
regex: "^CVE-[\d]{4}-[\d]{4,}$"
published
date on which the CVE record was first published. Modified ISO 8601 format
ex. 1988-10-01T04:00:00.000
regex: "^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?$"

"lastModified"
date on which the CVE record was last modified. Modified ISO 8601 format
ex. 1988-10-01T04:00:00.000
regex: "^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?$"

"status"
string containing Left column of below table: 
Received: The CVE has recently been published to the CVE List and has been included within the NVD dataset.
Awaiting Analysis: The CVE has been marked for NVD enrichment efforts.
Undergoing Analysis: The CVE is currently being enriched by team members, this process results in the association of reference link tags, CVSS, CWE, and CPE applicability statement data.
Analyzed: The CVE has had enrichment completed. CVEs in this status do not show a banner on the vulnerability detail page.
Modified: The CVE record has been updated after NVD enrichment efforts were completed. Enrichment data supplied by the NVD may require amendment due to these changes.
Deferred: The CVE is not being prioritized for NVD enrichment efforts due to resource or other concerns.
Rejected:  The CVE has been marked Rejected in the CVE List. These CVEs are stored in the NVD, but do not show up in search results by default.
regex: "^(Received|Awaiting\ Analysis|Undergoing\ Analysis|Analyzed|Modified|Deferred|Rejected)$"

"description"
a brief description of the CVE
regex: none (can be any string)

"baseSeverityScore"
numerical value from 0-10 where 10 is the severity of this vulnerability is highest
regex: "[0-9][0-9]?"

"isVulnerable"
boolean that describes whether the vulnerability has been patched ("false") or is still vulnerable ("true")
regex: "true|false"

"cpeId"
an ID containing info on what software product/version was affected by the CVE. in standard CPE v2.3 format
regex: "cpe:2\.3:[aho\*\-](:(((\?*|\*?)([a-zA-Z0-9\-\._]|(\\[\\\*\?!"#$$%&'\(\)\+,/:;<=>@\[\]\^`\{\|}~]))+(\?*|\*?))|[\*\-])){5}(:(([a-zA-Z]{2,3}(-([a-zA-Z]{2}|[0-9]{3}))?)|[\*\-]))(:(((\?*|\*?)([a-zA-Z0-9\-\._]|(\\[\\\*\?!"#$$%&'\(\)\+,/:;<=>@\[\]\^`\{\|}~]))+(\?*|\*?))|[\*\-])){4}"
note: see for official regex:  https://csrc.nist.gov/schema/cpe/2.3/cpe-naming_2.3.xsd
```
