# VulnEx Data-Sync

This module of VulnEx is responsible for fetching all CVEs from the National
Vulnerability Database (NVD), parsing, cleaning, and extracting relevant
information, and pushing them into the VulnEx database.

## The CVE Data Model

VulnEx sources its vulnerability data from the National Vulnerability Database
(NVD) which is home to over 300k Common Vulnerabilities and Exposures (CVE)
records, with total data size of 6-7 gigabytes. The NVD conveniently provides a
public API through which anyone can fetch and search through this CVE data, but
the rate limiting on this API would slow down a web app with more than a few
concurrent users. To circumvent this, VulnEx hosts its own (leaner) copy of the
entire CVE dataset in a database available through a custom CRUD API that can
scale better for a web app with many concurrent users.

However, the free tier on VulnEx's MongoDB backend is limited to 512MB of data
(far from the 6-7 GB of CVEs that the NVD contains). To remedy this, the VulnEx
database contains only fields that we deemed the most essential. These are
listed below.

Restricting CVEs stored in our database to these fields allows us to reduce our
data storage requirements by over 50x, making us fit quite nicely inside of the
free tier requirements. Lastly, with some asynchronous JavaScript functions that
send bulk POST requests to the VulnEx API, we can fetch, clean, and store all
6-7GB of data in the NVD just over a minute.

> [!NOTE]
> For more condensed documentation on what VulnEx's CVE object looks like, see
> the [CVE JSON schema](../schemas/cve.schema.json).

CVEs in VulnEx's database contain the following fields:

- `cveId`: The unique identifier of the CVE record.
  - _Type_: String
  - _Regex_: `/^(CVE|VUL|TEST)-\d{4}-\d{4,}$/i`
- `published`: The date on which the CVE record was first published (Modified ISO 8601 format).
  - _Type_: Date
  - _Example_: `1988-10-01T04:00:00.000`
- `description`: A brief description of the CVE.
  - _Type_: String
  - _Regex_: `none`
- `severityLevel`: Categorical value that displays the severity of the vulnerability.
  - _Type_: String
  - _Enum_: `["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"]`
- `productName`: The name of the software that this CVE affects.
  - _Type_: String
- `productVersions`: An object containing information about what versions of the product are vulnerable.
  - _Type_: Array of Objects (Object definition below)
  - ```json
    {
      "type": "object",
      "properties": {
        "start": {
          "type": "string",
          "description": "Start of version range"
        },
        "end": {
          "type": "string",
          "description": "End of version range"
        },
        "s_type": {
          "type": "string",
          "enum": ["i", "e"],
          "description": "Start is inclusive (i) or exclusive (e)"
        },
        "e_type": {
          "type": "string",
          "enum": ["i", "e"],
          "description": "End is inclusive (i) or exclusive (e)"
        }
      },
      "required": ["start", "end", "s_type", "e_type"]
    }
    ```

> [!NOTE]
> All fields above are required for every record. Similarly, any fields pushed
> to the database besides the above will be discarded.

Putting this all together, an example of a CVE in our database looks like this:

```json
{
  "cveId": "CVE-2025-45878",
  "published": "2025-06-17T17:15:33.487",
  "description": "A cross-site scripting (XSS) vulnerability in the report manager function of Miliaris Amigdala v2.2.6 allows attackers to execute arbitrary HTML in the context of a user's browser via a crafted payload.",
  "severityLevel": "MEDIUM",
  "productName": "miliaris:amygdala",
  "productVersions": [
    {
      "start": "2.2.6",
      "s_type": "i",
      "end": "2.2.6",
      "e_type": "i"
    }
  ]
}
```

## Discarded CVEs and Fields

To reduce data storage, I discard all CVEs that are marked as `Rejected` by the
NVD. These are more prone to missing, inconsistent or just incorrect data.

Some previously included fields were removed from my data model for the
following reasons:

- `isVulnerable`: why include CVEs that aren't vulnerable? Besides, most (if not all) CVEs are vulnerable for some version of a product.
- `dateModified`: didn't find this very relevant to our app, included `published` Date field so user can understand "age" of a CVE.
- `patchedInVersion`: extracting this info from CVEs is very unreliable as the NVD doesn't really concern itself in the PATCHes to vulnerabilities, just the vulnerabilities themselves.
- `status`: besides rejected CVEs (which were discarded) this info again isn't very useful to the end user. Can always be accessed through full CVE report.

## Resources

> [!NOTE]
> For troubleshooting, find a SINGLE cve with the following URL format:
>
> ```url
> https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={YOUR-CVE-ID}
> ```
>
> For example, see
> <https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2021-21429>

- [General CVE Schema (from NVD)](https://nvd.nist.gov/vuln/data-feeds#:~:text=Schema%20Version%202.0%20%3A%C2%A0%20NVD%20JSON%202.0%20Schema)
- [NVD Data Feed Info](https://nvd.nist.gov/vuln/data-feeds)
- [NVD API Documentation](https://nvd.nist.gov/developers/vulnerabilities)
- [NVD Suggested API Workflow](https://nvd.nist.gov/developers/api-workflows)
- CVSS Schema (for severity scoring)
  - [CVSS v4.0 Schema](https://csrc.nist.gov/schema/nvd/api/2.0/external/cvss-v4.0.json)
  - [CVSS v3.1 Schema](https://csrc.nist.gov/schema/nvd/api/2.0/external/cvss-v3.1.json)
  - [CVSS v3.0 Schema](https://csrc.nist.gov/schema/nvd/api/2.0/external/cvss-v3.0.json)
  - [CVSS v2.0 Schema](https://csrc.nist.gov/schema/nvd/api/2.0/external/cvss-v2.0.json)
