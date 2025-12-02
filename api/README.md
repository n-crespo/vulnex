# VulnEx API

## Development Setup

From the root directory of this project, run the following to start the API
locally.

```sh
npm i
npm run dev:api
```

You can now send HTTP requests to `localhost:3000`.

## API Interface + Routes

The following assumes that the API's base URL is pre-pended to every string.
(ex. `localhost:3000/api/cves` or `https://vulnex-api.onrender.com/api/cves`)

### `/`

Not much to see here.

GET

- The root of the API. Will just send a success message in HTML.

### `/api/cves/`

Interact with the full database of CVEs.

GET

- Fetch paginated CVEs from the database.
- Query Params:
  - `?limit=`: max number of CVEs to return (default: 100)
  - `?skip=`: offset from CVE 0 in db to start returning (default: 0)
  - `?productName=`: filter results by a specific product name (e.g., 'dompurify') - case-insensitive substring match
  - `?severityLevel=`: filter results by a specific severity level (e.g., 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW') - exact match
  - `?version=`: filter results to only include CVEs applicable to this specific version (e.g., '1.0.1').
    - This filter is only applied if `productName` is also provided.
  - `?publishedStart=`: filter results to include only CVEs published on or after this date (e.g., '2023-01-01') - exact date match.
  - `?publishedEnd=`: filter results to include only CVEs published on or before this date (e.g., '2023-12-31') - exact date match.
  - `?keyword=`: filter results by a keyword within the CVE description (e.g., 'injection') - case-insensitive substring match.
- Response Headers:
  - `X-Page-Count`: The number of CVEs returned in the current response body.
  - `X-Total-Count`: The total number of documents found in the database matching ALL query filters (including version).
  - `X-Initial-Offset`: The 'skip' value used for the query.
- Response JSON:
  - `[ { ... }, { ... } ] // array of requested CVEs`

POST

- Create a CVE and push to the database.
- Single
  - Request Body:
    `{ ... } // one CVE record`
  - Response JSON:
    `{ ... } // the newly created CVE record`
- Bulk
  - Request Body:
    `[ { ... } { ... } ] // an array of CVEs to add`
  - Response JSON:
    ```json
    {
      "message": // success message
      "count": // number of records created
      "data": [ { ... }, { ... } ] // array of newly created CVE records
    }
    ```

PUT

- Update a CVEs contents.
- Request body (array of objects):
  ```json
  [
    {
      "cveId": "ID-1",
      "update": { "severity": "LOW" }
    }
  ]
  ```
- Response:
  ```json
  {
    "message": "Success Message",
    "matchedCount": 2, // Number of CVEs found and attempted to update
    "modifiedCount": 2 // Number of CVEs successfully modified
    "errors": [...] // an optional array of collected errors
  }
  ```

### `/api/cves/:id`

Interact with just a single CVE, by ID.

GET

- Fetch one CVE by ID.
- `:id` = some CVE id (ex. CVE-2025-45878)
- returns the single CVE that has the specified ID

DELETE

- Delete one CVE by ID.
- Response JSON:
  `{ message: "Success message" }`

### `/api/cves/bulk-delete`

Delete CVEs in bulk. Different route than others to avoid unfortunate accidents.

DELETE

- Request body: `{ "cveIds": ["CVE-ID-1", "CVE-ID-2", ...] }`
- Response:
  ```json
  {
    "message": "Success Message"
    "deletedCount": 2 // Number of CVEs successfully deleted
    "requestedCount": 2 // Number of CVEs requested for deletion
  }
  ```

## Components

Database: MongoDB, managed with `mongoose` in JavaScript \
API: expressJS, [deployed](https://vulnex-api.onrender.com/) with Render

## The CVE Data Model

A **CVE (Common Vulnerabilities and Exposures)** record contains the following
essential fields. Restricting CVEs stored in our database to these fields only
allows us to reduce our data storage requirements by over 50x. This is
especially important because of the 512MB data limit on MongoDB's free tier and
the fact that there are over 300k CVEs summing to ~7GB of data in total.

> [!NOTE]
> For more condensed documentation, see the [CVE JSON
> schema](../schemas/cve.schema.json).

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

## Discarded CVEs

Here are some definitions of what the `status` field means (from NVD docs). To
reduce data storage, I discard all `Rejected` CVEs.

| Status Value              | Meaning                                         |
| :------------------------ | :---------------------------------------------- |
| **`Received`**            | Recently published to the CVE List.             |
| **`Awaiting Analysis`**   | Marked for NVD enrichment efforts.              |
| **`Undergoing Analysis`** | Currently being enriched (CVSS, CWE, CPE data). |
| **`Analyzed`**            | Enrichment is complete.                         |
| **`Modified`**            | Updated after NVD enrichment.                   |
| **`Deferred`**            | Not prioritized for NVD enrichment.             |
| **`Rejected`**            | Marked Rejected in the CVE List.                |

Some previously included fields were removed from my data model for the following reasons:

- `isVulnerable`: why include CVEs that aren't vulnerable? Besides, most (if not all) CVEs are vulnerable for some version of a product.
- `dateModified`: didn't find this very relevant to our app, included `published` Date field so user can understand "age" of a CVE.
- `patchedInVersion`: extracting this info from CVEs is very unreliable as the NVD doesn't really concern itself in the PATCHes to vulnerabilities, just the vulnerabilities themselves.
- `status`: besides rejected CVEs (which were discarded) this info again isn't very useful to the end user. Can always be accessed through full CVE report.
