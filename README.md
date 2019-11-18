# joke.town 🤡 🏘

## file structure

[server.js](server.js): server code, run with Node.js

[number.html](number.html): file which simply has a link to the phone number to
show on https://joke.town

[screen.html](screen.html): file which is the content of the screen, available
at https://joke.town/screen

[demo.html](demo.html): file which is the virtual joke.town consisting of the
screen + buttons, available at https://joke.town/demo

[big_keyboard.py](big_keyboard.py): DEPRECATED – this file was used to catch the
button presses, but pretty ugly with a while loop

[big_keyboard.py](big_keyboard.py): same as above but using functions and press
events instead of checking the satate in a while loop

[assets/](assets/): all files needed by the screen page

[data/](data/): the _database_, where users.json and jokes.json gets saved

[.env](.example.env): the configuration file which contains all settings (has to
be renamed to `.env`)

## services

joke.town uses Twilio to communicate via SMS.

Twilio can be tested for free, get credits worth \$10 with my refferal link:
[www.twilio.com/referral/X8xo9b](www.twilio.com/referral/X8xo9b)

the service is hosted on [Uberspace](https://uberspace.de/)
