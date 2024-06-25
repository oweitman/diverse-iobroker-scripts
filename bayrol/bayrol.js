// jshint esversion: 8
const fetch = require('node-fetch');

//config start
let user="xxx";
let password="xxx";
let dpPH = "0_userdata.0.bayrol.ph";
let dpMV = "0_userdata.0.bayrol.mv";
let dpCC = "0_userdata.0.bayrol.cc";
let requesttime=10*1000; //erneuterdatenabruf in Millisekunden

const useragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
//config end

async function main() {
    let sessionid = await getSession();
    let cid= await login(user,password,sessionid);
    if (cid) await getData(sessionid,cid);
}
async function  getSession() {
    const response = await fetch("https://www.bayrol-poolaccess.de/webview/index.php", {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "pragma": "no-cache",
          "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          "User-Agent":useragent
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET"
      });
      let headers = await response.headers;
      return getSessionId(headers.get("set-cookie"));
}
async function login(user,password,sessionid) {
  let body=`username=${encodeURIComponent(user)}&password=${encodeURIComponent(password)}&login=Anmelden`;
  const response = await fetch("https://www.bayrol-poolaccess.de/webview/p/login.php?r=reg", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": `PHPSESSID=${sessionid}`,
      "Referer": "https://www.bayrol-poolaccess.de/webview/p/login.php",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "User-Agent":useragent
    },
    "body": body,
    "method": "POST"
  });  
  let text=await response.text();
  return getCID(text);
}
async function getData(sessionid,cid) {
  const response = await fetch(`https://www.bayrol-poolaccess.de/webview/getdata.php?cid=${cid}`, {
    "headers": {
      "accept": "*/*",
      "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "cookie": `PHPSESSID=${sessionid}`,
      "Referer": "https://www.bayrol-poolaccess.de/webview/p/plants.php",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "User-Agent":useragent
    },
    "body": null,
    "method": "GET"
  });
  let text=await response.text();
  writeData(extractValues(text));
  setTimeout(getData.bind(this),requesttime,sessionid,cid);
}
function writeData(obj) {
	try {
		setState(dpCC,parseFloat(obj.CC));
		setState(dpMV,parseFloat(obj.MV));
		setState(dpPH,parseFloat(obj.PH));
	} catch (error) {
		log(error);
	}    
}
function extractValues(text){
  const regexPH = /\[pH\]<\/span><h1>([\d\.]+)<\/h1>/gm;
  const regexMV = /\[mV\]<\/span><h1>([\d\.]+)<\/h1>/gm;
  const regexCC = /\[°C\]<\/span><h1>([\d\.]+)<\/h1>/gm;
  let data={
    PH:regexPH.exec(text)[1],
    MV:regexMV.exec(text)[1],
    CC:regexCC.exec(text)[1],
  };
  log(data);
  return data;
}
async function getCID(text){
    const regex = /var clients = \[(\d+)\];/gm;
    let result = regex.exec(text);
    if (result.length==2) return result[1];
    return undefined;
}
function getSessionId(setcookie){
    let cookieHeader = setcookie;
    if (cookieHeader.length>0) {
        let cookieArray = cookieHeader.split(";")
        const cookieObject = {};
        cookieArray.forEach(cookie => {
          const [name, value] = cookie.split('=');
          cookieObject[(name||"empty").trim()] = (value||"").trim();
        });
        return cookieObject["PHPSESSID"]||"";
    }
}
main();