var getParkingStatus = function () {
        	$.ajax({
            	url: '/api/system/v1.0/parking',
            	method: "GET"
        	}).done(function(res) {

				console.log(res)
            	res = JSON.parse(res)
            	$("#parkingLotId").text(res.lotId)
            	$("#parkingSlotStartId").text(res.slotStartId)
            	$("#parkingSlotNum").text(res.slotNum)
        	})
}

var	setParkingSystem  = function () {
 	var lotId = $('#setParkingLotId').val();
 	var slotStartId = $('#setParkingSlotStartId').val();
 	var slotNum = $('#setParkingSlotNum').val();

	$.ajax({
		url: '/api/system/v1.0',
		data: JSON.stringify({
			action : "PARKING",
			lotId : lotId,
			slotStartId : slotStartId,
			slotNum : slotNum
		}),
		method: "POST"
	}).done(function(res) {
		console.log(res)
		getParkingStatus ();
	});
}
