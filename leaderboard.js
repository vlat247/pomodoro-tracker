import {
  getFirestore,
  collection,
  getDocs,
  doc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

  // Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCiPV6KfHOKiV7Sgqp0EJzo5GjbnlTwOyQ",
    authDomain: "pomodoro-garden-d8a0e.firebaseapp.com",
    projectId: "pomodoro-garden-d8a0e",
    storageBucket: "pomodoro-garden-d8a0e.appspot.com",
    messagingSenderId: "669728207501",
    appId: "1:669728207501:web:4ee7ee5feca6f2cf2868c4",
    measurementId: "G-SDZN9QN2T0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

async function loadBigLeaderboard() {
    console.log("✅ loadBigLeaderboard() is running");
    const type = document.getElementById("leaderboardType").value;
    const container = document.getElementById("bigLeaderboardContainer");
    container.innerHTML = "<h3>Loading leaderboard...</h3>";

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const leaderboardData = [];

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const focusSnap = await getDocs(collection(db, "users", userId, "focusHistory"));
        let totalMinutes = 0;

        focusSnap.forEach(doc => {
          const data = doc.data();
          const focusTime = data.focusTime || 0;
          const timestamp = data.timestamp?.toDate?.();
          if (!timestamp) return;

          const isInPeriod =
            (type === "day" && timestamp >= startOfDay) ||
            (type === "week" && timestamp >= startOfWeek);

          if (isInPeriod) {
            totalMinutes += focusTime;
          }
        });

        leaderboardData.push({
          name: userData.name || "Anonymous",
          totalFocusTime: totalMinutes
        });
      }

      leaderboardData.sort((a, b) => b.totalFocusTime - a.totalFocusTime);

      container.innerHTML = `<h3>Top 10 (${type})</h3>`;

      leaderboardData.slice(0, 10).forEach((entry, index) => {
        const div = document.createElement("div");
        div.className = "leaderboard-entry";
        div.textContent = `${index + 1}. ${entry.name} - ${entry.totalFocusTime} min`;
        container.appendChild(div);
      });

      if (leaderboardData.length === 0) {
        container.innerHTML += "<p>No data for this period.</p>";
      }

      console.log("✅ loadBigLeaderboard script loaded");

      console.log("✅ Rendered leaderboard:", leaderboardData);
    } catch (err) {
      console.error("❌ Leaderboard Error:", err);
      container.innerHTML = "<p>Failed to load leaderboard.</p>";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadBigLeaderboard();
    document.getElementById("leaderboardType").addEventListener("change", loadBigLeaderboard);
  });

  console.log("✅ loadBigLeaderboard script loaded");
