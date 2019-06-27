const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/number.html");
});

app.get("/screen", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.post("/sms", function(req, res) {
  var from = req.body.From;
  var body = req.body.Body;
  var id = req.body.MessageSid;

  console.log(`SMS from ${from} saying: ${body}`);

  if (!users.hasOwnProperty(from)) {
    console.log("no user");

    // user hat noch kein pseudonym, also muss das erst erfragt werden.
    users[from] = null;

    updateUsers();

    const twiml = new MessagingResponse();
    twiml.message(
      "Um einen Witz einzureichen musst du dir einen Nickname zulegen 🤡"
    );
    res.writeHead(200, { "Content-Type": "text/xml" });
    return res.end(twiml.toString());
  }

  user = users[from];

  if (user === null) {
    console.log("new name");

    users[from] = body;
    updateUsers();

    const twiml = new MessagingResponse();
    twiml.message(`Hallo ${body}, ab jetzt kannst du Witze einsenden 📲`);
    res.writeHead(200, { "Content-Type": "text/xml" });
    return res.end(twiml.toString());
  }

  j = { id, from, user, text: body, votes: { up: 0, down: 0 } };

  sendJoke(j);

  res.status(200);
  res.end();
});

function sendJoke(joke) {
  jokes.push(joke);

  if (timeoutId === null) {
    setResponseTimer(joke.id);
  } else {
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

  updateJokes();
}

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
  io.emit("joke", joke);

  twilio.messages
    .create({
      body:
        "Dein Witz wird jetzt für 1 Minute angezeigt.\nNach der Abstimmung bekommst du die Ergebnisse zugeschickt.",
      from: "+43676800104321",
      to: joke.from
    })
    .then(message => console.log("Delivered: ", message));

  timeoutId = setTimeout(function() {
    sendVotes(jokeid);
    io.emit("clear");
    if (jokequeue.length) {
      setResponseTimer(jokequeue.shift());
    } else {
      timeoutId = null;
    }
  }, 60 * 1000);
}

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

function truncateString(text) {
  if (text.length > 25) {
    text = text.slice(0, 24) + "…";
  }
  return text;
}

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

io.on("connection", function(socket) {
  socket.emit("joke", jokes[jokes.length - 1]);

  socket.on("vote", function(votedata) {
    joke = jokes.find(j => j.id === votedata.id);
    joke.votes[votedata.change]++;

    updateJokes();
  });
});
