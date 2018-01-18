var hostClient = require('./index').hostClient;



hostClient = new hostClient({
	url:'',
	username:'',
	password:''
	})

hostClient.createMeeting({
  name:'Jason4',
  scheduledDateTime: new Date().toISOString(),
  defaultUserPerms:'ReceiveAudio,ReceiveVideo,SMD,Chat,VidLayout',
  streaming: 16,
  enableAutoAccept: 1,
  expectedAttendees: 5,
  showMeetWelcome: 0,
  enableChat: 1,
  maxRegistrants: 5,
  maxVideos: 5,
  restrictVideoToHost: 0,
  autoRecord: 1,
  alertSound: 0,
  chatSound: 0
})
.catch(console.log)
