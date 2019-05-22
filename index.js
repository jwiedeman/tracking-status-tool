/**
* This tool is meant to serve as a simple proof-of-concept and
* has not been built for expansion/actual real-world use.
*
* 
* Google Ads:
*  - Unique String for URL filtering:  'googleads.g.doubleclick.net'
*  - Conversion ID Expression:         parsedUrl.pathname.split('/')[3];
* Google Analytics:
*  - Unique String for URL filtering:  'google-analytics.com'
*  - UA Number Expression:             parsedUrl.query.tid;
*  - HitType Expression:               parsedUrl.query.t;
* Facebook Pixel:
*  - Unique String for URL filtering:  'facebook.com/tr/'
*  - Pixel ID Expression:              parsedUrl.query.id;
*  - Event Type Expression:            parsedUrl.query.ev;
* Bing Ads:
*  - Unique String for URL filtering:  'bat.bing.com/action'
*  - UET ID Expression:                parsedUrl.query.ti;
*  - UET HitType Expression:           parsedUrl.query.evt;

${site} -


	
*/
var fs = require("fs");
const puppeteer = require('puppeteer');
const URL = require('url');
const GOOGLEANALYTICS = 'Google Analytics';
const FACEBOOK = 'Facebook Ads';
const BING = 'Bing Ads' 
const GOOGLEADS = 'Google Ads';
let reportJson = {};
let promiseArr = [];

// intake from sitemap
const exampleSites = [
	'http://localhost'
];





const sites = (process.argv.length > 2)
	? process.argv.slice(2)
	: exampleSites;


const checkPage = async site => {
	console.log('Testing  ', site);
	const trackingInformation = {
		'Google Analytics': {},
		'Facebook Ads': {},
		'Bing Ads': {},
		'Google Ads': []
	};
	
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	
	page.on('request', request => { // on request
		const url = request._url; // catch all requests 
		

		// google analytics
		if (url.indexOf('google-analytics.com') > -1) { // if analytics detected
			const parsedUrl = URL.parse(url, true); // if the url == the url.indexof true

	
			if (typeof parsedUrl.query.tid != 'undefined' && typeof parsedUrl.query.t != 'undefined') {
				console.log(`## GOOGLE ANALYTICS: ${parsedUrl.query.tid} - ${parsedUrl.query.t.toUpperCase()}`);
				storeData(GOOGLEANALYTICS, { id: parsedUrl.query.tid, hitType: parsedUrl.query.t ,payload:parsedUrl});
			}



		// facebook pixel 
		} else if (url.indexOf('facebook.com/tr/') > -1) {
			const parsedUrl = URL.parse(url, true);
			

			if (typeof parsedUrl.query.id != 'undefined' && typeof parsedUrl.query.id != 'undefined') {
				console.log(`## FACEBOOK PIXEL: ${parsedUrl.query.id} - ${parsedUrl.query.ev.toUpperCase()}`);
				storeData(FACEBOOK, { id: parsedUrl.query.id, hitType: parsedUrl.query.ev ,payload:parsedUrl});
			}


		// google ads
		} else if (url.indexOf('googleads.g.doubleclick.net') > -1) {
			const parsedUrl = URL.parse(url, true);
			

			if (parsedUrl.pathname.split('/').length > 4 && parsedUrl.pathname.split('/')[3].length === 9) {
				const conversionId = parsedUrl.pathname.split('/')[3];
				console.log(`## GOOGLE ADS REMARKETING: ${conversionId}`);
				storeData(GOOGLEADS, { id: conversionId ,hitType: parsedUrl.query.evt,payload:parsedUrl});
			}

		// microsoft ads
		} else if (url.indexOf('bat.bing.com/action') > -1) {
			const parsedUrl = URL.parse(url, true);
			

			if (parsedUrl.protocol == 'https:' &&typeof parsedUrl.query.ti != 'undefined' && typeof parsedUrl.query.evt != 'undefined') {
				console.log(`## BING UET: ${parsedUrl.query.ti} - ${parsedUrl.query.evt}`);
				storeData(BING, { id: parsedUrl.query.ti, hitType: parsedUrl.query.evt,payload:parsedUrl });
			}
		}
	});
	
	

	
	await page.goto(site); // get the site
	await browser.close(); 
	
	reportJson[site] = trackingInformation; //assign reportjson for this crawl instance to the info setup on function load
	//i.e reportJson.site now contains the empty platforms from tracking information, which will be filled as the page is crawled




	//EX: storeData(BING, { id: parsedUrl.query.ti, hitType: parsedUrl.query.evt });
	function storeData(platform, dataObj) { //intake as params
		let { id, hitType ,payload} = dataObj; // set structure for incoming 2 param object, now acessible as normal id, hittype

		let info = trackingInformation[platform];

	

		if (typeof id != 'undefined' && typeof hitType != 'undefined') { // if ID and hittype are not undefined

			

			info[id] = (typeof info[id] != 'undefined') // if ID = true
				? info[id] //assign info ID 
				: {};
			
			info[id][hitType] = (typeof info[id][hitType] != 'undefined') // if ID and hittype are true
				? info[id][hitType] + 1 
				: 1; 

			info[payload] = (typeof payload != 'undefined') // if ID = true
				? payload //assign info ID 
				: {};

		} else if (typeof id != 'undefined') { // fail out and assign to default value
			if (!info.includes(id)) {
				info.push(id);
			}
		}
	}
};




