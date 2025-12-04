import { useState } from "react";
import { X } from "lucide-react";

// this is the auth model for Logging in and/or Registering
export default function AuthModel({
  closeTheAuthForm,
  whenUserLoginIsSuccessful,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newUserRegistering, setNewUserRegistering] = useState(false);
  const [noticeBoardMessage, setNoticeBoardMessage] = useState("");

  // the userButtonSubmit function handles button clicks for logging in or registering:
  const userButtonSubmit = async (e) => {
    e.preventDefault();
    setNoticeBoardMessage("");

    // the API path either has "" in front for local debugging or the Azure path when deployed
    let LOCAL_VS_AZURE_ONLINE_PATH = import.meta.env.DEV
      ? ""
      : "https://vulnex-cpckbefubudnhab6.eastus2-01.azurewebsites.net";

    LOCAL_VS_AZURE_ONLINE_PATH = LOCAL_VS_AZURE_ONLINE_PATH.replace(/\/$/, ""); // ensure / is not trailing

    const trailingEndOfPath = newUserRegistering
      ? "/api/users/register"
      : "/api/users/login";
    // this path will be called by the Login or Register button
    const loggingInOrRegisteringPath =
      LOCAL_VS_AZURE_ONLINE_PATH + trailingEndOfPath;

    try {
      // waiting for user to login or register
      const newUserOrLoginResponse = await fetch(loggingInOrRegisteringPath, {
        method: "POST", // this is a post request that sends the data to the mongoDB
        headers: { "Content-Type": "application/json" }, // this specifies JSON inbound
        body: JSON.stringify({ email, password }), // email and password get sent to mongoDB
      });

      const data = await newUserOrLoginResponse.json(); // this gets the json response

      if (!newUserOrLoginResponse.ok) {
        throw new Error(
          data.message ||
            "Error - 'await response.json()' or 'await fetch(loggingInOrRegisteringPath' failed",
        );
      }

      if (newUserRegistering) {
        // Successful registration. Then Auto-login for the new user
        setNewUserRegistering(false);
        setNoticeBoardMessage("Successfully registered. You may Login.");
      } else {
        // if not registering, then login was success
        whenUserLoginIsSuccessful(data.loginSessionToken); // keep the user logged in with their session token
        closeTheAuthForm(); // then close
      }
    } catch (err) {
      // post any errors
      setNoticeBoardMessage(err.message);
    }
  };

  // return the Auth model jsx for button rendering to the UI
  return (
    <div className="fixed inset-0 flex items-start justify-end z-50 pr-4 mt-16">
      <div className="relative p-6 bg-white rounded-lg w-96 shadow-xl border border-gray-200 mt-2">
        <button
          onClick={closeTheAuthForm}
          className="absolute top-4 right-4 text-gray-500"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-4">
          {newUserRegistering ? "Register" : "Login"}
        </h2>

        {noticeBoardMessage && (
          <div className="rounded mb-4 text-sm text-yellow-800 p-2">
            {noticeBoardMessage}
          </div>
        )}

        {/* create a basic form for logging in and registering with a submit button*/}
        <form onSubmit={userButtonSubmit} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(userInput) => setEmail(userInput.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(userInput) => setPassword(userInput.target.value)}
            required
          />
          {/* button for submitting login/register: */}
          <button
            type="submit"
            className="w-full text-white py-2 rounded bg-blue-600"
          >
            {newUserRegistering ? "Register" : "Login"}
          </button>
        </form>

        {/* button to switch between logging in and registering: */}
        <button
          onClick={() => {
            setNewUserRegistering(!newUserRegistering);
            setNoticeBoardMessage("");
          }}
          className="w-full mt-4 text-sm"
        >
          {newUserRegistering ? "Existing User Login" : "New Users Register"}
        </button>
      </div>
    </div>
  );
}
