import {
  getFirestore,
  collection,
  getDocs,
  doc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";


const db = getFirestore();
const auth = getAuth();

const monthYearElement = document.getElementById("monthYear");
const datesElement = document.getElementById("dates");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentDate = new Date();
let focusData = {};

// My calendar
function updateCalendar() {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = lastDay.getDate();
  const firstDayIndex = firstDay.getDay();
  const lastDayIndex = lastDay.getDay();

  const monthYearString = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  monthYearElement.textContent = monthYearString;

  let datesHtml = "";

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDate = new Date(currentYear, currentMonth, -i);
    datesHtml += `<div class="date inactive">${prevDate.getDate()}</div>`;
  }

  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(currentYear, currentMonth, i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const activeClass =
      date.toDateString() === new Date().toDateString() ? "active" : "";
    datesHtml += `<div class="date ${activeClass}" data-date="${dateString}">${i}</div>`;
  }

  for (let i = 1; i <= 6 - lastDayIndex; i++) {
    const nextDate = new Date(currentYear, currentMonth + 1, i);
    datesHtml += `<div class="date inactive">${nextDate.getDate()}</div>`;
  }

  datesElement.innerHTML = datesHtml;

  document.querySelectorAll(".date[data-date]").forEach((dateEl) => {
    dateEl.addEventListener("click", () => {
      const dateString = dateEl.getAttribute("data-date");
      onDayClick(dateString);
    });
  });
}

function onDayClick(dateString) {
  const minutes = focusData[dateString] || 0;
  document.getElementById("selectedDay").textContent = `Date: ${dateString}`;
  document.getElementById("focusedTime").textContent = `Focused time: ${minutes} minutes`;
}

prevBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCalendar();
});

nextBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendar();
});

// Load focus data on login
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const uid = user.uid;
  const focusRef = collection(db, "users", uid, "focusHistory");
  const snapshot = await getDocs(focusRef);

  let totalMinutes = 0;
  const focusData = {};

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const dateKey = docSnap.id;
    focusData[dateKey] = data.focusTime || 0;
    totalMinutes += data.focusTime || 0;
  });

  document.getElementById("totalFocusTime").textContent =
    `Total focus time: ${totalMinutes} minutes`;

  updateCalendar();

  const grid = document.querySelector(".gridGit");
  if (!grid) {
    console.error("Grid container not found");
    return;
  }

  grid.innerHTML = ""; // Clear old boxes

  const today = new Date();
  const pastYear = new Date();
  pastYear.setFullYear(today.getFullYear() - 1);

  for (let i = 0; i < 365; i++) {
    const date = new Date(pastYear);
    date.setDate(pastYear.getDate() + i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;
    const minutes = focusData[dateString] || 0;

    const box = document.createElement("div");
    const levelClass = getLevelClass(minutes);
    
    box.className = `grid-box ${levelClass}`;
    box.title = `${dateString}: ${minutes} min`;

    grid.appendChild(box);
  }

  function getLevelClass(minutes) {
    if (minutes >= 180) return "level-4";
    if (minutes >= 120) return "level-3";
    if (minutes >= 10) return "level-2";
    if (minutes > 0) return "level-1";
    return "";
  }
});

});

const randomMotivationalQuotes = ["You are capable of amazing things.", "You will die one day, but your work will live on.", "Believe in yourself and all that you are.", "Your only limit is your mind.", "Dream it. Wish it. Do it.", 
  "Explore Memorize and Internilze.", "The future depends on what you do today.", "Success is not for the lazy.", "You are stronger than you think.", "Push yourself, because no one else is going to do it for you."
];

document.addEventListener("DOMContentLoaded", () => {
  const modalRandomMessage = document.getElementById("randomMessageModal");
  const closeBtn = document.querySelector('#randomMessageModal .close');
  const modalTriggers = document.querySelectorAll('[data-open-random-message]');
  const quoteElement = document.querySelector('#randomMessageModal p');

  function getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * randomMotivationalQuotes.length);
    return randomMotivationalQuotes[randomIndex];
  }

  function openModal() {
    modalRandomMessage.style.display = 'block';
    document.body.style.overflow = 'hidden';
    quoteElement.textContent = getRandomQuote();
  }
  function closeModal() {
    modalRandomMessage.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', openModal);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  } 
  window.addEventListener('click', function(event) {
    if (event.target === modalRandomMessage) {
      closeModal();
    }
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modalRandomMessage.style.display === 'block') {
      closeModal();
    }
  });
});
// Leaderboard

async function loadLeaderboard() {
  const leaderboardContainer = document.getElementById("leaderboard");
  leaderboardContainer.innerHTML = "<h3>Leaderboard</h3>";

  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    const leaderboardData = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const focusHistoryRef = collection(db, "users", userId, "focusHistory");
      const focusSnap = await getDocs(focusHistoryRef);

      let totalMinutes = 0;
      focusSnap.forEach(doc => {
        const data = doc.data();
        totalMinutes += data.focusTime || 0;
      });

      leaderboardData.push({
        name: userData.name || "Anonymous",
        totalFocusTime: totalMinutes
      });
    }
  

    // Sort users by total focus time
    leaderboardData.sort((a, b) => b.totalFocusTime - a.totalFocusTime);
  

   // Display top 10
    leaderboardData.slice(0, 10).forEach((entry, index) => {
      const entryDiv = document.createElement("div");
      entryDiv.className = "leaderboard-entry";
      
      const rankSpan = document.createElement("span");
      rankSpan.className = "entry-rank";
      rankSpan.textContent = `${index + 1}.`;
      
      const nameSpan = document.createElement("span");
      nameSpan.className = "entry-name";
      nameSpan.textContent = entry.name || "Anonymous";
      
      const timeSpan = document.createElement("span");
      timeSpan.className = "entry-time";
      timeSpan.textContent = ` ${entry.totalFocusTime || 0} min`;
      
      entryDiv.append(rankSpan, nameSpan, timeSpan);
      leaderboardContainer.appendChild(entryDiv);
    });
  }
  catch (error) {
    console.error("Error loading leaderboard:", error);
    leaderboardContainer.innerHTML += "<div class='leaderboard-error'>Failed to load leaderboard.</div>";
  }
}

// Call loadLeaderboard on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  loadLeaderboard();
});



