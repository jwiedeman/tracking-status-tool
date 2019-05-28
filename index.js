/**
* I like to think of this project as an alcoholic node process that crawls each page with maximum sobriety 
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
*/

// #justnodethings
var fs = require("fs");
const puppeteer = require('puppeteer');
var sitemaps = require('sitemap-stream-parser'); 
const URL = require('url');
process.setMaxListeners(Infinity); // y e e t

let tick =0
const GOOGLEANALYTICS = 'Google Analytics';
const FACEBOOK = 'Facebook Ads';
const BING = 'Bing Ads' 
const GOOGLEADS = 'Google Ads';
let reportJson = {};
let promiseArr = [];
let targetSite ='http://whostracking.me/sitemap.xml' // Parent target, this will be the base URL to work off of
let currentTarget =''; //current url being tried
const exampleSites = [];
var urls = ['http://whostracking.me/sitemap.xml'];




const checkPage = async site => {
    currentTarget = site // kinda backwards way of making site acessible 
	const trackingInformation = {
		'Google Analytics': {},
		'Facebook Ads': {},
		'Bing Ads': {},
		'Google Ads': {} /
	};
	
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	
	page.on('request', request => { // on request
		const url = request._url; // catch all requests 
		

		// google analytics
		if (url.indexOf('google-analytics.com') > -1) { // if analytics detected
			const parsedUrl = URL.parse(url, true); // if the url == the url.indexof true
			if (typeof parsedUrl.query.tid != 'undefined' && typeof parsedUrl.query.t != 'undefined') {
				//console.log(`## GOOGLE ANALYTICS: ${site} - ${parsedUrl.query.t.toUpperCase()}`);
				storeData(GOOGLEANALYTICS, { id: parsedUrl.query.tid, hitType: parsedUrl.query.t ,payload:parsedUrl});
			}

		// facebook pixel 
		} else if (url.indexOf('facebook.com/tr/') > -1) {
			const parsedUrl = URL.parse(url, true);
			if (typeof parsedUrl.query.id != 'undefined' && typeof parsedUrl.query.id != 'undefined') {
				//console.log(`## FACEBOOK PIXEL: ${site} - ${parsedUrl.query.ev.toUpperCase()}`);
				storeData(FACEBOOK, { id: parsedUrl.query.id, hitType: parsedUrl.query.ev ,payload:parsedUrl});
			}

		// google ads
		} else if (url.indexOf('googleads.g.doubleclick.net') > -1) {
            let parsedUrl = URL.parse(url, true);
            let conversionId = parsedUrl.pathname.split('/')[3];
            // Check if the URL contained query string values for the conversion ID
            //console.dir(`## GOOGLE ADS : ${site} - ${conversionId}`);
            storeData(GOOGLEADS, { id: conversionId ,payload:parsedUrl});

        // microsoft ads
          } else if (url.indexOf('bat.bing.com/action') > -1) {
			const parsedUrl = URL.parse(url, true);
			if (parsedUrl.protocol == 'https:' &&typeof parsedUrl.query.ti != 'undefined' && typeof parsedUrl.query.evt != 'undefined') {
				//console.dir(`## BING UET: ${site} - ${parsedUrl.query.evt}`);
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
				? id //assign info ID 
				: {};
				
			info[id][hitType] = (typeof info[id][hitType] != 'undefined') // if ID and hittype are true
				? info[id][hitType] + 1 
                : 1; 
           
			info[id]['payload'] = (typeof payload != 'undefined') // if ID = true
				? payload //assign info ID 
				: {};
		} 
	}
};




// generate the sitemap
sitemaps.parseSitemaps(urls, function(url) { exampleSites.push(url); }, function(err, sitemaps) {
    exampleSites.forEach(element => {
        console.log('# Sitemap Crawler found - ',element)
    });
    onSitemapComplete() // calling the crawl after this to be sure the sitemap is generated before we c r a w l 
});

// go through arr of sites and run checksites against each
function onSitemapComplete(){
    exampleSites.forEach(site => {

		reportJson[site] = {}; // make anon instance of object for parent site
		console.log('Testing  ', currentTarget);
		promiseArr.push(checkPage(site)); // get site && push to arr
		
	});
	Promise.all(promiseArr).then(() => {
		console.log('All done! Results:');
		found()
		fs.writeFile("./json.json", JSON.stringify(reportJson), (err) => {
			console.log("File has been created");
		});
	});

}
    


function found(){
	exampleSites.forEach(site => {
console.log('#### Results for ',site )
		//console.log('# Google Ads',reportJson[site]['Google Ads'])
		//console.log('# Google Analytics',reportJson[site]['Google Analytics'])
		//console.log('# Facebook',reportJson[site]['Facebook'])
		//console.log('# Bing',reportJson[site]['Bing'])
		
	});
}




/**
 *   "https://whostracking.me/": {
        "Google Analytics": {
            "UA-116843097-1": {
                "pageview": 1,
                "payload": {
                    "protocol": "https:",
                    "slashes": true,
                    "auth": null,
                    "host": "www.google-analytics.com",
                    "port": null,
                    "hostname": "www.google-analytics.com",
                    "hash": null,
                    "search": "?v=1&_v=j75&a=322479791&t=pageview&_s=1&dl=https%3A%2F%2Fwhostracking.me%2F&ul=en-us&de=UTF-8&dt=Whos%20Tracking%20me%3F%20%7C%20whostrackingme&sd=24-bit&sr=800x600&vp=800x600&je=0&_u=IAhAAUAB~&jid=532312629&gjid=1763592671&cid=424356549.1559071000&tid=UA-116843097-1&_gid=211327578.1559071001&_r=1&gtm=2ou5f2&z=2120798624",
                    "query": {
                        "v": "1",
                        "_v": "j75",
                        "a": "322479791",
                        "t": "pageview",
                        "_s": "1",
                        "dl": "https://whostracking.me/",
                        "ul": "en-us",
                        "de": "UTF-8",
                        "dt": "Whos Tracking me? | whostrackingme",
                        "sd": "24-bit",
                        "sr": "800x600",
                        "vp": "800x600",
                        "je": "0",
                        "_u": "IAhAAUAB~",
                        "jid": "532312629",
                        "gjid": "1763592671",
                        "cid": "424356549.1559071000",
                        "tid": "UA-116843097-1",
                        "_gid": "211327578.1559071001",
                        "_r": "1",
                        "gtm": "2ou5f2",
                        "z": "2120798624"
                    },
                    "pathname": "/r/collect",
                    "path": "/r/collect?v=1&_v=j75&a=322479791&t=pageview&_s=1&dl=https%3A%2F%2Fwhostracking.me%2F&ul=en-us&de=UTF-8&dt=Whos%20Tracking%20me%3F%20%7C%20whostrackingme&sd=24-bit&sr=800x600&vp=800x600&je=0&_u=IAhAAUAB~&jid=532312629&gjid=1763592671&cid=424356549.1559071000&tid=UA-116843097-1&_gid=211327578.1559071001&_r=1&gtm=2ou5f2&z=2120798624",
                    "href": "https://www.google-analytics.com/r/collect?v=1&_v=j75&a=322479791&t=pageview&_s=1&dl=https%3A%2F%2Fwhostracking.me%2F&ul=en-us&de=UTF-8&dt=Whos%20Tracking%20me%3F%20%7C%20whostrackingme&sd=24-bit&sr=800x600&vp=800x600&je=0&_u=IAhAAUAB~&jid=532312629&gjid=1763592671&cid=424356549.1559071000&tid=UA-116843097-1&_gid=211327578.1559071001&_r=1&gtm=2ou5f2&z=2120798624"
                }
            }
        },
        "Facebook Ads": {
            "1968766133437314": {
                "PageView": 1,
                "payload": {
                    "protocol": "https:",
                    "slashes": true,
                    "auth": null,
                    "host": "www.facebook.com",
                    "port": null,
                    "hostname": "www.facebook.com",
                    "hash": null,
                    "search": "?id=1968766133437314&ev=GeneralEvent&dl=https%3A%2F%2Fwhostracking.me%2F&rl=&if=false&ts=1559071007320&cd[post_type]=page&cd[post_id]=15&cd[content_name]=Whos%20Tracking%20me%3F&cd[domain]=whostracking.me&cd[user_roles]=guest&cd[plugin]=PixelYourSite&sw=800&sh=600&v=2.8.47&r=stable&a=dvpixelyoursite&ec=1&o=158&fbp=fb.1.1559071007285.910557468&it=1559071006211&coo=false&rqm=GET",
                    "query": {
                        "id": "1968766133437314",
                        "ev": "GeneralEvent",
                        "dl": "https://whostracking.me/",
                        "rl": "",
                        "if": "false",
                        "ts": "1559071007320",
                        "cd[post_type]": "page",
                        "cd[post_id]": "15",
                        "cd[content_name]": "Whos Tracking me?",
                        "cd[domain]": "whostracking.me",
                        "cd[user_roles]": "guest",
                        "cd[plugin]": "PixelYourSite",
                        "sw": "800",
                        "sh": "600",
                        "v": "2.8.47",
                        "r": "stable",
                        "a": "dvpixelyoursite",
                        "ec": "1",
                        "o": "158",
                        "fbp": "fb.1.1559071007285.910557468",
                        "it": "1559071006211",
                        "coo": "false",
                        "rqm": "GET"
                    },
                    "pathname": "/tr/",
                    "path": "/tr/?id=1968766133437314&ev=GeneralEvent&dl=https%3A%2F%2Fwhostracking.me%2F&rl=&if=false&ts=1559071007320&cd[post_type]=page&cd[post_id]=15&cd[content_name]=Whos%20Tracking%20me%3F&cd[domain]=whostracking.me&cd[user_roles]=guest&cd[plugin]=PixelYourSite&sw=800&sh=600&v=2.8.47&r=stable&a=dvpixelyoursite&ec=1&o=158&fbp=fb.1.1559071007285.910557468&it=1559071006211&coo=false&rqm=GET",
                    "href": "https://www.facebook.com/tr/?id=1968766133437314&ev=GeneralEvent&dl=https%3A%2F%2Fwhostracking.me%2F&rl=&if=false&ts=1559071007320&cd[post_type]=page&cd[post_id]=15&cd[content_name]=Whos%20Tracking%20me%3F&cd[domain]=whostracking.me&cd[user_roles]=guest&cd[plugin]=PixelYourSite&sw=800&sh=600&v=2.8.47&r=stable&a=dvpixelyoursite&ec=1&o=158&fbp=fb.1.1559071007285.910557468&it=1559071006211&coo=false&rqm=GET"
                },
                "GeneralEvent": 1
            }
        },
        "Bing Ads": {},
        "Google Ads": ["r20190522"]
    },
 */