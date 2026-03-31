import axios from "axios";

async function testApi() {
    try {
        const id = "69b1a9c70409b2241cbbc1cf"; // User Id for huy phan
        const url = `http://localhost:5000/api/drivers/${id}/cod-pending`;
        console.log(`Testing URL: ${url}`);
        const resp = await axios.get(url);
        console.log(`Response Status: ${resp.status}`);
        console.log(`Response Data: ${JSON.stringify(resp.data, null, 2)}`);
    } catch (e: any) {
        console.log(`Error: ${e.response ? e.response.status : e.message}`);
        console.log(`Error Data: ${e.response ? JSON.stringify(e.response.data) : ""}`);
    }
}
testApi();
