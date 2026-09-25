const url = "https://sms.tunnelto.me/api"
// const url = 'http://localhost:3000/api'

const api = async function(endpoint, options ={}) {
  try {
    const headers = {
      "Content-Type": "application/json", ...(options.headers || {})
    }
    const response = await fetch(`${url}${endpoint}`, {...options, headers});
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    // console.log(result);
    return result
  } catch (error) {
    console.error(error.message);
  }
}

export default api