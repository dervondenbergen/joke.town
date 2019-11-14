var currentjoke = {};
var socket = io(window.location.origin);

socket.on("joke", function(joke) {
  currentjoke = joke;
  showJoke();
});

socket.on("clear", clear);
function clear() {
  nojoke.classList.remove("hidden");
  votes.classList.add("hidden");
  newjoke.classList.add("hidden");
  description.classList.add("hidden");

  currentjoke = null;
}

window.onkeyup = keyboardVote;

function keyboardVote(keyevent) {
  if (currentjoke) {
    switch (keyevent.key) {
      case "ArrowLeft":
        socket.emit("vote", { id: currentjoke.id, change: "down" });
        break;
      case "ArrowRight":
        socket.emit("vote", { id: currentjoke.id, change: "up" });
        break;
    }
  }
}

socket.on("jokevotes", function(joke) {
  if (joke.id === currentjoke.id) {
    currentjoke.votes = joke.votes;
    updateVoteBar();
  }
});

function showJoke() {
  nojoke.classList.add("hidden");
  votes.classList.remove("hidden");
  newjoke.classList.remove("hidden");
  description.classList.remove("hidden");

  updateVoteBar();
}

function updateVoteBar() {
  totalvotes = currentjoke.votes.down + currentjoke.votes.up;

  user_field.textContent = currentjoke.user;
  text_field.textContent = currentjoke.text;

  upPercentage = Math.floor((currentjoke.votes.up / totalvotes) * 100);

  if (totalvotes === 0) {
    upPercentage = 50;
  }

  upvotes_bar.style.width = `${upPercentage}%`;
  downvotes_bar.style.width = `${100 - upPercentage}%`;

  upvotes_bar.textContent = currentjoke.votes.up;
  downvotes_bar.textContent = currentjoke.votes.down;
}
