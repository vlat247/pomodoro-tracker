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
    where
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


onAuthStateChanged(auth, user => {
  if (user) {
    const userId = user.uid;
    console.log("🔐 Logged in as:", userId);

    setupFriendUI(userId);
  } else {
    console.log("❌ Not logged in.");
  }
});

async function sendFriendRequest(currentUserId, targetUserId) {
  const friendRequestsRef = collection(db, "friend_requests");

  const q = query(friendRequestsRef,
    where("from", "==", currentUserId),
    where("to", "==", targetUserId)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    alert("Request already sent.");
    return;
  }

  await addDoc(friendRequestsRef, {
    from: currentUserId,
    to: targetUserId,
    status: "pending",
    timestamp: new Date()
  });

  alert("Friend request sent!");
}

async function respondToRequest(requestId, fromUserId, toUserId, accept = true) {
  const requestRef = doc(db, "friend_requests", requestId);
  await updateDoc(requestRef, {
    status: accept ? "accepted" : "rejected"
  });

  if (accept) {
    const timestamp = new Date();
    await setDoc(doc(db, "users", fromUserId, "friends", toUserId), {
      friendId: toUserId,
      since: timestamp
    });
    await setDoc(doc(db, "users", toUserId, "friends", fromUserId), {
      friendId: fromUserId,
      since: timestamp
    });
  }

  alert(accept ? "Friend request accepted!" : "Request rejected.");
}

async function loadFriendRequests(userId) {
  const q = query(collection(db, "friend_requests"),
    where("to", "==", userId),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Request from ${data.from}`);
    // Render Accept/Reject buttons in your UI
  });
}

async function loadFriends(userId) {
  const snapshot = await getDocs(collection(db, "users", userId, "friends"));

  snapshot.forEach(doc => {
    const friend = doc.data();
    console.log("Friend ID:", friend.friendId);
    // Display name/avatar if needed
  });
}

async function getUserIdByName(name) {
  const q = query(collection(db, "users"), where("name", "==", name));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("User not found");
  }

  const doc = snapshot.docs[0];
  return doc.id; // this is the userId
}

function setupFriendUI(currentUserId) {
  document.getElementById("addFriendButton").addEventListener("click", async () => {
    const targetName = document.getElementById("targetUserNameInput").value.trim();
    if (!targetName) {
      alert("Please enter a name.");
      return;
    }

    try {
      const targetUserId = await getUserIdByName(targetName);
      if (targetUserId === currentUserId) {
        alert("You cannot add yourself.");
        return;
      }

      await sendFriendRequest(currentUserId, targetUserId);
    } catch (err) {
      alert("❌ " + err.message);
    }
  });

  loadFriendRequestsUI(currentUserId);
  loadFriendsUI(currentUserId);
}

async function loadFriendRequestsUI(userId) {
  const container = document.getElementById("friendRequestsContainer");
  container.innerHTML = "<h3>Incoming Friend Requests:</h3>";

  const q = query(collection(db, "friend_requests"),
    where("to", "==", userId),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    container.innerHTML += "<p>No pending requests</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.innerHTML = `
      <p>From: ${data.from}</p>
      <button onclick="handleRespond('${docSnap.id}', '${data.from}', '${data.to}', true)">Accept</button>
      <button onclick="handleRespond('${docSnap.id}', '${data.from}', '${data.to}', false)">Reject</button>
    `;
    container.appendChild(div);
  });
}


async function loadFriendsUI(userId) {
  const container = document.getElementById("friendsList");
  container.innerHTML = "<h3>Your Friends:</h3>";

  const snapshot = await getDocs(collection(db, "users", userId, "friends"));
  if (snapshot.empty) {
    container.innerHTML += "<p>No friends yet.</p>";
    return;
  }

  for (const docSnap of snapshot.docs) {
    const friendId = docSnap.data().friendId;
    const friendDoc = await getDoc(doc(db, "users", friendId));
    const friendName = friendDoc.exists() ? friendDoc.data().name : "Unknown";

    const div = document.createElement("div");
    div.textContent = `${friendName}`;
    container.appendChild(div);
  }
}

//Modal add friends
document.addEventListener("DOMContentLoaded", function() {
  const modal = document.getElementById("addFriendModal");
  const closeBtn = document.querySelector("#addFriendModal .close");
  const modalTriggers = document.querySelectorAll('[data-open-modal]');


  function openModal() {
    modal.style.display = 'block'
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
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
    if (event.target === modal) {
      closeModal();
    }
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      closeModal();
    }
  });
});
document.getElementById("openModal").addEventListener("click", () => {
  document.getElementById("addFriendModal").style.display = "flex";
});

window.handleRespond = async function(requestId, fromUserId, toUserId, accept) {
  try {
    await respondToRequest(requestId, fromUserId, toUserId, accept);
    loadFriendRequestsUI(toUserId);
    loadFriendsUI(toUserId);
  } catch (err) {
    console.error("Error handling request:", err);
  }
};

document.getElementById("roflButton").addEventListener("click", function() {
  alert("AHAHHA maaan what did you hope for?")
  this.style.display = "none"; 
})


document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById("themeToggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");

      const isDark = document.body.classList.contains("dark-theme");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }
});
