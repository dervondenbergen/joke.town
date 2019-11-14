const express = require("express");
const app = express();
const server = require("http").Server(app);
const sio = require("socket.io");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const Twilio = require("twilio");
const twilio = Twilio(
  "AC43c9074fd12241cd92186c182facc613",
  "0e7be2402c4e6fa06cd529e3675c61ed"
);

timeoutId = null;
jokequeue = [];

const MessagingResponse = Twilio.twiml.MessagingResponse;

try {
  userfile = fs.readFileSync(path.join(__dirname, "data/users.json"), {
    encoding: "utf8"
  });
  users = JSON.parse(userfile);
} catch (e) {
  console.error(e);
  users = {};
}

try {
  jokefile = fs.readFileSync(path.join(__dirname, "data/jokes.json"), {
    encoding: "utf8"
  });
  jokes = JSON.parse(jokefile);
} catch (e) {
  console.error(e);
  jokes = [];
}

server.listen(process.env.PORT);
const io = sio.listen(process.env.IOPORT);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/number.html");
});

screenpage = fs
  .readFileSync(path.join(__dirname, "index.html"), {
    encoding: "utf8"
  })
  .replace("{{IOPORT}}", process.env.IOPORT);
app.get("/screen", function(req, res) {
  res.send(screenpage);
});
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.post("/sms", function(req, res) {
  var from = req.body.From;
  var body = req.body.Body;
  var id = req.body.MessageSid;

  console.log(`SMS from ${from} saying: ${body}`);

  // user is not in users object, gets asked for nickname
  if (!users.hasOwnProperty(from)) {
    console.log("no user");

    users[from] = null;

    updateUsers();

    const twiml = new MessagingResponse();
    twiml.message(
      "Um einen Witz einzureichen musst du dir einen Nickname zulegen 🤡"
    );
    res.writeHead(200, { "Content-Type": "text/xml" });
    return res.end(twiml.toString());
  }

  // user is already saved
  user = users[from];

  // user has no nickname, so message will be used as nickname
  if (user === null) {
    console.log("new name");

    users[from] = body;
    updateUsers();

    const twiml = new MessagingResponse();
    twiml.message(`Hallo ${body}, ab jetzt kannst du Witze einsenden 📲`);
    res.writeHead(200, { "Content-Type": "text/xml" });
    return res.end(twiml.toString());
  }

  // message will be converted to joke
  j = { id, from, user, text: body, votes: { up: 0, down: 0 } };

  // send joke into the system -> see sendJoke function
  sendJoke(j);

  res.status(200);
  res.end();
});

function sendJoke(joke) {
  // joke gets added to the jokes "database" file
  jokes.push(joke);

  if (timeoutId === null) {
    // no joke is currently on display, so the new joke will be displayed -> see setResponseTimer function
    setResponseTimer(joke.id);
  } else {
    // a joke is currently displayed, the id will be added to the queue and writer will be informed, that there are already jokes shown
    jokequeue.push(joke.id);

    twilio.messages
      .create({
        body:
          "Dein Witz wurde zur Warteschlange hinzugefügt, du bekommst bald mehr Infos.",
        from: "+43676800104321",
        to: joke.from
      })
      .then(message => console.log("Delivered: ", message));
  }

  // independed if joke gets shown or added to queue, jokes file will be updated
  updateJokes();
}

// save data from jokes object to jokes.json, this exists instead of an database, as it is much easier to implement
function updateJokes() {
  fs.writeFile(
    path.join(__dirname, "data/jokes.json"),
    JSON.stringify(jokes),
    err => {
      if (err) {
        console.error("witze speichern war nicht möglich wegen ", err);
      }
    }
  );
}

function setResponseTimer(jokeid) {
  joke = jokes.find(j => j.id === jokeid);

  // joke gets sent to display via websockets
  io.emit("joke", joke);

  // writer will be informed, that joke appears for one minute on screen
  twilio.messages
    .create({
      body:
        "Dein Witz wird jetzt für 1 Minute angezeigt.\nNach der Abstimmung bekommst du die Ergebnisse zugeschickt.",
      from: "+43676800104321",
      to: joke.from
    })
    .then(message => console.log("Delivered: ", message));

  // timeout starts for how long joke should be available
  timeoutId = setTimeout(function() {
    // after the timeout, the votes will be send to the writer
    sendVotes(jokeid);

    // display gets cleared from old joke
    io.emit("clear");
    if (jokequeue.length) {
      // if there is a joke in the queue, the function calls itself with the id an removes it from the queue (FIFO)
      setResponseTimer(jokequeue.shift());
    } else {
      // if the queue is empty, the timeoutid will be set to null
      timeoutId = null;
    }
  }, 60 * 1000); // one minute
}

// sends the votes on a joke to the writer, after it gets removed from the display
function sendVotes(jokeid) {
  joke = jokes.find(j => j.id === jokeid);

  twilio.messages
    .create({
      body: `Für deinen Witz "${truncateString(
        joke.text
      )}" wurde so abgestimmt:\n👍 ${joke.votes.up} / 👎 ${joke.votes.down}`,
      from: "+43676800104321",
      to: joke.from
    })
    .then(message => console.log("Delivered: ", message));
}

// takes any string and truncates it with … if it is over 25 chars long
function truncateString(text) {
  if (text.length > 25) {
    text = text.slice(0, 24) + "…";
  }
  return text;
}

// save data from users object to users.json, this exists instead of an database, as it is much easier to implement
function updateUsers() {
  fs.writeFile(
    path.join(__dirname, "data/users.json"),
    JSON.stringify(users),
    err => {
      if (err) {
        console.error("user speichern war nicht möglich wegen ", err);
      }
    }
  );
}

// when the display connects via websockets, this event will be fired
io.on("connection", function(socket) {
  // send latest joke to display
  socket.emit("joke", jokes[jokes.length - 1]);

  // when someone votes on the display, update the votes on the joke
  socket.on("vote", function(votedata) {
    joke = jokes.find(j => j.id === votedata.id);
    joke.votes[votedata.change]++;

    io.emit("jokevotes", joke);

    updateJokes();
  });
});
