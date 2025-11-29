# Tests

## Usage

(optional) Start the server locally from `api/`:

If you skip this step the tests will detect it and won't try to make requests to
the local server, only the remote (<https://vulnex-api.onrender.com/>). Be aware
that the remote server does go to sleep after inactivity and can take about a
minute to boot back up after it receives a request.

```sh
~/dev/vulnex main ❯ pwd
/home/nicolas/dev/vulnex
~/dev/vulnex main ❯ cd api
~/dev/vulnex/api main ❯ npm run dev

> backend@1.0.0 dev
> node --env-file=../.env --watch-path=./ index.js

connected to the db!
Server running on port 3000
--------------------
```

Then, run the tests in another terminal from `tests/`:

```sh
~/dev/vulnex main ❯ pwd
/home/nicolas/dev/vulnex
~/dev/vulnex main ❯ cd tests
~/dev/vulnex/tests main ❯ npm run test

> tests@1.0.0 test
> node --env-file=../.env node_modules/.bin/mocha *.test.js
```

> [!NOTE]
> The following two variables are needed for full functionality. They should be
> specified in a file called `.env` in the root directory of this repository.
> `MONGO_DB_URI`: Needed to connect to MongoDB with local server. Only needed if you are using the locally hosted API.
> `API_SECRET_KEY`: Needed to complete write actions on the database (POST/PUT/DELETE). Tests will fail without this.

## API Tests

Here is what these tests do:

The tests into are in two sections: requests to the LOCAL server and REMOTE
server. For each section, we send the following requests:

- GET at `/`
- GET at `/api/cves` (this gets all CVEs)
- POST at `/api/cves` with a body that is a new CVE (to be added). Omit the API key in the request header. this should fail!
- make the same POST request but now WITH the x-api-key header. this shouldn't fail. parse the request to get the data.\_id. use this in the next request
- GET at `/api/cves/{the id we just found from the last POST request`} (this will get the CVE we just created)
- PUT at `/api/cves/{that same id}`. in the body simply change the name of the CVE to "CHANGED". omit the x-api-key in the header. this should FAIL
- the same PUT but with the api key. this should work.
- GET at `/api/cves/{that same id}`. ensure that the name is now "CHANGED"
- DELETE at `/api/cves/{that same id}`. omit the api-key. this should fail!
- the same DELETE but with the api-key. this should work.
- GET at `/api/cves/{that same id}`. This should work but find nothing, since we just deleted this CVE.
