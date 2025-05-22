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

    renderCalendar(focusData);
  }
});

function renderCalendar(focusData) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0 = Jan, 1 = Feb...

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const minutes = focusData[dateStr] || 0;

    const div = document.createElement("div");
    div.classList.add("calendar-day");

    // Add class based on focus level
    if (minutes > 60) div.classList.add("high");
    else if (minutes > 30) div.classList.add("medium");
    else div.classList.add("low");

    div.innerHTML = `<strong>${day}</strong><br>${minutes} min`;
    calendar.appendChild(div);
  }
}
