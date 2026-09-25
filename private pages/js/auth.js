import { api } from "./api.js";
import { setSession } from "./authorization.js";


const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginError = document.getElementById("loginError");
const togglePassword = document.getElementById("togglePassword");


//to view password
togglePassword.addEventListener("click", () => {
    const showingPassword = passwordInput.type === "text";
    passwordInput.type = showingPassword ? 'password': 'text';
    togglePassword.innerHTML = showingPassword ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
});



loginForm.addEventListener( "submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    //some people are stubbon, they'll submit empty fields, so we check even though our e.preventdefault stops that
        if (!email || !password) {
            loginError.textContent = "Email and password are required.";
            return;
        }

        setLoading(true)
        try {
            const response = await api( "/auth/login", {
                        method: "POST",
                        body: JSON.stringify({ email, password 
                    })
                });

            const token = response?.data?.token ?? response?.token;
            const user  = response?.data?.user  ?? response?.user;
            // if (!token) {
            //     throw new Error(
            //         "Login succeeded but no token was returned."
            //     );
            // }
            setSession({ token, user });
            window.location.href = "./pages/dashboard.html";
        } catch (error) {
            loginError.textContent =  `Invalid Login Credentials`;
        } finally {
            setLoading(false)
        }
    }
);


function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    loginButtonText.textContent = isLoading ? "Signing in..." : "Sign in";
}