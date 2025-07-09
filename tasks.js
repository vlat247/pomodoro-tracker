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
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
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

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  


//DARK THEME 
document.getElementById("themeToggle").addEventListener("click", () => {
document.body.classList.toggle("dark-theme");

  
  const isDark = document.body.classList.contains("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// checkboxes system to chose all and star system to make them look more appealing
let selectedStars = 0;
const stars = document.querySelectorAll('#importanceContainer .star');

stars.forEach((star, index) => {
  star.addEventListener('click', () => {
    stars.forEach((s, i) => {
      s.classList.toggle('filled', i <= index);
    });
  });

  star.addEventListener('mouseleave', () => {
    stars.forEach((s) => s.classList.remove('hovered'));
  });
});





// function to save 
window.addEventListener('load', function() {
  const list = document.getElementById('dynamicallyCreatedTasks');
  const taskBtn = document.getElementById('createTaskBtn');

  taskBtn.addEventListener('click', async () => {
    const taskName = prompt().trim();
    const user = auth.currentUser;


    if(!user) return this.alert("You must be logged in!");
    if (!taskName) return this.alert("It cannot be empty");

    try {
      const taskRef = collection(db, "users", user.uid, "tasks");
      await addDoc(taskRef, {
        name: taskName,
        stars: selectedStars
      })

      console.log(`"Task added "${taskName}`);
      loadTasks();
    } catch (err) {
      console.error("Error adding subject:", err);
    }
  });
  
  // Initial load
  loadTasks();
});

async function loadTasks() {
    const user = auth.currentUser;
    if (!user) return;
    const list = document.getElementById('dynamicallyCreatedTasks');
  
    const taskRef = collection(db, "users", user.uid, "tasks");

    try {
      const querySnapshot = await getDocs(taskRef);
      list.innerHTML = ''; // Clear old tasks

      querySnapshot.forEach(doc => {
        const task = doc.data();

        const taskItem = document.createElement("div");
        taskItem.classList.add("taskName")
        taskItem.textContent = task.name + ' ' + '★'.repeat(task.stars || 0);

        const taskDelete = document.createElement("button");
        taskDelete.classList.add("deleteTask")
        taskDelete.textContent.add("Remove")

        taskDelete.addEventListener('onclick', async () => {
          try {
            await deleteDoc (doc.ref);
            taskItem.remove();
          } catch (err) {
            console.error("failed to delete", err);
          }
        });

        const wraper

        list.appendChild(taskItem);
      });
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
  }

document.addEventListener('DOMContentLoaded', function() {
  loadTasks();
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadTasks();
  }
});
