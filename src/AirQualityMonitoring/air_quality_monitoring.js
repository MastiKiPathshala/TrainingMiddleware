//.......generating random numbers in required range.........

var random = require("random-js")(); 
var mqtt = require('mqtt')

var localClient  = mqtt.connect('mqtt://localhost')
localClient.on('connect', function () {
});

var flag = true;

var lower_so2;
var upper_so2;

var lower_no2;
var upper_no2;

var lower_co;
var upper_co;

var lower_nh3;
var upper_nh3;

var lower_co2;
var upper_co2;

var lower_temp;
var upper_temp;

var lower_humid;
var upper_humid;

setInterval(function(){
	
	if( flag == true) {
		
		lower_so2 = 0;
		upper_so2 = 200;
		
		lower_no2 = 0;
		upper_no2 = 2000;
		
		lower_co = 0;
		upper_co = 100;
		
		lower_co2 = 0;
		upper_co2 = 5000;
		
		lower_nh3 = 0;
		upper_nh3 = 1000;
		
		lower_temp = 18;
		upper_temp = 35;
		
		lower_humid = 40;
		upper_humid = 80;
		
		flag = false;
		
	}else{
		
		lower_so2 = 0;
		upper_so2 = 100;
		
		lower_no2 = 0;
		upper_no2 = 1000;
		
		lower_co = 0;
		upper_co = 50;
		
		lower_co2 = 0;
		upper_co2 = 2500;
		
		lower_nh3 = 0;
		upper_nh3 = 500;
		
		lower_temp = 12;
		upper_temp = 32;
		
		lower_humid = 60;
		upper_humid = 90;
		
		flag = true;
	}
	
}, 10000);

setTimeout(function(){
	
	lower_so2 = 0;
	upper_so2 = 100;
		
	lower_no2 = 0;
	upper_no2 = 1000;
		
	lower_co = 0;
	upper_co = 50;
		
	lower_co2 = 0;
	upper_co2 = 2500;
		
	lower_nh3 = 0;
	upper_nh3 = 500;
		
	lower_temp = 12;
	upper_temp = 32;
		
	lower_humid = 60;
	upper_humid = 90;
	
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
	
	var so2 = random.real(lower_so2, upper_so2, true);	
	var finalDataSo2 = so2+"-"+sensorTagArr+"-"+"so2"+"-"+"ppb";
	localClient.publish('topic/sensor/data/so2', finalDataSo2.toString());
	
	var no2 = random.real(lower_no2, upper_no2, true);
	var finalDataNo2 = no2+"-"+sensorTagArr+"-"+"no2"+"-"+"ppb";
	localClient.publish('topic/sensor/data/no2', finalDataNo2.toString());
	
	var co = random.real(lower_co, upper_co, true);
	var finalDataCo = co+"-"+sensorTagArr+"-"+"co"+"-"+"ppm";
	localClient.publish('topic/sensor/data/co', finalDataCo.toString());
	
	var co2 = random.real(lower_co2, upper_co2, true);
	var finalDataCo2 = co2+"-"+sensorTagArr+"-"+"co2"+"-"+"ppm";
	localClient.publish('topic/sensor/data/co2', finalDataCo2.toString());
	
	var nh3 = random.real(lower_nh3, upper_nh3, true);
	var finalDataNh3 = nh3+"-"+sensorTagArr+"-"+"nh3"+"-"+"ppb";
	localClient.publish('topic/sensor/data/nh3', finalDataNh3.toString());
	
	var temp = random.real(lower_temp, upper_temp, true);
	var finalDataTemp = temp+"-"+sensorTagArr+"-"+"temperature"+"-"+"C";
	localClient.publish('topic/sensor/data/temperature', finalDataTemp.toString());
	
	var humid = random.real(lower_humid, upper_humid, true);
	var finalDataHumid = humid+"-"+sensorTagArr+"-"+"humidity"+"-"+"%rh";
	localClient.publish('topic/sensor/data/objectTemperature', finalDataHumid.toString());
	
	console.log(finalDataSo2);
	console.log(finalDataNo2);
	console.log(finalDataCo);
	console.log(finalDataCo2);
	console.log(finalDataNh3);
	console.log(finalDataTemp);
	console.log(finalDataHumid);
}