/*

//Debug pane
// feed vars for the table
// pretty self explanatory, feed instance stuff, itll make a table. Expand as pylons counts allow
var tick =0;
// an object whose properties are strings
function instance(target,googleAnalytics,googleAds,facebook,microsoft) {
  this.tick = tick;
  this.target = target;
  this.googleAnalytics = googleAnalytics;
  this.googleAds = googleAds; 
  this.facebook = facebook;
  this.microsoft = microsoft;
}

setInterval(function(){ 
tick+=1
console.clear()
console.table(new instance('target','googleAnalytics','googleAds','facebook','microsoft'));
}, 200);
*/




// go through arr of sites and run checksites against each
sites.forEach(site => {
	reportJson[site] = {}; // make anon instance of object for parent site

	promiseArr.push(checkPage(site)); // get site 
});

Promise.all(promiseArr).then(() => {
	console.log('All done! Results:');
	//console.dir(reportJson, { depth: null }); // log report
	fs.writeFile("./json.json", JSON.stringify(reportJson), (err) => {
		if (err) {
			console.error(err);
			return;
		};
		console.log("File has been created");
	});

});


/* Google Analytics Request obj

    "protocol": "https:",
    "slashes": true,
    "auth": null,
    "host": "www.google-analytics.com",
    "port": null,
    "hostname": "www.google-analytics.com",
    "hash": null,
    "search": "?v=1&_v=j75&a=1799258067&t=event&_s=2&dl=http%3A%2F%2Flocalhost%2F&ul=en-us&de=UTF-8&dt=Get%20Out%20Of%20Here%2C%20Stalker!&sd=24-bit&sr=800x600&vp=800x600&je=0&ec=contact&ea=submit&el=form&_u=IEBAAEAB~&jid=&gjid=&cid=278790741.1558555493&tid=UA-0000001-1&_gid=309095230.1558555493&z=1306995020",
    "query": {
        "v": "1",
        "_v": "j75",
        "a": "1799258067",
        "t": "event",
        "_s": "2",
        "dl": "http://localhost/",
        "ul": "en-us",
        "de": "UTF-8",
        "dt": "Get Out Of Here, Stalker!",
        "sd": "24-bit",
        "sr": "800x600",
        "vp": "800x600",
        "je": "0",
        "ec": "contact",
        "ea": "submit",
        "el": "form",
        "_u": "IEBAAEAB~",
        "jid": "",
        "gjid": "",
        "cid": "278790741.1558555493",
        "tid": "UA-0000001-1",
        "_gid": "309095230.1558555493",
        "z": "1306995020"
    },
    "pathname": "/collect",
    "path": "/collect?v=1&_v=j75&a=1799258067&t=event&_s=2&dl=http%3A%2F%2Flocalhost%2F&ul=en-us&de=UTF-8&dt=Get%20Out%20Of%20Here%2C%20Stalker!&sd=24-bit&sr=800x600&vp=800x600&je=0&ec=contact&ea=submit&el=form&_u=IEBAAEAB~&jid=&gjid=&cid=278790741.1558555493&tid=UA-0000001-1&_gid=309095230.1558555493&z=1306995020",
    "href": "https://www.google-analytics.com/collect?v=1&_v=j75&a=1799258067&t=event&_s=2&dl=http%3A%2F%2Flocalhost%2F&ul=en-us&de=UTF-8&dt=Get%20Out%20Of%20Here%2C%20Stalker!&sd=24-bit&sr=800x600&vp=800x600&je=0&ec=contact&ea=submit&el=form&_u=IEBAAEAB~&jid=&gjid=&cid=278790741.1558555493&tid=UA-0000001-1&_gid=309095230.1558555493&z=1306995020"


*/