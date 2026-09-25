const TOKEN_KEY = "token";
const USER_KEY = "user";

const LOGIN_URL = "/index.html";
const DEFAULT_AUTHED_URL = "./dashboard.html";


export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);


// get user
export const getUser = () => {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        localStorage.removeItem(USER_KEY);
        return null;
    }
};

export const setUser = (user) => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearUser = () => localStorage.removeItem(USER_KEY);

// used in login to set token to storage
export const setSession = ({ token, user }) => {
    setToken(token);
    setUser(user);
};

export const clearSession = () => {
    clearToken();
    clearUser();
};

export const isAuthenticated = () => Boolean(getToken());


export const requireAuth = () => {
    if (!isAuthenticated()) {
        window.location.replace(LOGIN_URL);
        return false;
    }
    return true;
};

export const getDisplayName = (user) =>{
    if (!user) return "User";

    if (user.name) return user.name;

    const full = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    return full || user.email || "User";
}

// if page requires role
export const requireRole = (...roles) => {
    if (!requireAuth()) return false;
    const user = getUser();
    if (!user || !roles.includes(user.role)) {
        window.location.replace(DEFAULT_AUTHED_URL);
        return false;
    }
    return true;
};

// logout
export const logout = () => {
    clearSession();
    window.location.replace(LOGIN_URL);
};