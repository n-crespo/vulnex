// note: since requests are sent via HTTPS the API key is secure
const API_SECRET_KEY = process.env.API_SECRET_KEY;

const authenticateWriteAccess = (req, res, next) => {
  // check for api key in 'x-api-key'
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    console.log("--- ACCESS DENIED, no api key provided.");
    return res.status(401).json({
      message: "Access Denied: No API Key provided in the x-api-key header.",
    });
  }

  if (apiKey !== API_SECRET_KEY) {
    console.log(`--- Wrong API Key: ${apiKey}`);
    return res.status(403).json({
      message: "Access Forbidden: Invalid API Key.",
    });
  }

  // console.log(`API Key is correct!`);
  next();
};

export default authenticateWriteAccess;
