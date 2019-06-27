#!/usr/bin/env python3

import datetime
import time
import subprocess
import uinput
from gpiozero import Button
print('MUSS ALS SUDO GESTARTET WERDEN!!')


# Sleep this long between polling for events:
EVENT_WAIT_SLEEP_SECONDS = 0.1

# Define Keys which should be emulated
KEY_MAPPING = {
    0: uinput.KEY_LEFT,
    1: uinput.KEY_RIGHT,
}

# Make sure uinput kernel module is loaded.
subprocess.check_call(['modprobe', 'uinput'])

# Configure virtual keyboard.
device = uinput.Device(KEY_MAPPING.values())

# Define button for GPIO3
button1 = Button(2)
button2 = Button(3)

while True:
    if button1.is_pressed:
        device.emit_click(KEY_MAPPING[1])
        currentDT = datetime.datetime.now()
        print("Button Right is pressed")
        print(str(currentDT))

    if button2.is_pressed:
        device.emit_click(KEY_MAPPING[0])
        currentDT = datetime.datetime.now()
        print("Button Left is pressed")
        print(str(currentDT))

    time.sleep(EVENT_WAIT_SLEEP_SECONDS)
