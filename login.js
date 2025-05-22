import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { 
      getAuth, 
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      updateProfile
    } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
    
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCiPV6KfHOKiV7Sgqp0EJzo5GjbnlTwOyQ",
  authDomain: "pomodoro-garden-d8a0e.firebaseapp.com",
  projectId: "pomodoro-garden-d8a0e",
  storageBucket: "pomodoro-garden-d8a0e.appspot.com",
  messagingSenderId: "669728207501",
  appId: "1:669728207501:web:4ee7ee5feca6f2cf2868c4",
  measurementId: "G-SDZN9QN2T0"
};

import {
      getFirestore,
      doc,
      collection,
      getDoc,
      setDoc,
      runTransaction,
      addDoc,
      Timestamp
    } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";


    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Make auth available globally
    window.auth = auth;
    window.firebaseAuth = {
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      updateProfile
    };
    
    window.db = db; 


let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User signed in:", user.uid);
    currentUser = user;
  } else {
    console.log("No user is signed in.");
    currentUser = null;
  }
});


document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const passwordError = document.getElementById("password-error");

  // Close modals function
  const closeModals = () => {
    loginModal.style.display = "none";
    signupModal.style.display = "none";
  };

  // Open modals
  loginBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.style.display = "block";
  });

  signupBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    signupModal.style.display = "block";
    passwordError.style.display = "none";
  });

  // Close modals
  document.querySelectorAll(".close").forEach(icon => {
    icon.addEventListener("click", closeModals);
  });

  window.addEventListener("click", (e) => {
    if (e.target === loginModal || e.target === signupModal) closeModals();
  });

  // Password match check
  document.getElementById("confirm-password")?.addEventListener("input", function() {
    const password = document.getElementById("signup-password").value;
    passwordError.style.display = this.value && password !== this.value ? "block" : "none";
  });

  // Signup form
  document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("confirm-password").value;

    if (password !== confirm) {
      passwordError.style.display = "block";
      return;
    }

    try {
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(
        auth,
        document.getElementById("signup-email").value,
        password
      );

      await firebaseAuth.updateProfile(userCredential.user, {
        displayName: document.getElementById("username").value
      });

      closeModals();
      alert("Account created successfully!");
    } catch (err) {
      alert("Signup error: " + err.message);
    }
  });

  // Login form
  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    
    e.preventDefault();
    try {
      await firebaseAuth.signInWithEmailAndPassword(
        auth,
        document.getElementById("login-email").value,
        document.getElementById("login-password").value
      );
      closeModals();
      alert("Login successful!");
    } catch (err) {
      alert("Login error: " + err.message);
    }
  });
});
onAuthStateChanged(auth, (user) => {
  const loggedOutButtons = document.getElementById('loggedOutButtons');
  const loggedInUser = document.getElementById('loggedInUser');
  const usernameDisplay = document.getElementById('usernameDisplay');

  if (user) {
    console.log("User is logged in:", user);
    loggedOutButtons.style.display = 'none';
    loggedInUser.style.display = 'flex'; // or 'block', depending on your layout
    usernameDisplay.textContent = user.displayName || user.email.split('@')[0];

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      signOut(auth).catch((error) => {
        console.error('Logout error:', error);
      });
    });
  } else {
    console.log("User is logged out.");
    loggedOutButtons.style.display = 'block';
    loggedInUser.style.display = 'none';
  }
});

// CODE TO TRACK TIME SPENT ON THE FOCUSING

let countdownInterval;
let sessionStartTime = null;
let remainingSeconds = 0;

// 👂 When page is loaded
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startTimeBtn").addEventListener("click", () => {
    const minutes = parseInt(document.getElementById("minutes").textContent);
    if (!isNaN(minutes) && minutes > 0) {
      startTimer(minutes);
    }
  });

  document.getElementById("customTimeButton").addEventListener("click", () => {
    const customMinutes = parseInt(document.getElementById("customMinutes").value);
    if (!isNaN(customMinutes) && customMinutes > 0) {
      document.getElementById("minutes").textContent = String(customMinutes).padStart(2, "0");
      document.getElementById("seconds").textContent = "00";
    }
  });

  // Login state check (optional, for username display, etc.)
  onAuthStateChanged(auth, user => {
    if (user) {
      document.getElementById("loggedOutButtons").style.display = "none";
      document.getElementById("loggedInUser").style.display = "block";
      document.getElementById("usernameDisplay").textContent = user.displayName;
    } else {
      document.getElementById("loggedOutButtons").style.display = "block";
      document.getElementById("loggedInUser").style.display = "none";
    }
  });
});

function updateDisplay(min, sec) {
  document.getElementById("minutes").textContent = String(min).padStart(2, "0");
  document.getElementById("seconds").textContent = String(sec).padStart(2, "0");
}

function startTimer(minutes) {
  clearInterval(countdownInterval);
  remainingSeconds = minutes * 60;
  sessionStartTime = new Date();

  countdownInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      clearInterval(countdownInterval);
      const sessionEndTime = new Date();
      const durationMinutes = Math.round((sessionEndTime - sessionStartTime) / 60000);
      saveFocusSession(sessionStartTime, sessionEndTime, durationMinutes);
      saveDailyFocus(durationMinutes);
      return;
    }
    remainingSeconds--;
    updateDisplay(Math.floor(remainingSeconds / 60), remainingSeconds % 60);
  }, 1000);
}

window.pauseTimer = function () {
  clearInterval(countdownInterval);
};

window.resetTimer = function () {
  clearInterval(countdownInterval);
  updateDisplay(25, 0); // reset to default
};

function saveFocusSession(startTime, endTime, durationMinutes) {
  const userId = currentUser?.uid;
  if (!userId) {
    console.error("User not authenticated!");
    return;
  }
  const sessionData = {
    startTime: Timestamp.fromDate(startTime),
    endTime: Timestamp.fromDate(endTime),
    durationMinutes,
    dateKey: startTime.toISOString().split("T")[0],
  };

  const sessionRef = collection(db, "users", userId, "focusSessions");
  addDoc(sessionRef, sessionData)
    .then(() => console.log("Focus session saved."))
    .catch((err) => console.error("Error saving session:", err));
}

function saveDailyFocus(minutes) {
  const userId = currentUser?.uid;
  if (!userId) {
    console.error("User not authenticated!");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const focusRef = doc(db, "users", userId, "focusHistory", today);

  runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(focusRef);
    const current = docSnap.exists() ? docSnap.data().focusTime : 0;
    transaction.set(focusRef, { focusTime: current + minutes }, { merge: true });
  })
    .then(() => console.log("Daily focus time saved!"))
    .catch((error) => console.error("Error saving focus time:", error));
}
