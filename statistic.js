import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

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
    const dateString = date.toISOString().split("T")[0]; 
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
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;
    const focusRef = collection(db, "users", uid, "focusHistory");
    const snapshot = await getDocs(focusRef);

    let totalMinutes = 0;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const dateKey = docSnap.id;
      focusData[dateKey] = data.focusTime || 0;
      totalMinutes += data.focusTime || 0;
    });

  
    document.getElementById("totalFocusTime").textContent = `Total focus time: ${totalMinutes} minutes`;

    updateCalendar();
  }
});
