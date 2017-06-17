// parking.js
var mqtt  = require('mqtt');
var async = require('async');
var redis = require('redis');

var client = redis.createClient();
var index,median;

//arrays storing coming-in time. length of subarrays= no. of parking lots
var lots =[];
var mon = [];
var tue = [];
var wed = [];
var thu = [];
var fri = [];
var sat = [];
var sun = [];
var short_days = ["sun","mon","tue","wed","thu","fri","sat"];
var days       = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const PARKING_LOTS  = 25; //total parking lots
const PARKING_SLOTS = 50; // 50 slots per parking lot
const TIME_SLOTS    = 12;  // 2hr time slots for 24hrs
const INTERVAL      = 31*24*60* 60 *1000;  //for ltrim of medians
const AVG_CARS_PM   = 500 *30 ; //per month per lot?

initialize_arrays(mon);
initialize_arrays(tue);
initialize_arrays(wed);
initialize_arrays(thu);
initialize_arrays(fri);
initialize_arrays(sat);
initialize_arrays(sun);

// since interval for a month causes overflow
function setTimeout_ (fn, delay) {
    var maxDelay = Math.pow(2,31)-1;

    if (delay > maxDelay) {
        var args = arguments;
        args[1] -= maxDelay;

        return setTimeout(function () {
            setTimeout_.apply(undefined, args);
        }, maxDelay);
    }

    return setTimeout.apply(undefined, arguments);
}

function initialize_arrays(arr)
{
	for(var i=0;i<TIME_SLOTS;i++) {  
		arr[i]=[];
		for (var j = 0; j <= PARKING_LOTS; j++) {
			arr[i][j]=[];
		}
	}
}
  
var options = {
	port :1883,
	keepalive: 60,
};

var messageBroker = mqtt.connect('mqtt://localhost',options)

messageBroker.on('connect', function() { 
	console.log("Mqtt Connected!") 
	messageBroker.subscribe('parkingstatus-resp');
	messageBroker.subscribe('wait_time_req');
});

