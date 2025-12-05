# Tests

## E2E Tests (with `playwright`)

### Usage

Run the following commands from the root directory of the project.

```sh
$ npm run test:e2e

> vulnex@0.0.0 test:e2e
> playwright test


Running 7 tests using 7 workers
  7 passed (7.4s)

To open last HTML report run:

  npx playwright show-report
```

Optionally, run `npm run test:e2e:ui` instead to see the entire Playwright front
end. Without the `:ui` it runs headless, which is faster.

Note that these E2E tests are also set up in Github Actions whenever source code
is changed and pushed to the remote.

### Test Descriptions

Core Rendering & Initial Data Access

- User Story: As a new user, I want the CVE dashboard to display the list of vulnerabilities immediately upon loading, so I can begin my security review without delay.
  - Acceptance Criteria (DATA VISIBILITY): The main heading "Vulnerabilities" must be visible, and the dashboard must successfully render at least one CVE card from the API response.
  - Acceptance Criteria (MOCK DATA TEST): When the API is mocked, the specific item "CVE-MOCK-1" must appear on the screen.

Interaction, Navigation, and Security

- User Story: As a returning user, I want to open and close the authentication modal easily, so I can log in or dismiss the prompt to continue browsing.
  - Acceptance Criteria: Clicking the "Login" button must display the modal heading "Welcome Back," and subsequently clicking the close (X) button must completely remove the modal from view.
- User Story: As a security analyst, I want to filter the CVE list by product name and apply that filter efficiently, so I can focus my review on relevant products.
  - Acceptance Criteria: After entering a search term (e.g., "Chrome") and clicking "Apply Filters," the system must show a loading indicator ("Updating results...") and display the filtered CVE list without crashing.
- User Story: As a user, I want to navigate between the main CVE dashboard and the Analysis tool with a single click, so I can seamlessly switch my task context.
  - Acceptance Criteria: Clicking the "Analyze" navigation tab must load the analysis view, which must contain the specific text "Upload package.json".

Dependency Analysis Workflow

- User Story: As a security analyst, I want to upload a package file and trigger a bulk scan for vulnerabilities, so I can quickly identify security risks in my dependencies.
  - Acceptance Criteria (UPLOAD & SCAN): After uploading the file, a "dependencies detected" message must appear, and clicking "Scan Dependencies" must display the results header "Found issues in 1 packages" and list the CVE ID "CVE-2020-0000".
- User Story: As a security analyst, I want to manually dismiss a listed vulnerability after review, so I can keep my active security report clean and focused on unaddressed risks.
  - Acceptance Criteria: Clicking the "Dismiss" action on the vulnerability card must remove "CVE-2020-0000" from the list, and the summary must update to show "0 CVEs Found".

Pagination and Large Dataset Handling

- User Story: As a user, I need the system to display the correct total count and current range of CVEs, so I understand the scope of the data I am viewing.
  - Acceptance Criteria: The pagination control must accurately display the range for the current page and the total count (e.g., "Showing 1-25 of 30").
- User Story: As a user, I need to be able to click the "Next" and "Prev" controls to reliably navigate between pages of CVE data, so I can review all results.
  - Acceptance Criteria (NEXT/PREV NAVIGATION): Clicking "Next" must load the next set of data and update the range (e.g., "Showing 26-30 of 30"), confirming that items from the previous page are no longer visible. Clicking "Prev" must return to the original page range.

## API Integration Tests

### Usage

Start the server locally from the root directory.

```sh
$ npm run dev:api

> vulnex@0.0.0 dev:api
> dotenvx run -- npm run dev -w=api

[dotenvx@1.51.1] injecting env (4) from .env

> vulnex-api@1.0.0 dev
> node --watch-path=./ index.js

connected to the db!
Server running on port 3000
--------------------
```

Then, run the tests in another terminal:

```sh
$ npm run test:api

> vulnex@0.0.0 test:api
> dotenvx run -- npm run test:api -w tests

[dotenvx@1.51.1] injecting env (4) from .env

> vulnex-tests@1.0.0 test:api
> mocha api.test.js
```

> [!NOTE]
> The following two variables are needed for full functionality. They should be
> specified in a file called `.env` in the root directory of this repository.
>
> 1. `MONGO_DB_URI`: Needed to connect to MongoDB with local server. Only needed
>    if you are using the locally hosted API.
> 2. `API_SECRET_KEY`: Needed to complete write actions on the database
>    (POST/PUT/DELETE). API Integration tests will fail without this.

