import random
import time
import datetime
from datetime import timedelta
import paho.mqtt.client as mqtt

slot1 = 1
slot2 = 2
slot3 = 3

vehicleParkingTime = {slot1:None,slot2:None,slot3:None} # Dictionary to store the Time when vehicle parked in the slot
vehicleParkedTime = {slot1:None,slot2:None,slot3:None} # Dictionary to store the Total parking time of the vehicle in the slot

slotlimit = 51

simulated_slot_data = {}
slots = []

for i in range(1,slotlimit):
	slots.append(i)
	simulated_slot_data.update({i:{"random_totalparkingtime":None,"car_parkingtime":None}})


min_parktime = 1
max_parktime = 10


SUBSCRIBE_CHANNEL = 'parkingstatus-req'
PUBLISH_CHANNEL = 'parkingstatus-resp'



def simulatedHardware():
	while True:
			
		# Step 1 : Run through the slots
		for slotnum in simulated_slot_data.keys():	        
			
			# Get the random total parking time
			random_totalparkingtime = simulated_slot_data[slotnum]["random_totalparkingtime"]
			# Get the car arrival time
			car_parkingtime = simulated_slot_data[slotnum]["car_parkingtime"]

			# print random_totalparkingtime,car_parkingtime,"DICT VALUES\n"
			
			
			# Check if the car is parked already or not
			
			# None means car is not parked then it will go to the else part where we on random basis the slot will get 
			# selected and random parking number will be given.

			if car_parkingtime != None and random_totalparkingtime != None :

				# Checking if the parking time exceeded the present time or not
				if (datetime.datetime.now().replace(second=0,microsecond=0) >=  car_parkingtime+timedelta(minutes=random_totalparkingtime)):      
					# if exceeds then send the car Exit message
					payload = '{"Requester":"Device","parking_id":''\"'+str(slotnum)+'\"'',"parking_status":"0","car_parkingtime":''\"'+str(car_parkingtime)+'\"'',"total_parkingtime":''\"'+str(random_totalparkingtime)+'\"''}'
					print payload,"\n"
					# -------- Mqtt publish part
					(result,mid) = mqttc.publish(PUBLISH_CHANNEL,payload,2)                    

					if result == 0:
					    print "Message to APP successfully sent"
					else:
					    print "Message to APP Failed"
					# -------------

					# Again reset the Simulated slot data dictionary to None means nothing is parked in the slot
					simulated_slot_data.update({slotnum:{"random_totalparkingtime":None,"car_parkingtime":None}})
    
				
			else:
				# checking whether it is a simulated or hardware parking slot
				if slotnum not in [slot1,slot2,slot3]:
					
					# process of randomization of the parking slot
					randomslot_pickup = int(random.randint(1,100))
					seconds_now = int(datetime.datetime.now().strftime("%S"))
					
					#print randomslot_pickup,seconds_now,slotnum,"\n"

					if randomslot_pickup < seconds_now : 
						# Update the simulated slot data with the total parking time and car parking time, 
						simulated_slot_data.update({slotnum:{"random_totalparkingtime":random.randint(min_parktime,max_parktime),"car_parkingtime":datetime.datetime.now().replace(second=0,microsecond=0)}})
						# send the car arrival message 
						payload = '{"Requester":"Device","parking_id":''\"'+str(slotnum)+'\"'',"parking_status":"1","car_parkingtime":''\"'+str(simulated_slot_data[slotnum]["car_parkingtime"])+'\"''}'

						print payload,"\n"

						# ------- Mqtt publish part 
						(result,mid) = mqttc.publish(PUBLISH_CHANNEL,payload,2)

						if result == 0:
							print "Message to APP successfully sent"
						else:
						    print "Message to APP Failed"		
						#  -----------

		time.sleep(2)			




def on_connect(client, userdata, flags, rc):
        print "Connected with result code "+str(rc)
        (result,mid)= client.subscribe(SUBSCRIBE_CHANNEL)


def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))
    data = msg.payload
    print(data)		        

if __name__ == '__main__':
        mqttc = mqtt.Client()
        mqttc.on_connect = on_connect
        mqttc.on_message = on_message
        mqttc.connect("162.242.215.7",1883,60)

        mqttc.loop_start()

        simulatedHardware()











