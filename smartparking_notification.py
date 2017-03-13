import RPi.GPIO as GPIO
import time

import paho.mqtt.client as mqtt

import random
import datetime
from datetime import timedelta

from multiprocessing import Process
import math

# slot selection
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


SENSOR1_TRIG = 24
SENSOR1_ECHO = 23

SENSOR2_TRIG = 18
SENSOR2_ECHO = 17

SENSOR3_TRIG = 27
SENSOR3_ECHO = 22


PARKED = 10
FAULT = 4500


LOOP_SAMPLING_TIME = 2
TIME_DELAY = 0.00001

SUBSCRIBE_CHANNEL = 'parkingstatus-req'
PUBLISH_CHANNEL = 'parkingstatus-resp'

def ultrasonicSensorInit():
        GPIO.setwarnings(False)
        GPIO.setmode(GPIO.BCM)

        GPIO.setup(SENSOR1_TRIG,GPIO.OUT)
        GPIO.setup(SENSOR1_ECHO,GPIO.IN)
        GPIO.setup(SENSOR2_TRIG,GPIO.OUT)
        GPIO.setup(SENSOR2_ECHO,GPIO.IN)
        GPIO.setup(SENSOR3_TRIG,GPIO.OUT)
        GPIO.setup(SENSOR3_ECHO,GPIO.IN)
        
        GPIO.output(SENSOR1_TRIG,False)
        GPIO.output(SENSOR2_TRIG,False)
        GPIO.output(SENSOR3_TRIG,False)

def distanceMeasurement():
        ultrasonicSensorInit()

        while True:
                time.sleep(LOOP_SAMPLING_TIME)

                GPIO.output(SENSOR1_TRIG,True)
                time.sleep(TIME_DELAY)
                GPIO.output(SENSOR1_TRIG,False)
                sensor1_pulse_start = time.time()
                while GPIO.input(SENSOR1_ECHO)==0 : 
                        sensor1_pulse_start = time.time()
                #Waits for the timer to end once the pin is high
                sensor1_pulse_end = time.time()
                while GPIO.input(SENSOR1_ECHO)==1 : 
                        sensor1_pulse_end = time.time()
                


                GPIO.output(SENSOR2_TRIG,True)
                time.sleep(TIME_DELAY)
                GPIO.output(SENSOR2_TRIG,False)
                sensor2_pulse_start = time.time()
                while GPIO.input(SENSOR2_ECHO)==0 :        
                        sensor2_pulse_start = time.time()
                sensor2_pulse_end = time.time()
                while GPIO.input(SENSOR2_ECHO)==1 :        
                        sensor2_pulse_end = time.time()
                
                GPIO.output(SENSOR3_TRIG,True)
                time.sleep(TIME_DELAY)
                GPIO.output(SENSOR3_TRIG,False)
                sensor3_pulse_start = time.time()
                while  GPIO.input(SENSOR3_ECHO)==0:        
                        sensor3_pulse_start = time.time()
                sensor3_pulse_end = time.time()
                while GPIO.input(SENSOR3_ECHO)==1:        
                        sensor3_pulse_end = time.time()
                
                sensor1_pulse_duration = sensor1_pulse_end - sensor1_pulse_start
                sensor2_pulse_duration = sensor2_pulse_end - sensor2_pulse_start
                sensor3_pulse_duration = sensor3_pulse_end - sensor3_pulse_start

                sensor1_distance = sensor1_pulse_duration * 17150
                sensor2_distance = sensor2_pulse_duration * 17150
                sensor3_distance = sensor3_pulse_duration * 17150
                
        
        
                sensor1_distance = int(sensor1_distance)
                sensor2_distance = int(sensor2_distance)
                sensor3_distance = int(sensor3_distance)



        
                sensor_distance = [sensor1_distance,sensor2_distance,sensor3_distance]
        

                sensors_output = {slot1:None,slot2:None,slot3:None}

                keys = sensors_output.keys()

                for i in range(3):

                        if sensor_distance[i] < PARKED:
                            sensors_output.update({keys[i]:1})
                            if vehicleParkingTime[keys[i]] == None:
                                    vehicleParkingTime.update({keys[i]:datetime.datetime.now()}) # Getting the time when vehicle parked in the slot $
                                    payload = '{"parking_id":''\"'+str(keys[i])+'\"'',"parking_status":''\"'+str(sensors_output[keys[i]])+'\"'',"car_parkingtime":''\"'+str(vehicleParkingTime[keys[i]])+'\"''}'
                                    print payload
                                    (result,mid) = mqttc.publish(PUBLISH_CHANNEL,payload,2)

                                    if result == 0:
                                            print "Message to APP successfully sent"
                                    else:
                                            print "Message to APP Failed"


                        elif sensor_distance[i] > FAULT:
                                sensors_output.update({keys[i]:2})


                        else:
                                sensors_output.update({keys[i]:0})
                                # Getting the vehicle leaving the slot Time
                                vehicleLeavingTime = datetime.datetime.now()
                                # Getting the Total parking Time in the slot(in minutes)
                                if vehicleParkingTime[keys[i]] != None :
                                        vehicleParkedTime.update({keys[i]:int(math.ceil((vehicleLeavingTime - vehicleParkingTime[keys[i]]).seconds/60.0))})
                                        payload = '{"parking_id":''\"'+str(keys[i])+'\"'',"parking_status":''\"'+str(sensors_output[keys[i]])+'\"'',"car_parkingtime":''\"'+str(vehicleParkingTime[keys[i]])+'\"'',"total_parkingtime":''\"'+str(vehicleParkedTime[keys[i]])+'\"''}'
                                        vehicleParkingTime.update({keys[i]:None})
                                        
                                        vehicleParkedTime.update({keys[i]:None})
                                        print payload
                                        (result,mid) = mqttc.publish(PUBLISH_CHANNEL,payload,2)
                                        if result == 0:
                                            print "Message to APP successfully sent"
                                        else:
                                            print "Message to APP Failed"

                     
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
                            payload = '{"parking_id":''\"'+str(slotnum)+'\"'',"parking_status":"0","car_parkingtime":''\"'+str(car_parkingtime)+'\"'',"total_parkingtime":''\"'+str(random_totalparkingtime)+'\"''}'
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
                            
                            print randomslot_pickup,seconds_now,slotnum,"\n"

                            if randomslot_pickup < seconds_now : 
                                # Update the simulated slot data with the total parking time and car parking time, 
                                simulated_slot_data.update({slotnum:{"random_totalparkingtime":random.randint(min_parktime,max_parktime),"car_parkingtime":datetime.datetime.now().replace(second=0,microsecond=0)}})
                                # send the car arrival message 
                                payload = '{"parking_id":''\"'+str(slotnum)+'\"'',"parking_status":"1","car_parkingtime":''\"'+str(simulated_slot_data[slotnum]["car_parkingtime"])+'\"''}'

                                print payload,"\n"

                                # ------- Mqtt publish part 
                                (result,mid) = mqttc.publish(PUBLISH_CHANNEL,payload,2)

                                if result == 0:
                                    print "Message to APP successfully sent"
                                else:
                                    print "Message to APP Failed"       
                                #  -----------
                                    




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

        distanceMeasurement()
        



