import api from "./api.js";

// const url = "https://sms.tunnelto.me/api";

const username = document.getElementById("name");
const useremail = document.getElementById("email");
const usersubject = document.getElementById("subject");
const usermessage = document.getElementById("message");
const contactForm = document.getElementById("contactForm");
const submitButton = document.getElementById("submitBtn");
const success = document.getElementById('success')

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitButton.disabled = true
  submitButton.textContent = 'Sending...'
  success.textContent = "";

  const payload = {
    fullName: username.value.trim(),
    email: useremail.value.trim(),
    subject: usersubject.value.trim(),
    message: usermessage.value.trim()
  };

  // console.log(payload)

  try {
    await api('/contact', {
      method: "POST",
      body: JSON.stringify(payload),
    });

    success.textContent = 'Your response has been sent!'
    setTimeout(()=>{
      success.textContent = '';
    }, 3000)
    // console.log(response)
  } catch (error) {
    alert(error.message);
  } finally {
    submitButton.disabled = false
    submitButton.textContent = 'Send Message'
    contactForm.reset()
  }
});