### Test Descriptions

The tests send the following requests:

Public Read Access Tests

- GET at `/`: Check for PUBLIC access (200 OK) to the root endpoint.
- GET at `/api/cves`: Check for PUBLIC access (200 OK) to retrieve all CVEs. The response should be an array.

Protected Create (POST) Tests

- POST at `/api/cves` with a new CVE body, but omitting the `x-api-key` header: This should FAIL with 401 Unauthorized.
- POST at `/api/cves` with an invalid CVE body and the `x-api-key` header: This should FAIL with 400 Bad Request.
- POST at `/api/cves` with a valid new CVE body and the `x-api-key` header: This should PASS (200 OK). Parse the response to get the newly created CVE's `cveId` and store it.
- GET at `/api/cves/{the id we just found from the last POST request}`: Check for PUBLIC access (200 OK) to retrieve the single, newly created CVE.

Protected Delete (Single) Tests

- DELETE at `/api/cves/{that same id}` but omitting the `x-api-key` header: This should FAIL with 401 Unauthorized.
- DELETE at `/api/cves/{that same id}` with the `x-api-key` header: This should PASS (200 OK) and delete the CVE.
- GET at `/api/cves/{that same id}`: This should FAIL with 404 Not Found, confirming the CVE was deleted.

Bulk Operations Tests

- POST at `/api/cves` with a bulk array of new CVEs and the `x-api-key` header: This should PASS (200 OK), create multiple CVEs, and return a count.
- GET at `/api/cves/{id of one of the bulk created CVEs}`: Check for PUBLIC access (200 OK) to retrieve one of the bulk-created CVEs.
- POST at `/api/cves` with an array containing invalid CVE entries and the `x-api-key` header: This should FAIL with 400 Bad Request.

- PUT at `/api/cves` (for bulk update) with a valid body but omitting the `x-api-key` header: This should FAIL with 401 Unauthorized.
- PUT at `/api/cves` (for bulk update) with a valid body and the `x-api-key` header: This should PASS (200 OK) and report the number of matched/modified CVEs.
- GET at `/api/cves/{id of one of the bulk updated CVEs}`: Check that the update was successful by verifying the changed field(s).
- PUT at `/api/cves` (for bulk update) with an empty array body and the `x-api-key` header: This should FAIL with 400 Bad Request.
- PUT at `/api/cves` (for bulk update) where all items are invalid/malformed and the `x-api-key` header: This should FAIL with 400 Bad Request.

- DELETE at `/api/cves/bulk-delete` with a body of CVE IDs but omitting the `x-api-key` header: This should FAIL with 401 Unauthorized.
- DELETE at `/api/cves/bulk-delete` with a body of CVE IDs and the `x-api-key` header: This should PASS (200 OK) and report the `deletedCount`.
- GET at `/api/cves/{id of one of the bulk deleted CVEs}`: This should FAIL with 404 Not Found, confirming bulk deletion.
- DELETE at `/api/cves/bulk-delete` with an empty `cveIds` array and the `x-api-key` header: This should FAIL with 400 Bad Request.
- DELETE at `/api/cves/bulk-delete` with a missing `cveIds` property in the body and the `x-api-key` header: This should FAIL with 400 Bad Request.
- DELETE at `/api/cves/bulk-delete` with non-existent CVE IDs and the `x-api-key` header: This should FAIL with 404 Not Found.

Filtering (GET) Tests

- GET at `/api/cves?productName=...`: Filter results by product name (case-insensitive substring match).
- GET at `/api/cves?productName=...&severityLevel=...`: Filter results by product name AND severity level.
- GET at `/api/cves?productName=...&version=...`: Filter results by product name AND check if the CVE is applicable to the specified version.
- GET at `/api/cves?productName=...&version=...&severityLevel=...`: Filter results by product name, version, AND severity level.
- GET at `/api/cves?productName=...&version=...&publishedStart=...`: Filter results by product name, version, AND a start published date (on or after).
- GET at `/api/cves?productName=...&version=...&publishedEnd=...`: Filter results by product name, version, AND an end published date (on or before).
- GET at `/api/cves?productName=...&version=...&publishedStart=...&publishedEnd=...`: Filter results by product name, version, AND a published date range.
- GET at `/api/cves?productName=...&keyword=...`: Filter results by product name AND a keyword (case-insensitive substring match in the CVE description).
