//.......generating random numbers in required range.........

var random = require("random-js")(); 
var mqtt = require('mqtt')

var localClient  = mqtt.connect('mqtt://localhost')
localClient.on('connect', function () {
});

var flag = true;
var lower_ac;
var upper_ac;
var lower_mg;
var upper_mg;
var lower_gy;
var upper_gy;
var lower_amb;
var upper_amb;
var lower_obj;
var upper_obj;

setInterval(function(){
	
	if( flag == true) {
		lower_ac = 1;
		upper_ac = 10;
		lower_mg = 1;
		upper_mg = 10;
		lower_gy = 1;
		upper_gy = 10;
		lower_amb = 23;
		upper_amb = 33;
		lower_obj = 12;
		upper_obj = 32;
		flag = false;
	}else{
		lower_ac = 20;
		upper_ac = 50;
		lower_mg = 5;
		upper_mg = 15;
		lower_gy = 5;
		upper_gy = 15;
		lower_amb = 28;
		upper_amb = 38;
		lower_obj = 17;
		upper_obj = 37;
		flag = true;
	}
	
}, 10000);

setTimeout(function(){
	
	lower_ac = 20;
	upper_ac = 50;
	lower_mg = 5;
	upper_mg = 15;
	lower_gy = 5;
	upper_gy = 15;
	lower_amb = 28;
	upper_amb = 38;
	lower_obj = 17;
	upper_obj = 37;
	
	var sensorTagArr = [];
	sensorTagArr = ["24:6D:83:9E","B8:4F:6G:4D"];
	
	for(var i in sensorTagArr){
		callTimer(sensorTagArr[i])
	}
		
}, 2000);
	
var callTimer = function(sensorTagArr) {
	
	setInterval(function(){
		generateRandomNumber(sensorTagArr)
	}, 2000);
	
}	

var generateRandomNumber = function(sensorTagArr) {
	
	var acx = random.real(lower_ac, upper_ac, true);
	var acy = random.real(lower_ac, upper_ac, true);
	var acz = random.real(lower_ac, upper_ac, true);
	var ac = acx+","+acy+","+acz;
	var finalDataAc = ac+"-"+sensorTagArr+"-"+"accelerometer"+"-"+"G";
	
	localClient.publish('topic/sensor/data/accelerometer', finalDataAc.toString());
	
	var mgx = random.real(lower_mg, upper_mg, true);
	var mgy = random.real(lower_ac, upper_mg, true);
	var mgz = random.real(lower_mg, upper_mg, true);
	var mg = mgx+","+mgy+","+mgz;
	var finalDataMg = mg+"-"+sensorTagArr+"-"+"magnetometer"+"-"+"G";
	
	localClient.publish('topic/sensor/data/magnetometer', finalDataMg.toString());
	
	var gyx = random.real(lower_gy, upper_gy, true);
	var gyy = random.real(lower_gy, upper_gy, true);
	var gyz = random.real(lower_gy, upper_gy, true);
	var gy = gyx+","+gyy+","+gyz;
	var finalDataGy = gy+"-"+sensorTagArr+"-"+"gyroscope"+"-"+"G";
	
	localClient.publish('topic/sensor/data/gyroscope', finalDataGy.toString());
	
	var amb = random.real(lower_amb, upper_amb, true);
	var finalDataAmb = amb+"-"+sensorTagArr+"-"+"ambientTemperature"+"-"+"C";
	
	localClient.publish('topic/sensor/data/ambientTemperature', finalDataAmb.toString());
	
	var obj = random.real(lower_obj, upper_obj, true);
	var finalDataObj = obj+"-"+sensorTagArr+"-"+"objectTemperature"+"-"+"C";
	
	localClient.publish('topic/sensor/data/objectTemperature', finalDataObj.toString());
	
	console.log(finalDataObj);
	console.log(finalDataAmb);
	console.log(finalDataGy);
	console.log(finalDataMg);
	console.log(finalDataAc);
}