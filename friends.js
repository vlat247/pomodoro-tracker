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


onAuthStateChanged(auth, user => {
  if (user) {
    const userId = user.uid;
    console.log("🔐 Logged in as:", userId);

    // Wait until the modal and all DOM elements are loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setupFriendUI(userId);
      });
    } else {
      setupFriendUI(userId); // DOM already ready
    }
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
  container.innerHTML = ""; // Clear everything first

  const title = document.createElement("h3");
  title.textContent = "Incoming Friend Requests:";
  container.appendChild(title);

  const addBtn = document.createElement("button");
  addBtn.id = "openModal";
  addBtn.textContent = "Add Friend";

  addBtn.addEventListener("click", () => {
    const modal = document.getElementById("addFriendModal");
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    } else {
      console.error("Modal with ID 'addFriendModal' not found!");
    }
  });

  container.appendChild(addBtn);

  const q = query(collection(db, "friend_requests"),
    where("to", "==", userId),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const emptyText = document.createElement("p");
    emptyText.textContent = "No pending requests";
    container.appendChild(emptyText); // ✅ Use DOM method instead of innerHTML
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.innerHTML = `
      <p>From: ${data.from}</p>
      <button class="accept-btn" onclick="handleRespond('${docSnap.id}', '${data.from}', '${data.to}', true')">Accept</button>
      <button class="reject-btn" onclick="handleRespond('${docSnap.id}', '${data.from}', '${data.to}', false')">Reject</button>
    `;
    container.appendChild(div);
  });
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



document.addEventListener("DOMContentLoaded", ()=> {
  openModalMessage();
});

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

    const messageBtn = document.createElement("button");
    messageBtn.textContent = "Message";
    messageBtn.classList.add("openChatBtn");
    messageBtn.setAttribute('data-uid', friendId);

    
    messageBtn.addEventListener('click', () => {
      openChatWith(friendId, friendName);
    });

    const div = document.createElement("div");
    div.textContent = `${friendName}`;
    div.appendChild(messageBtn)

    container.appendChild(div);


  }
}



//CHAT MODAL
 function openModalMessage() {
  const modal = document.getElementById("chatModal");
  const closeBtn = document.querySelector('#chatModal .close');
  const modalTriggers = document.querySelectorAll('[messenger-open-modal]');

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
 }
document.addEventListener("DOMContentLoaded", () => {
  openModalMessage();
});

//SEND MESSAGES LOGIC 

let currentUserId = null;
let currentChatUserId = null;

// Get current user UID
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
  }
});

// Generate a unique chat ID between two users
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// Send message
async function sendMessage(fromUserId, toUserId, messageText) {
  const chatId = getChatId(fromUserId, toUserId);
  const chatRef = collection(db, "chats", chatId, "messages");

  await addDoc(chatRef, {
    sender: fromUserId,
    text: messageText,
    timestamp: serverTimestamp(),
  });
}

function listenForMessages(user1, user2) {
  const chatId = getChatId(user1, user2);
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp"));

  onSnapshot(q, (snapshot) => {
    const container = document.getElementById("messagesContainer");
    container.innerHTML = "";

    snapshot.forEach((doc) => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.textContent = `${msg.sender === user1 ? "You" : "Friend"}: ${msg.text}`;
      container.appendChild(div);

      if(msg.sender === user1) {
        div.classList.add("from-me");
      } else {
        div.classList.add("from-them")
      }

    });
  });
}


document.getElementById("sendMessage").addEventListener("click", async () => {
  const textInput = document.getElementById("textInput");
  const message = textInput.value.trim();

  if (message !== "" && currentUserId && currentChatUserId) {
    await sendMessage(currentUserId, currentChatUserId, message);
    textInput.value = "";
  }
});


function openChatWith(friendId, friendName) {
  currentChatUserId = friendId;

  // Show modal
  document.getElementById("chatModal").style.display = "block";
  document.getElementById("chatHeader").textContent = `Chat with ${friendName}`;

  // Start listening for messages
  listenForMessages(currentUserId, currentChatUserId);
}