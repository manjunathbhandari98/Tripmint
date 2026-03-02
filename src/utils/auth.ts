const AUTH_KEY = "tripmint_auth";

export const login = (username: string, password: string) => {
  const validUsername = "admin";
  const validPassword = "tripmint123";

  if (username === validUsername && password === validPassword) {
    localStorage.setItem(AUTH_KEY, "true");
    return true;
  }

  return false;
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = () => {
  return localStorage.getItem(AUTH_KEY) === "true";
};