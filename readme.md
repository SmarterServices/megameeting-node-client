##megameeting-node-client

This is a client wrapper around the mega meeting api

Currently includes 2 client libs. The hostClient and serviceClient

	hostClient:
		createMeeting
		getToken
		listMeetings
	serviceClient:
		deleteVideo
		
Example:

	var hostClient = require('mega-meeting-client').hostClient			
	
	var serviceClient = require('mega-meeting-client').serviceClient
	
	hostClient.createMeeting({
	meetingName:"99c2c5b87e9f11e7bb31be2e44b06b34",
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
	
	hostClient.listMeetings().then(console.log).catch(console.log)
	
	serviceClient.deleteVideo('RECORDING ID').then(console.log).catch(console.log)