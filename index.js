var request = require('request')
var xml2js = require('xml2js');
var parseString = new xml2js.Parser().parseString;
var client = function(config) {
	this.username = config.username;
	this.password = config.password;
	this.url = config.url;
}

client.prototype.createMeeting = function(propObj) { 
	return this.getToken()
	.then(token => this._createMeeting(propObj,token))
}

client.prototype._createMeeting = function(propObj,token) {
	return new Promise((resolve,reject) => {
		var propsList =`` 
		for(var key in propObj) {
			propsList += `
			<item xsi:type="tns:propValPair">
			<property xsi:type="xsd:string">${key}</property>
			<value xsi:type="xsd:${typeMapper(key)}">${propObj[key]}</value>
			</item>`
		}

		var xml = `<?xml version="1.0" encoding="UTF-8"?>
		<soapenv:Envelope>
		xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
		xmlns:xsd="http://www.w3.org/2001/XMLSchema"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<soapenv:Body>
		<ns1:createMeeting soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
		<token xsi:type="xsd:string">
		${token}
		</token> 
		<properties xsi:type="api:propValPairArray" soapenc:arrayType="api:propValPair[]">
		${propsList}
		</properties>
		</ns1:createMeeting>
		</soapenv:Body>
		</soapenv:Envelope>`
		request.post(
		{
			url: `https://${this.url}/api/1.1/service.php`,
			body: xml,
			headers: { 'Content-Type': 'text/xml' }
		},
		(error, response, body) => {
			if (!error && response.statusCode == 200) {
				return resolve({created:true});
			} else {
				console.log(body)
				return reject({created:false,reason:body});
			}
		});

})
}

client.prototype.deleteVideo = function(recId) {
	return new Promise((resolve,reject) => {
		var xml = `<?xml version="1.0" encoding="UTF-8"?>
		<soapenv:Envelope>
		xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
		xmlns:xsd="http://www.w3.org/2001/XMLSchema"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<soapenv:Body>
		<ns1:deleteRecording soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
		<domain xsi:type="xsd:string">meeting.onlineproctornow.com</domain>
		<admUser xsi:type="xsd:string">Exam</admUser>
		<admPass xsi:type="xsd:string">Meetinz</admPass>
		<recID xsi:type="xsd:int">
		${recId}
		</recID>
		</ns1:deleteRecording>
		</soapenv:Body>
		</soapenv:Envelope>`;
		request.post(
		{
			url: '${this.url}/api/1.1/service.php',
			body: xml,
			headers: { 'Content-Type': 'text/xml' }
		},
		(error, response, body) => {
			if (!error && response.statusCode == 200) {
				return resolve({deleted:true});
			} else {
				return reject({deleted:false,reason:error});
			}
		});
	})
}

client.prototype.getToken = function() {
	return new Promise((resolve,reject) => {
		var logIn = `<?xml version="1.0" encoding="UTF-8"?>
		<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<soapenv:Body>
		<ns1:logIn soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:ns1="#getURL()#">
		<domain xsi:type="xsd:string">${this.url}</domain>
		<user xsi:type="xsd:string">${this.username}</user>
		<pass xsi:type="xsd:string">${this.password}</pass>
		<admin xsi:type="xsd:string">0</admin>
		</ns1:logIn>
		</soapenv:Body>
		</soapenv:Envelope>`;
		request.post(
		{
			url: 'http://m3demo.megameeting.com/api/1.1/host.php',
			body: logIn,
			headers: { 'Content-Type': 'text/xml' }
		},
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				parseString(body,(err, result) => {
					if (!err) {
						var newObject = result[Object.keys(result)[0]]
						newObject = newObject[Object.keys(newObject)[1]];
						newObject = newObject[Object.keys(newObject)[0]];
						newObject = newObject[Object.keys(newObject)[0]];
						return resolve(newObject[0].return[0].result[0]._);
					} else {
						return reject(err)
					}
				});
			} else {
				return reject(body);
			}
		})

	})

}

client.prototype.listMeetings = function() {
	return this.getToken()
	.then(_listMeetings)
}

client.prototype._listMeetings = function(token) {
	return new Promise((resolve,reject) => {
		var xml = `<?xml version="1.0" encoding="UTF-8"?>'
		<soapenv:Envelope>
		xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
		xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"> 
		<soapenv:Body> 
		<ns1:getRecordingList soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" 
		xmlns:ns1="#getURL()#"> 
		<token xsi:type="xsd:string">
		${token}
		</token> 
		</ns1:getRecordingList> 
		</soapenv:Body> 
		</soapenv:Envelope>`;

	})
}

var typeMapper = function(key) {
	switch (key) {
		case 'name': return 'string'
		case 'maxVideos': return 'numeric'
		case 'maxAudio': return 'numeric'
		case 'expectedAttendees': return 'numeric'
		case 'defaultUserPerms': return 'string'
		case 'defaultMicStatus': return 'boolean'
		case 'defaultDockedVideo': return 'boolean'
		case 'enableMicToggle': return 'boolean'
		case 'defaultVidLayout': return 'string'
		case 'enableLanguageList': return 'boolean'
		case 'enableOptionsMenu': return 'boolean'
		case 'enableShortcuts': return 'boolean'
		case 'enableExitButton': return 'boolean'
		case 'showMeetWelcome': return 'boolean'
		case 'maxConnectTime': return 'numeric'
		case 'scheduledDateTime': return 'date'
		case 'scheduleTimeZone': return 'string'
		case 'expireDateTime': return 'string'
		case 'password': return 'string'
		case 'enableAutoAccept': return 'boolean'
		case 'noiseCancelCtrl': return 'boolean'
		case 'restrictAudioToHost': return 'boolean'
		case 'restrictVideoToHost': return 'boolean'
		case 'videoProfile': return 'numeric'
		case 'callinNumber': return 'string'
		case 'moderatorCode': return 'string'
		case 'attendeeCode': return 'string'
		case 'ToolConferenceMode': return 'string'
		case 'enableMeetingList': return 'boolean'
		case 'enablePersistChat': return 'boolean'
		case 'enablePrivateChat': return 'boolean'
		case 'enableChat': return 'boolean'
		case 'msDefaultPort': return 'numeric'
		case 'msDeafultProtocol': return 'string'
		case 'msDomain': return 'numeric'
		case 'msApplication': return 'numeric'
		case 'msEdgeServers': return 'string'
		case 'streaming': return 'numeric'
		case 'enableUserList': return 'boolean'
		case 'hostUserName': return 'string'
		case 'inviteComments': return 'string'
		case 'requireRegistration': return 'boolean'
		case 'requireRegPayment': return 'boolean'
		case 'maxRegistrants': return 'numeric'
		case 'TzOffset': return 'numeric'
		case 'autoRecord': return 'boolean'
		case 'alertSound': return 'boolean'
		case 'chatSound': return 'boolean'
	}
}
// var test = new client({})

//example for create endpoint
// test.createMeeting({
// 	name:"99c2c5b87e9f11e7bb31be2e44b06b34",
// 	scheduledDateTime: new Date().toISOString(),
// 	defaultUserPerms: 'ReceiveAudio,ReceiveVideo,SMD,Chat,VidLayout',
// 	streaming: 16,
// 	enableAutoAccept: 1,
// 	expectedAttendees: 5,
// 	showMeetWelcome: 0,
// 	enableChat: 1,
// 	maxRegistrants: 5,
// 	maxVideos: 5,
// 	restrictVideoToHost: 0,
// 	autoRecord: 1,
// 	alertSound: 0,
// 	chatSound: 0
// })
// .catch(console.log)

module.exports = client;



