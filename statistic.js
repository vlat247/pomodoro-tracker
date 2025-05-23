import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;
    const focusRef = collection(db, "users", uid, "focusHistory");
    const snapshot = await getDocs(focusRef);

    const focusData = {};
    snapshot.forEach(doc => {
      focusData[doc.id] = doc.data().minutesFocused;
    });

    updateCalendar(focusData);
  }
});


//caledar
const monthYearElement = document.getElementById("monthYear");
const datesElement = document.getElementById('dates');
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentDate = new Date();

const updateCalendar = () => {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const firstDay = new Date(currentYear, currentMonth, 0);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = lastDay.getDate();
  const firstDayIndex = firstDay.getDay();
  const lastDayIndex = lastDay.getDay(); 

  const monthYearString = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  monthYearElement.textContent = monthYearString;

  let datesHtml = "";

  for (let i = firstDayIndex - 1; i >= 0; i--) {
  const prevDate = new Date(currentYear, currentMonth, -i);
  datesHtml += `<div class="date inactive">${prevDate.getDate()}</div>`;
  }

  for (let i = firstDayIndex - 1; i >= 0; i--) {
  const prevDate = new Date(currentYear, currentMonth, -i);
  datesHtml += `<div class="date inactive">${prevDate.getDate()}</div>`;
  }

  for(let i = 1; i<=totalDays; i++) {
    const date = new Date(currentYear, currentMonth, i);
    const activeClass = date.toDateString() === new Date().
    toDateString() ? 'active' : '';
    datesHtml += `<div class="date ${activeClass}">${i}</div>`;
  }

  for(let i = 1; i <= 7 - lastDayIndex; i++) {
    const nextDate = new Date(currentYear, currentMonth + 1, i);
    datesHtml += `<div class="date inactive">${nextDate.getDate()}</div>`;
  }

  datesElement.innerHTML = datesHtml;

}

prevBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() -1);
  updateCalendar();
})

nextBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendar();
})
