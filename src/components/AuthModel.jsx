import { useState } from "react";
import { X } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";

export default function AuthModel() {
  // Access global state and functions from the context
  const { setDoAuthModel, doLoginSuccess } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newUserRegistering, setNewUserRegistering] = useState(false);
  const [noticeBoardMessage, setNoticeBoardMessage] = useState("");

  const userButtonSubmit = async (e) => {
    e.preventDefault();
    setNoticeBoardMessage("");

    // the API path either has "" in front for local debugging or the Azure path when deployed
    let LOCAL_VS_AZURE_ONLINE_PATH = import.meta.env.DEV
      ? ""
      : "https://vulnex-api.onrender.com";

    LOCAL_VS_AZURE_ONLINE_PATH = LOCAL_VS_AZURE_ONLINE_PATH.replace(/\/$/, "");

    const trailingEndOfPath = newUserRegistering
      ? "/api/users/register"
      : "/api/users/login";

    const loggingInOrRegisteringPath =
      LOCAL_VS_AZURE_ONLINE_PATH + trailingEndOfPath;

    try {
      const newUserOrLoginResponse = await fetch(loggingInOrRegisteringPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await newUserOrLoginResponse.json();

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
        // Use the context function to handle success
        // Note: doLoginSuccess inside AuthContext also handles closing the modal
        doLoginSuccess(data.loginSessionToken);
      }
    } catch (err) {
      setNoticeBoardMessage(err.message);
    }
  };

  return (
    <div className="fixed inset-0 flex items-start justify-end z-50 pr-4 mt-16">
      <div className="relative p-6 bg-white rounded-lg w-96 shadow-xl border border-gray-200 mt-2">
        <button
          // Use the context setter to close the modal
          onClick={() => setDoAuthModel(false)}
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
          <button
            type="submit"
            className="w-full text-white py-2 rounded bg-blue-600"
          >
            {newUserRegistering ? "Register" : "Login"}
          </button>
        </form>

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
