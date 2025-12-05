# [VulnEx (Vulnerability Explorer)](https://n-crespo.github.io/vulnex)

[![deploy status](https://github.com/n-crespo/vulnex/actions/workflows/deploy.yaml/badge.svg)](https://github.com/n-crespo/vulnex/actions/workflows/deploy.yaml)

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
# start api locally (requires Mongo URI/API secret key in .env in root dir)
npm run dev:api
```

### Start Front End

```bash
# start website locally
npm run dev
```

### Tests

```bash
# test API functionality (requires API to be running locally)
npm run test:api
```

## Other

[Project Plan and Proposal](https://docs.google.com/document/d/1iviznrFmZiiG2GUe3oLPzbtLUC5X77XqRDzyYNCOCEE/edit?usp=sharing)

## Diagrams
The Web_Application_Architecture_Diagram.pdf in the diagrams folder shows the high level relationship between our website's client to server connections, including the user's frontend UI running React, the backend server running Node.js on Render, and the MongoDB Atlas database cloud that store's our user's data securely.

## Disclaimer

This product uses data from the NVD API but is not endorsed or certified by the NVD.
