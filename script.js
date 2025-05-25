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


//my description modal
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById("descriptionModal");
  const closeBtn = document.querySelector('#descriptionModal .close');
  const modalTriggers = document.querySelectorAll('[data-open-modal]');

  function openModal() {
    modal.style.display = 'block'
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (modalTriggers) {
    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', openModal);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      closeModal();
    }
  });
});

//My modal for inventory
// This modal is for the inventory, which is opened by clicking on the inventory button

document.addEventListener('DOMContentLoaded', function() {
  const modalInventory = document.getElementById("inventoryModal");
  const closeBtn = document.querySelector('#inventoryModal .close');
  const modalTriggers = document.querySelectorAll('[data-open-inventory]');
  const inventoryBtn = document.getElementById("invent-button"); 

  function openModal() {
    modalInventory.style.display = 'block';
    document.body.style.overflow = 'hidden';
    inventoryBtn.style.display = 'none'; 
  }

  function closeModal() {
    modalInventory.style.display = 'none';
    document.body.style.overflow = '';
    inventoryBtn.style.display = 'block';
  }

  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', openModal);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  window.addEventListener('click', function(event) {
    if (event.target === modalInventory) {
      closeModal();
    }
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modalInventory.style.display === 'block') { 
      closeModal();
    }
  });
});

