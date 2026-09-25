const BASE_URL = "http://localhost:3000/api";
import { getToken } from "./authorization.js";
// const BASE_URL = "https://sms.tunnelto.me/api";

export const api = async (endpoint, options = {}) => {
  try {
    // const token = sessionStorage.getItem("token");
    const token = getToken()

    const headers = {
      "Content-Type": "application/json",...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/index.html'
      return;
    }

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned a non-JSON response (${response.status}): ${text.slice( 0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
