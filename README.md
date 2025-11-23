# [VulnEx (Vulnerability Explorer)](https://n-crespo.github.io/vulnex)

[![deploy status](https://github.com/n-crespo/vulnex/actions/workflows/deploy.yaml/badge.svg)](https://github.com/n-crespo/vulnex/actions/workflows/deploy.yaml)

[Project Plan and Proposal](https://docs.google.com/document/d/1iviznrFmZiiG2GUe3oLPzbtLUC5X77XqRDzyYNCOCEE/edit?usp=sharing)

Live at <https://n-crespo.github.io/vulnex>

## Development Setup

First clone the repository:

```bash
git clone https://github.com/n-crespo/vulnex
cd vulnex
```

> [!NOTE]
> All of the following commands should be run from the root directory of the
> repository.

### Install Dependencies

```bash
npm i
```

### Start API on Local Server

```bash
npm run dev:api
```

### Start Front End

```bash
npm run dev:frontend
```

## Tests

```bash
# test API functionality (remote AND local) (requires API-SECRET-KEY key)
npm run test:api
```

## Milestones

1. [x] Basic front end interface (\~1.5 weeks)
   1. [x] Feed of (placeholder) CVE’s
   2. [x] Search bar above feed
   3. [x] Separate page or popup for file upload
2. [x] Figure out the API/database (\~2 weeks)
   1. [x] Determine with api to use to collect all CVEs
   2. [x] Do we want to fetch all the CVE’s every time the page loads?
   3. [x] How much filtering is possible?
   - [ ] Properly use API to render a feed
3. [ ] Implement user auth/login
   - [ ] Personalized interest tags (associated with user account)
   - [ ] bookmarking feature (attach certain CVEs (by ID) to a user account)
   - [ ] save CVEs found in file upload to user account
4. [ ] Put it all together (\~2 weeks)
   - [ ] Proper Filtering
   - [ ] Store CVEs found in uploaded file in auth db

## Core Features

1. File uploads (specifically .json)
2. File Parsing
3. List of recent CVE’s
4. Advanced CVE filtering
   - searching for CVEs with severity > some number
   - searching for CVEs published after some date
   - searching for CVEs with for a particular product (comes from CPE id)
   - searching for CVEs with for a particular product version (comes from CPE id)
   - searching for CVEs of a particular vulnerability type (comes from CWE id)
5. CVE keyword search
   - **searching for one cveID (these are unique)**
   - **searching for keyword within summarySnippet**

## "Nice to have" Features

1. comprehensive vulnerability report (as pdf or html)
2. Select CVE to view general information + link to the original report
3. Scrape a user’s public repositories for packages.json/other dependencies

## Disclaimer

This product uses data from the NVD API but is not endorsed or certified by the NVD.
