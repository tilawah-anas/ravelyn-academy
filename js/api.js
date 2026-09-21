const url = "https://sms.tunnelto.me/api";

const api = async function(endpoint, options ={}) {
  try {
    const response = await fetch(`${url}${endpoint}`, {...options});
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
// const  =  async function feedbackForm() {
  
// }