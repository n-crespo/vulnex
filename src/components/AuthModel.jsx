import {useState} from "react";
import {X} from "lucide-react";

// this is the auth model for Logging in and/or Registering
export default function AuthModel({closeTheAuthForm, whenUserLoginIsSuccessful}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newUserRegistering, setNewUserRegistering] = useState(false);
    const [noticeBoardMessage, setNoticeBoardMessage] = useState("");

    // the userButtonSubmit function handles button clicks for logging in or registering:
    const userButtonSubmit = async (e) => {
        e.preventDefault();
        setNoticeBoardMessage("");

        // this path will be called by the Login or Register button
        const loggingInOrRegisteringPath = newUserRegistering ? "/api/users/register" : "/api/users/login";
        
        try
        {
            // waiting for user to login or register
            const newUserOrLoginResponse = await fetch(loggingInOrRegisteringPath, {
                method: "POST", // this is a post request that sends the data to the mongoDB
                headers: { "Content-Type": "application/json" }, // this specifies JSON inbound
                body: JSON.stringify({ email, password }), // email and password get sent to mongoDB
            });
            
            const data = await newUserOrLoginResponse.json(); // this gets the json response 

            if (!newUserOrLoginResponse.ok)
            {
                throw new Error(data.message || "Error - await response.json() failed");
            }

            if (newUserRegistering)
            {
                // Successful registration. Then Auto-login for the new user
                setNewUserRegistering(false);
                setNoticeBoardMessage("Successfully registered. You may Login.");
            }
            else
            {
                // if not registering, then login was success
                whenUserLoginIsSuccessful(data.loginSessionToken); // keep the user logged in with their session token
                closeTheAuthForm(); // then close
            }
        }
        catch (err) 
        {
            // post any errors
            setNoticeBoardMessage(err.message);
        }
    };

    // return the Auth model jsx for button rendering to the UI
    return (
        <div className="relative p-6 bg-white rounded-lg z-50 w-96">
            <button onClick={closeTheAuthForm} className="absolute top-4 right-4">
                <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-4">{newUserRegistering ? "Register" : "Login"}</h2>

            {noticeBoardMessage && <div className="rounded mb-4 text-sm text-yellow-800">{noticeBoardMessage}</div>}

            {/* create a basic form for logging in and registering with a submit button*/}
            <form onSubmit={userButtonSubmit} className="flex">
                <input 
                type="email"
                placeholder="Email"
                className="w-full mb-4 boarder rounded"
                value={email}
                onChange={(err) => setEmail(err.target.value)}
                required
                />
                <input
                type="password"
                placeholder="Password"
                className="w-full mb-4 borader rounded"
                value={password}
                onChange={(err) => setPassword(err.target.value)}
                required
                />
                <button type="submit" className="w-full text-white rounded">
                    {newUserRegistering ? "Register" : "Login"}
                </button>
            </form>
        </div>
    );
}