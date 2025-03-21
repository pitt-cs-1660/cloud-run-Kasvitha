/**
 * This is the client-side code that interacts with Firebase Auth to sign in users, updates the UI if the user is signed in,
 * and sends the user's vote to the server.
 *
 * When running on localhost, you can disable authentication by passing `auth=false` as a query parameter.
 *
 * NOTE: YOU ONLY NEED TO MODIFY THE VOTE FUNCTION AT THE BOTTOM OF THIS FILE.
 */
firebase.initializeApp(config);

// Watch for state change from sign in
function initApp() {
  firebase.auth().onAuthStateChanged(user => {
    const signInButton = document.getElementById('signInButton');
    if (user) {
      // User is signed in.
      signInButton.innerText = 'Sign Out';
      document.getElementById('form').style.display = '';
    } else {
      // No user is signed in.
      signInButton.innerText = 'Sign In with Google';
      document.getElementById('form').style.display = 'none';
    }
  });
}

// Check if authentication is disabled via query parameter
function authDisabled() {
  const urlParams = new URLSearchParams(window.location.search);
  const hostname = window.location.hostname;
  // Auth is disabled only if running on localhost and `auth=false` is passed
  return urlParams.get('auth') === 'false' && hostname === 'localhost';
}

// Create ID token
async function createIdToken() {
  if (authDisabled()) {
    console.warn('Auth is disabled. Returning dummy ID token.');
    return new Promise(resolve => resolve('dummyToken'));  // Return a dummy ID token
  } else {
    return await firebase.auth().currentUser.getIdToken();
  }
}

window.onload = function () {
  if (authDisabled()) {
    console.warn('Running with auth disabled.');
    document.getElementById('signInButton').innerText = '(Auth Disabled)';
    document.getElementById('form').style.display = '';
  } else {
    console.log('Running with auth enabled.');
    initApp();
  }
};

function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');
  firebase.auth()
    .signInWithPopup(provider)
    .then(result => {
      console.log(`${result.user.displayName} logged in.`);
      window.alert(`Welcome ${result.user.displayName}!`);
    })
    .catch(err => {
      console.error(`Error during sign in: ${err.message}`);
      window.alert(`Sign in failed. Retry or check your browser logs.`);
    });
}

function signOut() {
  firebase.auth()
    .signOut()
    .then(() => console.log('User signed out successfully'))
    .catch(err => {
      console.error(`Error during sign out: ${err.message}`);
      window.alert(`Sign out failed. Retry or check your browser logs.`);
    });
}

// Toggle Sign in/out button
function toggle() {
  if (authDisabled()) {
    window.alert('Auth is disabled.');
    return;
  }
  if (!firebase.auth().currentUser) {
    signIn();
  } else {
    signOut();
  }
}

/**
 * DO NOT ALTER ANY CODE ABOVE THIS COMMENT
 * ++++ ADD YOUR CODE BELOW ++++
 * === VOTE FUNCTION ===
 */

/**
 * Sends the user's vote to the server.
 * @param team
 * @returns {Promise<void>}
 */
async function vote(team) {
  console.log(`Submitting vote for ${team}...`);

  if (firebase.auth().currentUser || authDisabled()) {
    try {
      const token = await createIdToken();

      const response = await fetch("/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${token}`
        },
        body: new URLSearchParams({ team })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result.message || "Vote recorded");
        window.alert(`Vote for ${team} was successful!`);
        window.location.reload();  // Refresh page to update counts
      } else {
        const errorData = await response.json();
        window.alert(`Error: ${errorData.detail || 'Failed to submit vote.'}`);
      }

    } catch (err) {
      console.error("Error when submitting vote:", err);
      window.alert("Something went wrong... Please try again!");
    }
  } else {
    window.alert("User not signed in.");
  }
}
