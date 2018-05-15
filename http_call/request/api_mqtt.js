const request = require("request");

let CLOUDMQTT_USER = "scqovzmw:"; //agregar al final del usuario dos puntos (:). al valor final es (user:pass)
let CLOUDMQTT_PASSWORD = "e22pZ5L70UWm";

let autentication = Buffer.from(`${CLOUDMQTT_USER}`).toString("base64");
let autentication2 = Buffer.from(`${CLOUDMQTT_PASSWORD}`).toString("base64");
let username = "";
let userdelete = "dfcbd";

//get
const options = {
  method: "GET",
  url: `https://api.cloudmqtt.com/api/user/${username}`,
  headers: {
    "cache-control": "no-cache",
    authorization: `Basic ${autentication}${autentication2}`
  }
};

request(options, (error, response, body) => {
  if (error) throw new Error(error);
  console.log(`PROBANDO GET --> ${body}`);
});
/*
//post
const options2 = {
  method: "POST",
  url: "https://api.cloudmqtt.com/api/user",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    //  "postman-token": "ca265c32-55ce-061d-0339-776d7c022257",
    "cache-control": "no-cache",
    authorization: `Basic ${autentication}${autentication2}`
    //   authorization: "Basic c2Nxb3Z6bXc6ZTIycFo1TDcwVVdt"
  },
  form: { username: "test1", password: "123456789" }
};

request(options2, function(error, response, body) {
  if (error) throw new Error(error);

  console.log(`PROBANDO POST --> ${body}`);
});

//delete
const options3 = {
  method: "DELETE",
  url: `https://api.cloudmqtt.com/api/user/${userdelete}`,
  headers: {
    "cache-control": "no-cache",
    authorization: `Basic ${autentication}${autentication2}`
  }
};

request(options3, (error, response, body) => {
  if (error) throw new Error(error);

  console.log(`PROBANDO DELETE --> ${body}`);
});
*/
