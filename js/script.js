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
  const payload = {
    fullName: username.value.trim(),
    email: useremail.value.trim(),
    subject: usersubject.value.trim(),
    message: usermessage.value.trim()
  };

  // console.log(payload)

  try {
    const response = await api('/contact', {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // console.log(response)
  } catch (error) {
    alert(error.message);
  } finally {
    contactForm.reset()
  }
});
