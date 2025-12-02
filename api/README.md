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

> [!NOTE]
> Many of these routes return CVE objects. See the [CVE JSON
> schema](../schemas/cve.schema.json) to know what to expect form these.

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
