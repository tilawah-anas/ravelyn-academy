import api from "./api.js";

// const url = "https://sms.tunnelto.me/api";

const username = document.getElementById("name");
const useremail = document.getElementById("email");
const usersubject = document.getElementById("subject");
const usermessage = document.getElementById("message");
const contactForm = document.getElementById("contactForm");
const submitButton = document.getElementById("submitBtn");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
    const fullName = username.value.trim()
    const email = useremail.value.trim()
    const subject = usersubject.value.trim()
    const message = usermessage.value.trim()
  const payload = {
    fullName,
    email,
    subject,
    message
  };

  console.log(payload)

  try {
    const response = await api('/contact', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    console.log(response)
  } catch (error) {
    alert(error.message);
  }
});
