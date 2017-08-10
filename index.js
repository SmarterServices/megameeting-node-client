var request = require('request')
var xml2js = require('xml2js');
var parseString = new xml2js.Parser().parseString;
var client = function(config) {
	this.username = config.username || 'SmarterProctoring';
	this.password = config.password || 'Virtual1';
	this.url = config.url || 'meeting.onlineproctornow.com';
}

client.prototype.createMeeting = function(propObj) { 
	return this.getToken()
	.then(token => this._createMeeting(propObj,token))
}

client.prototype._createMeeting = function(propObj,token) {
	return new Promise((resolve,reject) => {
		var propsList =`` 
		for(var key in obj) {
			propsList += `
			<item xsi:type="tns:propValPair">
			<property xsi:type="xsd:string">${key}</property>
			<value xsi:type="xsd:${obj[key].type}">${obj[key].value}</value>
			</item>`
		}

		var xml = `<?xml version=""1.0"" encoding=""UTF-8""?>
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
//             WriteOutput("<soapenv:Envelope xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/"" xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"">" & chr(10) & chr(13));
//             WriteOutput("<soapenv:Body>" & chr(10) & chr(13));
//             WriteOutput("<ns1:createMeeting soapenv:encodingStyle=""http://schemas.xmlsoap.org/soap/encoding/"" xmlns:ns1=""#getURL()#"">" & chr(10) & chr(13));
//             WriteOutput("<token xsi:type=""xsd:string"">#session_id#</token>" & chr(10) & chr(13));
//             WriteOutput("<properties xsi:type=""api:propValPairArray"" soapenc:arrayType=""api:propValPair[]"">" & chr(10) & chr(13));
//             for(i=1; i lte arraylen(args.properties); i++) {
//                 WriteOutput("<item xsi:type=""tns:propValPair"">" & chr(10) & chr(13));
//                 WriteOutput("<property xsi:type=""xsd:string"">#args.properties[i].property#</property>" & chr(10) & chr(13));
//                 WriteOutput("<value xsi:type=""xsd:#args.properties[i].type#"">#args.properties[i].value#</value>" & chr(10) & chr(13));
//                 WriteOutput("</item>" & chr(10) & chr(13));
//             }
//             WriteOutput("</properties>" & chr(10) & chr(13));
//             WriteOutput("</ns1:createMeeting>" & chr(10) & chr(13));
//             WriteOutput("</soapenv:Body>" & chr(10) & chr(13));
//             WriteOutput("</soapenv:Envelope>");

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

// var test = new client({})
// test.getToken()
// .then(console.log)
// .catch(console.log)

//example for create endpoint
// test.createMeeting({
// 	name: {
// 		type:'string',
// 		value:'jordan'
// 	},
// 	maxVideos: {
// 		type:'numaric',
// 		value:2
// 	}
// })

module.exports = client;


//         required string name,
//         numeric maxVideos,
//         numeric maxAudio,
//         numeric expectedAttendees,
//         string defaultUserPerms,
//         boolean defaultMicStatus, 
//         boolean defaultDockedVideo,
//         boolean enableMicToggle,
//         string defaultVidLayout,
//         boolean enableLanguageList,
//         boolean enableOptionsMenu,
//         boolean enableShortcuts,
//         boolean enableExitButton,
//         boolean showMeetWelcome,
//         numeric maxConnectTime,
//         date scheduledDateTime,
//         string scheduleTimeZone,
//         date expireDateTime,
//         string password,
//         boolean enableAutoAccept,
//         boolean noiseCancelCtrl,
//         boolean restrictAudioToHost,
//         boolean resultVideoToHost,
//         numeric videoProfile,
//         string callinNumber,
//         string moderatorCode,
//         string attendeeCode,
//         string ToolConferenceMode,
//         boolean enableMeetingList,
//         boolean enablePersistChat,
//         boolean enablePrivateChat,
//         boolean enableChat,
//         numeric msDefaultPort,
//         string msDeafultProtocol,
//         numeric msDomain,
//         numeric msApplication,
//         string msEdgeServers,
//         numeric streaming,
//         boolean enableUserList,
//         string hostUserName,
//         string inviteComments,
//         boolean requireRegistration,
//         boolean requireRegPayment,
//         numeric maxRegistrants,
//         numeric TzOffset,
//         boolean autoRecord,
//         boolean alertSound,
//         boolean chatSound
