var currentjoke = {};
var socket = io(window.location.origin);

socket.on("joke", function(joke) {
  currentjoke = joke;
  showJoke();
});

window.onkeyup = keyboardVote;

function keyboardVote(keyevent) {
  switch (keyevent.key) {
    case "ArrowLeft":
      socket.emit("vote", { id: currentjoke.id, change: "down" });
      currentjoke.votes.down++;
      break;
    case "ArrowRight":
      socket.emit("vote", { id: currentjoke.id, change: "up" });
      currentjoke.votes.up++;
      break;
  }

  showJoke();
}

function showJoke() {
  totalvotes = currentjoke.votes.down + currentjoke.votes.up;

  user_field.textContent = currentjoke.user;
  text_field.textContent = currentjoke.text;

  upPercentage = Math.floor((currentjoke.votes.up / totalvotes) * 100);

  upvotes_bar.style.width = `${upPercentage}%`;
  downvotes_bar.style.width = `${100 - upPercentage}%`;

  upvotes_bar.textContent = currentjoke.votes.up;
  downvotes_bar.textContent = currentjoke.votes.down;
}
