const json = require('./json.json')
// console.log(json['http://localhost'])

for (entry in json) {
    console.log(json[entry])
}