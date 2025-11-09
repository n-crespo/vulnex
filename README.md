# VulnEx (Vulnerability Explorer)

[![deploy](https://github.com/n-crespo/vulnex/actions/workflows/deploy.yaml/badge.svg)](https://github.com/n-crespo/vulnex/actions/workflows/deploy.yaml)

[Project Plan and Proposal](https://docs.google.com/document/d/1iviznrFmZiiG2GUe3oLPzbtLUC5X77XqRDzyYNCOCEE/edit?usp=sharing)

## Development Setup

```bash
git clone https://github.com/n-crespo/vulnex
cd vulnex
npm i
npm run dev
```

## Milestones

1. Basic front end interface (\~1.5 weeks)
   1. Feed of (placeholder) CVE’s
   2. Search bar above feed
   3. Separate page or popup for file upload
2. Figuring out the API/database (\~2 weeks)
   1. Determine with api to use to collect all CVEs
   2. Properly use it to render a full feed
   3. Do we want to fetch all the CVE’s every time the page loads?
      Or make one huge api call once and store everything in the database?
      (the answer is probably a combination, after some period of time ex.
      1 day we should update the database of CVE’s with a new api call, but not
      make the call on page load)
   4. Are there tags/topics attached to each CVE that contain what the CVE is
      about?
      (if not we can do some string parsing)
   5. How much filtering is possible?
3. Actual Functionality (\~2 weeks)
   1. Implement searching and filtering functionality through collected CVE’s
      (filters by package and package version, tags for user interest, general
      areas ex.
      web dev)
   2. User uploaded files need to be stored in database and parsed (then result
      in a filtered CVE list like in (a)
   3. More if we have time\!

## Feature Priorities

Must have features:

1. File uploads (specifically .json)
2. List of recent CVE’s
3. Search through CVE’s by keyword
4. Filtering by CVSS Score/Severity info

Should have features:
1. Filter CVE’s by topic/area/recency
2. Select a CVE to view general information about it and see a link to the
   original report

"Cool" features:
1. Provide comprehensive vulnerability report
2. User auth/login
3. Personalized interest tags (associated with user account)
4. Nice UI
5. Scrape a user’s public repositories for packages,
