var request = require('request')
var xml2js = require('xml2js');
var parseString = new xml2js.Parser().parseString;
//hostclient
var client = function(config) {
	this.username = config.username;
	this.password = config.password;
	this.url = config.url;
}

//serviceclient
var clientOther = function(config) {
	this.username = config.username;
	this.password = config.password;
	this.url = config.url;
}
clientOther.prototype.createSession = function(meetId) {
	return new Promise((resolve,reject) => {
		var xml = `<?xml version="1.0" encoding="UTF-8"?>
		<soapenv:Envelope>
		xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
		xmlns:xsd="http://www.w3.org/2001/XMLSchema"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<soapenv:Body>
		<ns1:createSession soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
		<domain xsi:type="xsd:string">${this.url}</domain>
		<admUser xsi:type="xsd:string">${this.username}</admUser>
		<admPass xsi:type="xsd:string">${this.password}</admPass>
		<meetingID xsi:type="xsd:int">${meetId}</meetingID>
		</ns1:createSession>
		</soapenv:Body>
		</soapenv:Envelope>`;
		request.post(
		{
			url: `https://${this.url}/api/1.1/service.php`,
			body: xml,
			headers: { 'Content-Type': 'text/xml' }
		},
		(error, response, body) => {
			console.log(error,body)
			if (!error && response.statusCode == 200) {
				parseString(body,(err, result) => {
					if (!err) {
						return resolve({url: result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0]['createSessionResponse'][0]['return'][0]['_']})
					} else {
						return reject(err)
					}
				});
			} else {
				return reject({deleted:false,reason:error});
			}
		});
	})

}
//entry call for createmeeting that will call gettoken and then pass token to actual createmeeting call
client.prototype.createMeeting = function(propObj) { 
	return this.getToken()
	.then(token => this._createMeeting(propObj,token))
}
//create meeting takes a propsobj and token. converts the propobj to xml and creates the meeting
client.prototype._createMeeting = function(propObj,token) {
	return new Promise((resolve,reject) => {
		var propsList =`` 
		for(var key in propObj) {
			propsList += `
			<item xsi:type="tns:propValPair">
			<property xsi:type="xsd:string">${typeMapper(key).name}</property>
			<value xsi:type="xsd:${typeMapper(key).type}">${propObj[key]}</value>
			</item>`
		}

		var xml = `<?xml version="1.0" encoding="UTF-8"?>
		<soapenv:Envelope>
		xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
		xmlns:xsd="http://www.w3.org/2001/XMLSchema"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<soapenv:Body>
		<ns1:createMeeting soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
		<token xsi:type="xsd:string">${token}</token> 
		<properties xsi:type="api:propValPairArray" soapenc:arrayType="api:propValPair[]">
		${propsList}
		</properties>
		</ns1:createMeeting>
		</soapenv:Body>
		</soapenv:Envelope>`
		request.post(
		{
			url: `https://${this.url}/api/1.1/host.php`,
			body: xml,
			headers: { 'Content-Type': 'text/xml' }
		},
		(error, response, body) => {
			if (!error && response.statusCode == 200) {
				parseString(body,(err, result) => {
					if (!err) {
						if(result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0]['createMeetingResponse'][0]['return'][0]['result'][0]['_'] != '0') {
							return resolve({created:true,meetId:result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0]['createMeetingResponse'][0]['return'][0]['result'][0]['_']})
						} else {
							return reject({created:false,err:'meeting for name already exists'})
						}
					} else {
					return reject({created:false,reason:'parse xml failed'});
					}
				});
			} else {
				return reject({created:false,reason:body});
			}
		});
})
}
//takes recid and deletes a video
clientOther.prototype.deleteVideo = function(recId) {
	return new Promise((resolve,reject) => {
		var xml = `<?xml version="1.0" encoding="UTF-8"?>
		<soapenv:Envelope>
		xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
		xmlns:xsd="http://www.w3.org/2001/XMLSchema"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<soapenv:Body>
		<ns1:deleteRecording soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
		<domain xsi:type="xsd:string">${this.url}</domain>
		<admUser xsi:type="xsd:string">${this.username}</admUser>
		<admPass xsi:type="xsd:string">${this.password}</admPass>
		<recID xsi:type="xsd:int">
		${recId}
		</recID>
		</ns1:deleteRecording>
		</soapenv:Body>
		</soapenv:Envelope>`;
		request.post(
		{
			url: `https://${this.url}/api/1.1/service.php`,
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

//no params gets token based on stuff set in constructor
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
			url: `https://${this.url}/api/1.1/host.php`,
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
//entry to list meeting call that calls getToken and then passes token to list meeting
client.prototype.listMeetings = function() {
	return this.getToken()
	.then(token => this._listMeetings(token))
}

//list meeting takes token and returns json of xml for all meetings
client.prototype._listMeetings = function(token) {
	return new Promise((resolve,reject) => {
		var xml = `<?xml version="1.0" encoding="UTF-8"?>
		<soapenv:Envelope>
		xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
		xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"> 
		<soapenv:Body> 
		<ns1:getRecordingList soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" 
		xmlns:ns1="#getURL()#"> 
		<token xsi:type="xsd:string">${token}</token> 
		</ns1:getRecordingList> 
		</soapenv:Body> 
		</soapenv:Envelope>`;
		request.post(
		{
			url: `https://${this.url}/api/1.1/host.php`,
			body: xml,
			headers: { 'Content-Type': 'text/xml' }
		},
		(error, response, body) => {
			if (!error && response.statusCode == 200) {
				parseString(body,(err, result) => {
					if (!err) {
						var newObj = result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0]
						resolve(newObj[Object.keys(newObj)[0]][0]['return'][0]['result'][0]['item'].map(x => {
							return {
								meetName:x.Meet_Name[0]['_'],
								meetId:x.Meet_ID[0]['_'],
								recId:x.Rec_ID[0]['_'],
								recCreateDateTime:x.Rec_CreateDateTime[0]['_'],
								domain:x.Domain[0]['_'],
								file:x.File[0]['_'],
								signature:x.Signature[0]['_'],
								size:x.Size[0]['_'],
								downloadUrl:x.DownloadUrl[0]['_'],
								playbackUrl:x.PlaybackUrl[0]['_']
							}
						}))
					} else {
						return reject(err)
					}
				});
			} else {
				return reject({created:false,reason:body});
			}
		});

	})
}
//this is used to map the str in json object to something that can be used in xml
var typeMapper = function(key) {
	switch (key) {
		case 'name': return {type:'string',name:'Meet_Name'}
		case 'maxVideos': return {type:'numeric',name:'Meet_MaxVideos'}
		case 'maxAudio': return {type:'numeric',name:'Meet_MaxAudio'}
		case 'expectedAttendees': return {type:'numeric',name:'Meet_ExpectedAttendees'}
		case 'defaultUserPerms': return {type:'string',name:'Meet_DefaultUserPerms'}
		case 'defaultMicStatus': return {type:'boolean',name:'Meet_DefaultMicStatus'}
		case 'defaultDockedVideo': return {type:'boolean',name:'Meet_DefaultDockedVideo'}
		case 'enableMicToggle': return {type:'boolean',name:'Meet_EnableMicToggle'}
		case 'defaultVidLayout': return {type:'string',name:'Meet_DefaultVidLayout'}
		case 'enableLanguageList': return {type:'boolean',name:'Meet_EnableLanguageList'}
		case 'enableOptionsMenu': return {type:'boolean',name:'Meet_EnableOptionsMenu'}
		case 'enableShortcuts': return {type:'boolean',name:'Meet_EnableShortcuts'}
		case 'enableExitButton': return {type:'boolean',name:'Meet_EnableExitButton'}
		case 'showMeetWelcome': return {type:'boolean',name:'Meet_ShowMeetWelcome'}
		case 'maxConnectTime': return {type:'numeric',name:'Meet_MaxConnectTime'}
		case 'scheduledDateTime': return {type:'date',name:'Meet_ScheduledDateTime'}
		case 'scheduleTimeZone': return {type:'string',name:'Meet_ScheduledTimeZone'}
		case 'expireDateTime': return {type:'string',name:'Meet_ExpireDateTime'}
		case 'password': return {type:'string',name:'Meet_Password'}
		case 'enableAutoAccept': return {type:'boolean',name:'Meet_EnableAutoAccept'}
		case 'noiseCancelCtrl': return {type:'boolean',name:'Meet_NoiseCancelCtrl'}
		case 'restrictAudioToHost': return {type:'boolean',name:'Meet_RestrictAudioToHost'}
		case 'restrictVideoToHost': return {type:'boolean',name:'Meet_RestrictVideoToHost'}
		case 'videoProfile': return {type:'numeric',name:'Meet_VideoProfile'}
		case 'callinNumber': return {type:'string',name:'Meet_CallInNumber'}
		case 'moderatorCode': return {type:'string',name:'Meet_ModeratorCode'}
		case 'attendeeCode': return {type:'string',name:'Meet_AttendeeCode'}
		case 'ToolConferenceMode': return {type:'string',name:'Meet_TollConferenceMode'}
		case 'enableMeetingList': return {type:'boolean',name:'Meet_EnableMeetingList'}
		case 'enablePersistChat': return {type:'boolean',name:'Meet_EnablePersistChat'}
		case 'enablePrivateChat': return {type:'boolean',name:'Meet_EnablePrivateChat'}
		case 'enableChat': return {type:'boolean',name:'Meet_EnableChat'}
		case 'msDefaultPort': return {type:'numeric',name:'Meet_MSDefaultPort'}
		case 'msDeafultProtocol': return {type:'string',name:'Meet_MSDefaultProtocol'}
		case 'msDomain': return {type:'numeric',name:'Meet_MSDomain'}
		case 'msApplication': return {type:'numeric',name:'Meet_MSApplication'}
		case 'msEdgeServers': return {type:'string',name:'Meet_MSEdgeServers'}
		case 'streaming': return {type:'numeric',name:'Meet_Streaming'}
		case 'enableUserList': return {type:'boolean',name:'Meet_EnableUserList'}
		case 'hostUserName': return {type:'string',name:'Meet_HostUserName'}
		case 'inviteComments': return {type:'string',name:'Meet_InviteComments'}
		case 'requireRegistration': return {type:'boolean',name:'Meet_RequireRegistration'}
		case 'requireRegPayment': return {type:'boolean',name:'Meet_RequireRegPayment'}
		case 'maxRegistrants': return {type:'numeric',name:'Meet_MaxRegistrants'}
		case 'TzOffset': return {type:'numeric',name:'TzOffset'}
		case 'autoRecord': return {type:'boolean',name:'autoRecord'}
		case 'alertSound': return {type:'boolean',name:'alertSound'}
		case 'chatSound': return {type:'boolean',name:'chatSound'}
	}
}
var test = new clientOther({
	url:'meeting.onlineproctornow.com',
	username:'SmarterProctoring',
	password:'Virtual1'
})
test.createSession("786603")
	.then(console.log)
	.catch(console.log)

// test.listMeetings().then(console.log).catch(console.log)
// test.createMeeting({
// 	name:"9ss9c2c5b87e9f11e7bb3a1bbbe2e44b06b34",
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
// .then(console.log)
// .catch(console.log)

module.exports = {hostClient:client,serviceClient:clientOther};



