# Tests

## API Tests

Here is what these tests do:

```js
const PORT = process.env.PORT || 3000;
const LOCAL_URL = `http://localhost:${PORT}`;
const REMOTE_URL = `https://vulnex-api.onrender.com/api/cves`;
const VALID_API_KEY = process.env.API_SECRET_KEY;
```

The tests into are in two sections: requests to the LOCAL server (at local_url)
and REMOTE server (at vulnex-api.onrender... URL). For each section, we send the
following requests:

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
