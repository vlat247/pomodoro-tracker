
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
    Timestamp,
    deleteDoc
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

  window.auth = auth;
  window.db = db;
 
 
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
    const email = document.getElementById("signup-email").value;
    const username = document.getElementById("username").value;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Set display name in auth profile
    await updateProfile(userCredential.user, {
      displayName: username
    });

    // Save username in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name: username,
      totalFocusTime: 0
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

  const modal = document.getElementById('inventory-grid');
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
  // Make all tiles droppable
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('dragover', event => event.preventDefault());

    tile.addEventListener('drop', async function (event) {
      event.preventDefault();
      const plantId = event.dataTransfer.getData("text/plain");
      const plantElement = document.getElementById(plantId);
      if (!plantElement) return;

      const inventoryGrid = document.querySelector(".inventory-grid");
      if (inventoryGrid.contains(plantElement)) {
        inventoryGrid.removeChild(plantElement);
      }

      tile.innerHTML = ''; // Clear existing plant
      tile.appendChild(plantElement);

      const docId = plantElement.dataset.docId;
      const x = tile.dataset.x;
      const y = tile.dataset.y;
      const user = auth.currentUser;
      if (!user || !docId) return;

      try {
        const plantRef = doc(db, "users", user.uid, "plants", docId);
        await updateDoc(plantRef, {
          position: { x: parseInt(x), y: parseInt(y) },
          isInInventory: false
        });
      } catch (error) {
        console.error("Error placing plant on tile:", error);
      }
    });
  });

  // Inventory drop
  const inventory = document.querySelector(".inventory-grid");

  inventory.addEventListener("dragover", event => event.preventDefault());

  inventory.addEventListener("drop", async function (event) {
    // Ignore if dropping on exchange
    if (event.target.closest("#exchangeGrid")) {
      console.log("Ignored inventory drop: it's on exchange grid");
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const plantId = event.dataTransfer.getData("text/plain");
    const plantElement = document.getElementById(plantId);
    if (!plantElement) return;

    const parentTile = plantElement.closest(".tile");
    if (parentTile) parentTile.innerHTML = '';

    inventory.appendChild(plantElement);

    const docId = plantElement.dataset.docId;
    const user = auth.currentUser;
    if (!user || !docId) return;

    try {
      const plantRef = doc(db, "users", user.uid, "plants", docId);
      await updateDoc(plantRef, {
        position: { x: -1, y: -1 },
        isInInventory: true
      });
    } catch (error) {
      console.error("Error returning plant to inventory:", error);
    }
  });

  // Exchange drop
  let plantToExchange = null;
  const exchange = document.getElementById("exchangeGrid");

  if (exchange) {
    exchange.addEventListener("dragover", event => event.preventDefault());

    exchange.addEventListener("drop", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const plantId = event.dataTransfer.getData("text/plain");
      const plantElement = document.getElementById(plantId);
      if (!plantElement) return;

      plantToExchange = plantElement;
      exchange.innerHTML = ''; // Remove existing plant
      exchange.appendChild(plantElement);
    });
  }

  // Exchange button logic
  document.getElementById("exchangePlantButton").addEventListener("click", async () => {
    if (!plantToExchange) return;

    const docId = plantToExchange.dataset.docId;
    const user = auth.currentUser;
    if (!user || !docId) return;

    try {
      const plantRef = doc(db, "users", user.uid, "plants", docId);
      await deleteDoc(plantRef);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const currentMoney = userSnap.exists() ? userSnap.data().money || 0 : 0;
      const newMoney = currentMoney + 50;
      

      await updateDoc(userRef, { money: newMoney });
      document.getElementById("moneyAmount").textContent = newMoney;
      alert("Your plant was destroyed you recieve 50 coins")

      plantToExchange.remove();
      exchange.innerHTML = '';
      plantToExchange = null;
    } catch (error) {
      console.error("Error during exchange:", error);
    }
  });
}

// Call it after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setupDragAndDrop();
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

window.addEventListener("DOMContentLoaded", () => {
  setupDragAndDrop();
  loadPlants();
});

//EMPORIUM 
document.addEventListener('DOMContentLoaded', function() {
  const modalEmporium = document.getElementById("emporiumModal");
  const closeBtn = document.querySelector('#emporiumModal .close');
  const modalTriggers = document.querySelectorAll('[data-open-emporium]');
  const moneyDisplay = document.getElementById("moneyAmount");
  const buyButtons = document.querySelectorAll('.buy-button');




    buyButtons.forEach(button => {
      button.addEventListener('click', async function () {
        const itemCost = parseInt(this.getAttribute('data-price'));
        const itemType = this.getAttribute('data-plant-type'); // or data-plant-type if you renamed it

        try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to buy a plant.");
        return;
      }

      const plantData = {
        type: itemType,
        plantedAt: new Date().toISOString(),
        position: { x: -1, y: -1 },
        isInInventory: true
      };

      const docRef = await addDoc(collection(db, "users", user.uid, "plants"), plantData);

      // NOW update money since plant was saved
      playerMoney -= itemCost;
      await updateUserMoney(user.uid, playerMoney);
      updateMoneyDisplay();

      renderPlant(plantData, docRef.id);
      alert("Item purchased and saved to inventory!");

    } catch (error) {
      console.error("Error saving purchased plant:", error);
      alert("Failed to save plant to inventory.");
    }

  });
});


  function openModal() {
    modalEmporium.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modalEmporium.style.display = 'none';
    document.body.style.overflow = '';
  }
 


  function updateMoneyDisplay() {
    document.getElementById("moneyAmount").textContent = playerMoney;
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
    if (event.target === modalEmporium) {
      closeModal();
    }
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modalEmporium.style.display === 'block') {
      closeModal();
    }
  });
});

//Money function
function updateMoneyDisplay() {
      document.getElementById("moneyAmount").textContent = playerMoney;
    }

async function loadUserMoney(userId) {
  const userDocRef = doc(db, "users", userId);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return data.money || 0;
  } else {
    await setDoc(userDocRef, { money: 100 }); 
    return 100;
  }
}

let playerMoney = 0; // Or get from user data
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const Money = await loadUserMoney(user.uid);
    playerMoney = Money;
    updateMoneyDisplay();
  }
});
async function updateUserMoney(userId, newMoneyAmount) {
  const userDocRef = doc(db, "users", userId);
  await setDoc(userDocRef, { money: newMoneyAmount }, { merge: true });
}

