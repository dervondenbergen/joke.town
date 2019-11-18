const connectionTarget = new URL(window.location.origin);
connectionTarget.port = IOPORT;
var socket = io(connectionTarget.origin);
var currentjoke = null;

socket.on("joke", joke => {
  currentjoke = joke;
});
socket.on("clear", () => {
  currentjoke = null;
});

document.querySelector(".down").addEventListener("click", () => {
  if (currentjoke) {
    socket.emit("vote", { id: currentjoke.id, change: "down" });
  }
});

document.querySelector(".up").addEventListener("click", () => {
  if (currentjoke) {
    socket.emit("vote", { id: currentjoke.id, change: "up" });
  }
});

function resizeScreen() {
  const screen = document.querySelector(".screen");

  const screenHeight = 1600;
  const screenWidth = 908;

  const { innerHeight, innerWidth } = window;

  console.log({ screenHeight, screenWidth, innerHeight, innerWidth });
  console.log("s", screenHeight / screenWidth);
  console.log("w", innerHeight / innerWidth);

  const h = innerHeight / screenHeight;
  const w = innerWidth / screenWidth;

  console.log("h", h);
  console.log("w", w);

  if (h < w) {
    screen.style.transform = `translate(-50%, -50%) scale(${h})`;
  } else {
    screen.style.transform = `translate(-50%, -50%) scale(${w})`;
  }
}

window.addEventListener("resize", resizeScreen);
window.addEventListener("load", resizeScreen);
