import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "firebase/firestore";    
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

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // Make auth available globally
    window.auth = auth;
    window.firebaseAuth = {
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      updateProfile
    };


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
