
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut
  } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import {
    getFirestore,
    doc,
    collection,
    getDoc,
    getDocs,
    setDoc,
    runTransaction,
    addDoc,
    updateDoc,
    Timestamp
  } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  
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

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let currentUser = null;
  let countdownInterval;
  let sessionStartTime = null;
  let remainingSeconds = 0;
  const defaultMinutes = 25;

  document.addEventListener('DOMContentLoaded', () => {
    setupUIListeners();
    setupAuthStateListener();
  });

  function setupUIListeners() {
    const loginModal = document.getElementById("loginModal");
    const signupModal = document.getElementById("signupModal");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const passwordError = document.getElementById("password-error");

    const closeModals = () => {
      loginModal.style.display = "none";
      signupModal.style.display = "none";
    };

    loginBtn?.addEventListener("click", e => {
      e.preventDefault();
      loginModal.style.display = "block";
    });

    signupBtn?.addEventListener("click", e => {
      e.preventDefault();
      signupModal.style.display = "block";
      passwordError.style.display = "none";
    });

    document.querySelectorAll(".close").forEach(icon => {
      icon.addEventListener("click", closeModals);
    });

    window.addEventListener("click", e => {
      if (e.target === loginModal || e.target === signupModal) closeModals();
    });

    document.getElementById("confirm-password")?.addEventListener("input", function () {
      const password = document.getElementById("signup-password").value;
      passwordError.style.display = this.value && password !== this.value ? "block" : "none";
    });

    document.getElementById("signupForm")?.addEventListener("submit", async e => {
      e.preventDefault();
      const password = document.getElementById("signup-password").value;
      const confirm = document.getElementById("confirm-password").value;

      if (password !== confirm) {
        passwordError.style.display = "block";
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          document.getElementById("signup-email").value,
          password
        );
        await updateProfile(userCredential.user, {
          displayName: document.getElementById("username").value
        });
        closeModals();
        alert("Account created successfully!");
      } catch (err) {
        alert("Signup error: " + err.message);
      }
    });

    document.getElementById("loginForm")?.addEventListener("submit", async e => {
      e.preventDefault();
      try {
        await signInWithEmailAndPassword(
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

    document.getElementById("startTimeBtn").addEventListener("click", () => {
      const minutes = parseInt(document.getElementById("minutes").textContent);
      if (!isNaN(minutes) && minutes > 0) startTimer(minutes);
    });

    document.getElementById("customTimeButton").addEventListener("click", () => {
      const customMinutes = parseInt(document.getElementById("customMinutes").value);
      if (!isNaN(customMinutes) && customMinutes > 0) {
        updateDisplay(customMinutes, 0);
      }
    });

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      signOut(auth).catch(error => {
        console.error("Logout error:", error);
      });
    });
  }

  function setupAuthStateListener() {
    onAuthStateChanged(auth, user => {
      currentUser = user;
      const loggedOutButtons = document.getElementById("loggedOutButtons");
      const loggedInUser = document.getElementById("loggedInUser");

      if (user) {
        console.log("User signed in:", user.uid);
        if (loggedOutButtons) loggedOutButtons.style.display = "none";
        if (loggedInUser) {
          loggedInUser.style.display = "block";
          const usernameDisplay = document.getElementById("usernameDisplay");
          if (usernameDisplay) usernameDisplay.textContent = user.displayName;
        }
        loadPlants();
      } else {
        console.log("No user signed in.");
        if (loggedOutButtons) loggedOutButtons.style.display = "block";
        if (loggedInUser) loggedInUser.style.display = "none";
      }
    });
  }

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
        growPlant();
        alert("Pomodoro complete! Time to grow your plant!");
        return;
      }
      remainingSeconds--;
      updateDisplay(Math.floor(remainingSeconds / 60), remainingSeconds % 60);
    }, 1000);
  }

  window.pauseTimer = () => clearInterval(countdownInterval);
  window.resetTimer = () => {
    clearInterval(countdownInterval);
    updateDisplay(defaultMinutes, 0);
  };

  function saveFocusSession(startTime, endTime, durationMinutes) {
    const userId = currentUser?.uid;
    if (!userId) return console.error("User not authenticated!");

    const sessionRef = collection(db, "users", userId, "focusSessions");
    const sessionData = {
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      durationMinutes,
      dateKey: startTime.toISOString().split("T")[0],
    };

    addDoc(sessionRef, sessionData)
      .then(() => console.log("Focus session saved."))
      .catch(err => console.error("Error saving session:", err));
  }

  function saveDailyFocus(minutes) {
    const userId = currentUser?.uid;
    if (!userId) return console.error("User not authenticated!");

    const today = new Date().toISOString().split("T")[0];
    const focusRef = doc(db, "users", userId, "focusHistory", today);

    runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(focusRef);
      const current = docSnap.exists() ? docSnap.data().focusTime : 0;
      transaction.set(focusRef, { focusTime: current + minutes }, { merge: true });
    })
      .then(() => console.log("Daily focus time saved!"))
      .catch(error => console.error("Error saving focus time:", error));
  }


