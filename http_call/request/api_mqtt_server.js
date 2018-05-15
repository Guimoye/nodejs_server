const request = require("request");

let CLOUDMQTT_USER = "ad057026-41d9-4822-ad79-43080e923a0a"; //agregar al final del usuario dos puntos (:). al valor final es (user:pass)

let autentication = Buffer.from(`${CLOUDMQTT_USER}`).toString("base64");
let username = "/64799"; //agregar el slash para saber cuando es busqueda detallada
let userdelete = "dfcbd";

//get todas las instancias

const options = {
  method: "GET",
  url: `https://customer.cloudmqtt.com/api/instances${username}`,
  headers: {
    "cache-control": "no-cache",
    authorization: `Basic ${autentication}`
  }
};

request(options, function(error, response, body) {
  if (error) throw new Error(error);

  console.log(`PROBANDO GET INSTANCES --> ${body}`);
});

//post create instances

const options2 = {
  method: "POST",
  url: "https://customer.cloudmqtt.com/api/instances",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "cache-control": "no-cache",
    authorization: `Basic ${autentication}`
  },
  form: {
    name: "guimoyeeMontilla2018",
    plan: "cat",
    region: "amazon-web-services::us-east-1"
  }
};

request(options2, function(error, response, body) {
  if (error) throw new Error(error);
  console.log(`PROBANDO POST --> ${body}`);
});
