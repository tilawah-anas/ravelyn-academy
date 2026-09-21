const url = "https://sms.tunnelto.me/api";

const api = async function getData(endpoint) {
  try {
    const response = await fetch(`${url}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
}

// const  =  async function feedbackForm() {
  
// }