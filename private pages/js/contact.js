import { api } from "./api";

const url = 'http://localhost:3000/api'

const username = document.getElementById('name')
const useremail = document.getElementById('email')
const usersubject = document.getElementById('subject')
const usermessage = document.getElementById('message')
const contactForm = document.getElementById('contactForm')
const submitButton = document.getElementById('submitBtn')

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        fullName: username.value.trim(),
        email: useremail.value.trim(),
        subject: usersubject.value.trim(),
        message: usermessage.value.trim()
    }

    try {
        await api(`${url}/contact`, {
            method: 'POST',
            body: JSON.stringify(payload)
        })

    } catch (error) {
        alert(error.message)
    }
})