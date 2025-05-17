let minutes = 0;
let seconds = 1;
let timerInterval;
let isRunning = false;

function updateDisplay() {
  document.getElementById("minutes").textContent = String(minutes).padStart(2, '0');
  document.getElementById("seconds").textContent = String(seconds).padStart(2, '0');
}

function setCustomTime() {
  const input = document.getElementById("customMinutes").value;
  const parsed = parseInt(input);
  if (!isNaN(parsed) && parsed > 0) {
    minutes = parsed;
    seconds = 0;
    updateDisplay();
  } else {
    alert("Please enter a valid number of minutes.");
  }
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;

  timerInterval = setInterval(() => {
    if (seconds === 0) {
      if (minutes === 0) {
        clearInterval(timerInterval);
        isRunning = false;
        alert("Pomodoro complete!");
        growPlant(); 
        return;
      } else {
        minutes--;
        seconds = 59;
      }
    } else {
      seconds--;
    }

    updateDisplay();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  isRunning = false;
}

function resetTimer() {
  pauseTimer();
  minutes = 25;
  seconds = 0;
  updateDisplay();
}

function growPlant() {
  const grid = document.getElementById("plant-grid");
  const plant = document.createElement("div");
  plant.classList.add("plant-icon");
  plant.setAttribute("draggable", "true");
  plant.id = "plant-" + Date.now();  
  plant.addEventListener("dragstart", dragStart);
  grid.appendChild(plant);
}


function dragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.id);
}

// THis shit makes all tiles accept drops, when my previos code cover only garden part without each separate tile
document.querySelectorAll('.tile').forEach(tile => {
  tile.addEventListener('dragover', function(event) {
    event.preventDefault();
  });

  tile.addEventListener('drop', function(event) {
    event.preventDefault();
    const plantId = event.dataTransfer.getData("text/plain");
    const plantElement = document.getElementById(plantId);
    if (plantElement) {
      this.appendChild(plantElement); // To drop plant into tile
    }
  });
});

window.addEventListener("DOMContentLoaded", () => {
  // Add drop support to all tiles
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('dragover', event => {
      event.preventDefault();
    });

    tile.addEventListener('drop', event => {
      event.preventDefault();
      const plantId = event.dataTransfer.getData("text/plain");
      const plantElement = document.getElementById(plantId);
      if (plantElement) {
        tile.appendChild(plantElement); 
      }
    });
  });
});