messageBroker.on("message", function(channel, message) {
    var obj=JSON.parse(message);
    
	if (obj.Requester == "Device") {
		console.log("Message from channel " + channel +" id: " +obj.parking_id + " status:  " +obj.parking_status+" time : "+obj.car_parkingtime +" LOT:"+obj.parking_lot_id);
    lots.push(obj.parking_lot_id);
  //var lot=obj.lot;
	var lot =lots.indexOf(obj.parking_lot_id);
  	var id=obj.parking_id;
  	var status=obj.parking_status;
		if (status == 1) {
        var t= obj.car_parkingtime.split(" ")[1];
        var time=+parseFloat(t.split(":")[0]) + +parseFloat(t.split(":")[1]/60).toFixed(2);
        var date= obj.car_parkingtime.split(" ")[0];
        var d = new Date(date);
        var day =days[d.getDay()];
        var x=0;
        
        console.log("DAY  "+day+"   TIME  "+time);

    	} else{

      var t= obj.car_parkingtime.split(" ")[1];
      var time=+parseFloat(t.split(":")[0]) + +parseFloat(t.split(":")[1]/60).toFixed(2);
      var date= obj.car_parkingtime.split(" ")[0];
      var d = new Date(date);
      var day =days[d.getDay()];
      var x=obj.total_parkingtime;
      
      console.log("DAY  "+day+"   TIME  "+time);
    	}
  
    	switch(day) {
    case 'Monday'   : time_division(mon,'mon',sun,'sun',status,time,id,lot,x);
            break;
    case 'Tuesday'  : time_division(tue,'tue',mon,'mon',status,time,id,lot,x);
            break;
    case 'Wednesday': time_division(wed,'wed',tue,'tue',status,time,id,lot,x);
            break;
    case 'Thursday' : time_division(thu,'thu',wed,'wed',status,time,id,lot,x);
            break;
    case 'Friday'   : time_division(fri,'fri',thu,'thu',status,time,id,lot,x);
            break;
    case 'Saturday' : time_division(sat,'sat',fri,'fri',status,time,id,lot,x);
            break;
    case 'Sunday'   : time_division(sun,'sun',sat,'sat',status,time,id,lot,x);
            break;
    default         : 
            break;
		}
	}

	if(obj.Requester=="APP") {
		console.log("Message from channel " + channel +"  Requester : "+obj.Requester+"  Timestamp: " +obj.Timestamp +"  Userid : "+obj.Userid+"LOT: "+obj.parking_lot_id);
     	var lot = lots.indexOf(obj.parking_lot_id);

		if (lot == -1) {

              console.log ("Lot doesn't exist");
              messageBroker.publish('wait_time_resp',"Lot doesn't exist");
		} else {

     		var t= obj.Timestamp.split(" ")[1];
     		var time=+parseFloat(t.split(":")[0]) + +parseFloat(t.split(":")[1]/60).toFixed(2);
     		var date= obj.Timestamp.split(" ")[0];
     		var d = new Date(date);
     		var day =short_days[d.getDay()];
     		//var key = lot+name +'0';
      		
      		if(time >= 0 && time <= 2)
            { 
            	var key = lot+day+'0';
              calculate_median(key,'med_'+key);
            }
            else if (time>2  && time <= 4)
            { 
            	var key = lot+name +'1';
              calculate_median(key,'med_'+key);
            }
            else if (time>4  && time <= 6)
            { 
            	var key = lot+day +'2';
              calculate_median(key,'med_'+key);
            }
            else if (time>6  && time <= 8)
            {
            	var key = lot+day +'3';
              calculate_median(key,'med_'+key);
            }
            else if (time>8  && time <= 10)
            { 
            	var key = lot+day +'4';
              calculate_median(key,'med_'+key);
            }
            else if (time>10  && time <= 12)
            { 
            	var key = lot+day+'5';
              calculate_median(key,'med_'+key);

            }
            else if (time>12  && time <= 14)
            { 
              	var key = lot+day +'6';
              calculate_median(key,'med_'+key);
            }
            else if (time>14  && time <= 16)
             { 
             	var key = lot+day +'7';
              calculate_median(key,'med_'+key);
            }
            else if (time>16  && time <= 18)
            { 
            	var key = lot+day +'8';
              calculate_median(key,'med_'+key);
            }
            else if (time>18  && time <= 20)
            { 
              	var key = lot+day +'9';
              calculate_median(key,'med_'+key);
            }
            else if (time>20  && time <= 22)
            { 
            	var key =lot+ day +'10';
              calculate_median(key,'med_'+key);
            }
            else if (time>22  && time <= 24)
            { 
            	var key = lot+day +'11';
              calculate_median(key,'med_'+key);
            }
            
     		console.log("DAY  "+day+"   TIME  "+time);
			switch (day) {
   			 case 'mon'   :
              				earliest_time(mon,'mon',time,lot,obj.Userid,function(id)
              				{
              				var msg=JSON.stringify({"Requester": "Analytics","Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]});
              				messageBroker.publish('wait_time_resp',msg);
              				console.log("Message Sent : " +JSON.stringify({"Requester": "Analytics","parking_lot_id":lots[lot],"Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]}));
          });
            				break;
    		case 'tue'  : 
             				 earliest_time(tue,'tue',time,lot,obj.Userid,function(id)
             				 {
              				var msg=JSON.stringify({"Requester": "Analytics","Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]});
              				messageBroker.publish('wait_time_resp',msg);
              				console.log("Message Sent : " +JSON.stringify({"Requester": "Analytics","parking_lot_id":lots[lot],"Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]}));
          });
           					 break;
    		case 'wed': 
              				earliest_time(wed,'wed',time,lot,obj.Userid,function(id)
              				{
              				var msg=JSON.stringify({"Requester": "Analytics","Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]});
              				messageBroker.publish('wait_time_resp',msg);
              				console.log("Message Sent : " +JSON.stringify({"Requester": "Analytics","parking_lot_id":lots[lot],"Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]}));
          });
            				break;
    		case 'thu' :
            				earliest_time(thu,'thu',time,lot,obj.Userid,function(id)
            				{
              				var msg=JSON.stringify({"Requester": "Analytics","Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]});
              				messageBroker.publish('wait_time_resp',msg);
             				console.log("Message Sent : " +JSON.stringify({"Requester": "Analytics","parking_lot_id":lots[lot],"Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]}));
          });
            				break;
    		case 'fri'   : 
             				earliest_time(fri,'fri',time,lot,obj.Userid,function(id)
             				{
              				var msg=JSON.stringify({"Requester": "Analytics","Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]});
              				messageBroker.publish('wait_time_resp',msg);
              				console.log("Message Sent : " +JSON.stringify({"Requester": "Analytics","parking_lot_id":lots[lot],"Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]}));
          });
            				break;
   		 	case 'sat' : 
              				earliest_time(sat,'sat',time,lot,obj.Userid,function(id)
              				{
              				var msg=JSON.stringify({"Requester": "Analytics","Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]});
              				messageBroker.publish('wait_time_resp',msg);
              				console.log("Message Sent : " +JSON.stringify({"Requester": "Analytics","parking_lot_id":lots[lot],"Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]}));
          });
            				break;
    		case 'sun'   : 
              				earliest_time(sun,'sun',time,lot,obj.Userid,function(id)
              				{
              				var msg=JSON.stringify({"Requester": "Analytics","Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]});
              				messageBroker.publish('wait_time_resp',msg);
              				console.log("Message Sent : " +JSON.stringify({"Requester": "Analytics","parking_lot_id":lots[lot],"Userid":id[0],"parking_id" : id[1] , "wait_time" : id[2]}));
          });
            				break;
    		default         : 
            				break;
			}  
		}
	}
});

/*setTimeout(function(){
  var key = '0mon2';
  calculate_median(key,'med_'+key);
},120000);
setTimeout(function(){
  earliest_time(mon,'mon',5.8,0,'uid',function(id)
  	{
  		console.log("EARLIEST : "+id);
  	});
 
 
//{"Requester": "Analytics","Userid":"asdfj-3r687236-3jka-323","parking_id" : "4" , "wait_time" : "2"}
},130000);*/
function time_division(day,name,prev,prev_name,status,time,id,lot,x)
  {  
    if (status == 1)
    {
            if(time >= 0 && time <= 2)
            { 
            	var key = lot+prev_name +'11';
              //calculate_median(key,'med_'+key);
              day[0][lot][id]=time;
              //console.log("DAY "   +day+ "  "+name);
            }
            else if (time>2  && time <= 4)
            { 
            	var key = lot+name +'0';
              //calculate_median(key,'med_'+key);
              //earliest_time(day,'mon',time,lot);  //calculating earliest & wait time
              //console.log("DAY "   +day+ "  "+key);
              day[1][lot][id]=time;
            }
            else if (time>4  && time <= 6)
            { 
            	var key = lot+day +'1';
              //calculate_median(key,'med_'+key);
              day[2][lot][id]=time;
            }
            else if (time>6  && time <= 8)
            {
            	var key = lot+day +'2';
              //calculate_median(key,'med_'+key);
              day[3][lot][id]=time;
            }
            else if (time>8  && time <= 10)
            { 
            	var key = lot+day +'3';
              //calculate_median(key,'med_'+key);
              day[4][lot][id]=time;
               //console.log("REDIS KEY :-> "+key);
            }
            else if (time>10  && time <= 12)
            { 
            	var key = lot+name+'4';
              //calculate_median(key,'med_'+key);
              day[5][lot][id]=time;
              //console.log("REDIS KEY :-> "+key);

            }
            else if (time>12  && time <= 14)
              { 
              	var key = lot+day +'5';
              //calculate_median(key,'med_'+key);
              day[6][lot][id]=time;
            }
            else if (time>14  && time <= 16)
             { 
             	var key = lot+day +'6';
              //calculate_median(key,'med_'+key);
              day[7][lot][id]=time;
            }
            else if (time>16  && time <= 18)
            { 
            	var key = lot+day +'7';
              //calculate_median(key,'med_'+key);
              day[8][lot][id]=time;
            }
            else if (time>18  && time <= 20)
              { 
              	var key = lot+day +'8';
              //calculate_median(key,'med_'+key);
              day[9][lot][id]=time;
            }
            else if (time>20  && time <= 22)
              { 
              	var key =lot+ day +'9';
              //calculate_median(key,'med_'+key);
              day[10][lot][id]=time;
            }
            else if (time>22  && time <= 24)
              { 
              	var key = lot+day +'10';
              //calculate_median(key,'med_'+key);
              day[11][lot][id]=time;
            }
            
          
          }
          else
          { //check for previous day
            for(var j=11;j>=0;j--)
            {
              if(prev[j][lot][id]!=null)
              {
                var key = lot+prev_name+i;
                client.lpush(key,time-prev[j][lot][id], function (err, res) 
                {
                	console.log("REDIS lpush in :  " +key+" : "+res);
                //client.lpush(key,time, function (err, res) {console.log("REDIS lpush in :  " +key+" : "+res);
                    prev[j][lot][id]=null; 
                });
                break;
              }
            
              if(j==0){ //then, check for current day
            for(var i=Math.floor(time/2);i>=0;i--)
            { 
           
              if(day[i][lot][id]!=null)
              {  
                var key = lot+name+i;
                //client.lpush(key,time-day[i][lot][id], function (err, res) {console.log("REDIS lpush in :  " +key+" : "+res);
                client.lpush(key,x, function (err, res) 
                	{
                		console.log("REDIS lpush in :  " +key+" : "+res);
                		day[i][lot][id]=null; 
                	});
                break;
              }

              }
            }
          }
  }
}

function calculate_median (key,list_name) {
  //list_name = med_1mon0, med_1tue1,etc

      client.sort(key, function(err, reply) 
      {
               if(reply!='') 
               {
                console.log("REeeDIS sorted:  " +reply); 

      client.llen(key, function(err, reply) 
      {
               
               console.log("REeeDIS llen:  " +reply);
               index=Math.floor(reply/2); 
               console.log("REeeDIS index:  " +index);

      client.lindex(key, index,function(err, reply) 
      {
                console.log("REeeDIS lindex:  " +index);
             	median = reply;
      if(median!=null)
      client.lpush(list_name,median,function(err,reply)
      {
                console.log("Median of "+key+ " pushed into " +list_name+ ". Value = "+median)
                })
      client.lpush("median",median,function(err,reply)
      {
                console.log("Median of "+key+ " pushed into  list : median. Value = "+median)
                })
    })
    })
    }
    })


}

function earliest_time(arr,name,time,lot,uid,cb)
{
	var i=0,index;
	var x,array,wait;
	var send=[];
	while(i<=11) {
		if(arr[i][lot]!='') {
			console.log("entered i= "+i);
			async.series([
				function(callback) {
					array=arr;
					callback(null);
				},

				function(callback) {
        x=array[i][lot].slice().sort(function(a,b){return a-b;});
        x=x.filter(function(e){ return e === 0 || e });
        console.log("Earliest time array sorted x= "+x+" arr  "+array[i][lot]);
        send.push(uid);
        callback(null);
				},

				function(callback) {

        index = arr[i][lot].indexOf(x[0]);
        console.log("Earliest time for LOT: " +lot+ " is : "+x[0]+ "   at parking id : "+index);
        send.push(index);
        callback(null);
				},

				function(callback) {
					//expected wait time
					var key = "med_"+lot+name+i;
					client.lindex(key,0,function(err,reply) {
						wait = (parseFloat(reply/60 -time) + parseFloat(x[0]))*60;
						wait=wait.toFixed(2);
						console.log("Expected wait time : " +wait);
						send.push(wait);
						cb(send);
					})
					callback(null);
				}
			], function(err, results) {

			});
			break;

		} else {
			i++;
		}
	}
}

setTimeout (function() {
	var day_number=0;
	if (lots.length > 0)
		while (day_number < 7) {
			for(var i=0;i<lots.length;i++) {
				for(var j=0;j<TIME_SLOTS;j++) {

					var key = "med_"+i+short_days[day_number]+j;
					redisClient.ltrim (key, 0, AVG_CARS_PM, function(err,done) {
						if (err) {
							console.log(err)
						}
					});
				}
			}
			day_number++;
		}
		console.log("Trimmed lists!");

	client.ltrim("median",0,AVG_CARS_PM,function(err,done){
		if (err) {
			console.log(err)
		} else {
			console.log('trimmed list')
		}
	});
}, INTERVAL);