// STUFF TO SAVE PLANTS and load plants
// STUFF TO SAVE PLANTS and load plants
async function loadPlants() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const uid = user.uid;
    const snapshot = await getDocs(collection(db, "users", uid, "plants"));

    snapshot.forEach(doc => {
      const plant = doc.data();
      renderPlant(plant, doc.id); 
    });
  } catch (error) {
    console.error("Error loading plants:", error);
  }
}

function renderPlant(plant, docId) {
  const plantElement = document.createElement("div");
  plantElement.className = `plant-icon ${plant.type}`;
  plantElement.id = `plant-${docId}`;
  plantElement.dataset.docId = docId;
  plantElement.setAttribute("draggable", "true");
  plantElement.addEventListener("dragstart", dragStart);

  const inventory = document.getElementById("inventoryModal");

  if (plant.isInInventory) {
    if (inventory) {
      inventory.appendChild(plantElement);
    } else {
      console.error("Inventory not found");
    }
  } else {
    const tile = document.querySelector(`.tile[data-x="${plant.position.x}"][data-y="${plant.position.y}"]`);
    if (tile) {
      tile.appendChild(plantElement);
    } else {
      console.error(`Tile not found at ${plant.position.x},${plant.position.y}`);
    }
  }
}

function growPlant() {
  const plantTypes = ['flower', 'tree', 'bush', 'cactus', 'flower2'];
  const randomType = plantTypes[Math.floor(Math.random() * plantTypes.length)];

  const plantData = {
    type: randomType,
    plantedAt: new Date().toISOString(),
    position: { x: -1, y: -1 }, 
    isInInventory: true
  };

  savePlant(plantData);

  const modal = document.getElementById('inventoryModal');
  if (modal) modal.style.display = 'block';
}

async function savePlant(plantData) {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated");
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "users", user.uid, "plants"), plantData);
    renderPlant(plantData, docRef.id); // Render after successful save
  } catch (err) {
    console.error("Error saving plant:", err);
  }
}

function dragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.id);
}

function setupDragAndDrop() {
  // Make tiles accept drops
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('dragover', event => {
      event.preventDefault();
    });

    tile.addEventListener('drop', async function(event) {
      event.preventDefault();

      const plantId = event.dataTransfer.getData("text/plain");
      const plantElement = document.getElementById(plantId);
      if (!plantElement) return;

      const x = tile.dataset.x;
      const y = tile.dataset.y;

      plantElement.dataset.x = x;
      plantElement.dataset.y = y;
      tile.appendChild(plantElement);

      const docId = plantElement.dataset.docId;
      if (!docId) return;

      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user");
        return;
      }

      try {
        const plantRef = doc(db, "users", user.uid, "plants", docId);
        const newPosition = { x: parseInt(x), y: parseInt(y) };
        console.log("Updating plant position:", newPosition);

        await updateDoc(plantRef, {
          position: newPosition,
          isInInventory: false
        });
      } catch (error) {
        console.error("Error updating plant position:", error);
      }
    });
  });

  // Make inventory accept drops
  const inventory = document.getElementById("inventoryModal");
  if (inventory) {
    inventory.addEventListener('dragover', event => {
      event.preventDefault();
    });

    inventory.addEventListener('drop', async function(event) {
      event.preventDefault();

      const plantId = event.dataTransfer.getData("text/plain");
      const plantElement = document.getElementById(plantId);
      if (!plantElement) return;

      inventory.appendChild(plantElement);

      const docId = plantElement.dataset.docId;
      if (!docId) return;

      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user");
        return;
      }

      try {
        const plantRef = doc(db, "users", user.uid, "plants", docId);
        console.log("Moving plant to inventory");

        await updateDoc(plantRef, {
          isInInventory: true,
          position: { x: -1, y: -1 }
        });
      } catch (error) {
        console.error("Error moving plant to inventory:", error);
      }
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  setupDragAndDrop();
  loadPlants();
});

