import { useState } from "react";

/**
 * Custom hook for managing application authentication state and logic.
 * Encapsulates the user login session token and controls the visibility
 * of the authentication modal.
 */
export const useAuth = (initialTabSetter) => {
  // null = not logged in
  const [userLoginSessionToken, setUserLoginSessionToken] = useState(null);
  // controls if the AuthModel is visible
  const [doAuthModel, setDoAuthModel] = useState(false);

  /**
   * Called upon successful login from the AuthModel.
   * @param {string} newToken - The session token received after login.
   */
  const doLoginSuccess = (newToken) => {
    setUserLoginSessionToken(newToken);
    setDoAuthModel(false); // Close the modal
  };

  /**
   * Clears the session token, effectively logging the user out.
   */
  const doLogoutAndClearSessionToken = () => {
    setUserLoginSessionToken(null);
    // Use the passed function to switch the active tab back to 'explore' on logout
    if (initialTabSetter) {
      initialTabSetter("explore");
    }
  };

  return {
    userLoginSessionToken,
    doAuthModel,
    setDoAuthModel,
    doLoginSuccess,
    doLogoutAndClearSessionToken,
    isLoggedIn: !!userLoginSessionToken,
  };
};
