#!/usr/bin/env python3

from signal import pause
import datetime
import subprocess
import uinput  # from https://github.com/tuomasjjrasanen/python-uinput
from gpiozero import Button  # from https://github.com/RPi-Distro/python-gpiozero
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
button1 = Button(17)
button2 = Button(23)


def b1click():
    # Function for when right button is pressed
    device.emit_click(KEY_MAPPING[1])
    currentDT = datetime.datetime.now()
    print("Button Right is pressed")
    print(str(currentDT))


def b2click():
    # Function for when right button is pressed
    device.emit_click(KEY_MAPPING[0])
    currentDT = datetime.datetime.now()
    print("Button Left is pressed")
    print(str(currentDT))


button1.when_pressed = b1click
button2.when_pressed = b2click

pause()
