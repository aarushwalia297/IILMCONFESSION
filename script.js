// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgyN1hGpAISGfOnApEKe_ny0o0ifvodL0",
  authDomain: "whispers-b5caf.firebaseapp.com",
  projectId: "whispers-b5caf",
  storageBucket: "whispers-b5caf.firebasestorage.app",
  messagingSenderId: "1043264807234",
  appId: "1:1043264807234:web:eac888eedd9020841d68db",
  measurementId: "G-90D24EMX1Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfoSpan = document.getElementById('user-info');

loginBtn.addEventListener('click', () => {
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      userInfoSpan.textContent = `Hello, ${user.displayName}`;
      userInfoSpan.style.display = 'inline';
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline';
    })
    .catch((error) => {
      console.error('Login error:', error);
      alert('Failed to login.');
    });
});

logoutBtn.addEventListener('click', () => {
  auth.signOut()
    .then(() => {
      userInfoSpan.textContent = '';
      userInfoSpan.style.display = 'none';
      loginBtn.style.display = 'inline';
      logoutBtn.style.display = 'none';
      // Clear unlock flag on logout
      sessionStorage.removeItem('postsUnlocked');
    })
    .catch((error) => {
      console.error('Logout error:', error);
      alert('Failed to logout.');
    });
});

auth.onAuthStateChanged((user) => {
  if (user) {
    userInfoSpan.textContent = `Hello, ${user.displayName}`;
    userInfoSpan.style.display = 'inline';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline';
  } else {
    userInfoSpan.textContent = '';
    userInfoSpan.style.display = 'none';
    loginBtn.style.display = 'inline';
    logoutBtn.style.display = 'none';
  }
});

// Show/Hide Sections Function
function showSection(sectionId) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });

  const sectionToShow = document.getElementById(sectionId);
  sectionToShow.classList.add('active');

  // Show or hide relevant lists based on section
  if (sectionId === 'ask-questions-section') {
    document.getElementById('questions-list').style.display = 'block';
  } else {
    document.getElementById('questions-list').style.display = 'none';
  }

  if (sectionId === 'polls-section') {
    document.getElementById('poll-results').style.display = 'block';
  } else {
    document.getElementById('poll-results').style.display = 'none';
  }

  if (sectionId === 'confessions-section') {
    document.getElementById('confessions-list').style.display = 'block';
  } else {
    document.getElementById('confessions-list').style.display = 'none';
  }

  if (sectionId === 'college-updates-section') {
    document.getElementById('college-updates-list').style.display = 'block';
  } else {
    document.getElementById('college-updates-list').style.display = 'none';
  }

  if (sectionId === 'relationships-updates-section') {
    document.getElementById('relationships-updates-list').style.display = 'block';
  } else {
    document.getElementById('relationships-updates-list').style.display = 'none';
  }

  if (sectionId === 'exam-confessions-section') {
    document.getElementById('exam-confessions-list').style.display = 'block';
  } else {
    document.getElementById('exam-confessions-list').style.display = 'none';
  }
}

// Toggle Post Form Visibility
function toggleForm(formId) {
  const form = document.getElementById(formId);
  form.style.display = form.style.display === 'block' ? 'none' : 'block';
}

// Load Poll Results
function loadPollResults() {
  const pollResults = document.getElementById('poll-results');
  pollResults.innerHTML = '';

  db.collection('polls').orderBy('createdAt', 'desc').limit(5).get().then(querySnapshot => {
    querySnapshot.forEach(doc => {
      const poll = doc.data();
      const div = document.createElement('div');
      div.classList.add('poll');

      let optionsHtml = '';
      poll.options.forEach((opt, index) => {
        optionsHtml += `
          <label>
            <input type="radio" name="poll-${doc.id}" value="${index}" />
            ${opt.option}: ${opt.votes} votes
          </label><br/>
        `;
      });

      div.innerHTML = `
        <h3>${poll.question}</h3>
        ${optionsHtml}
        <button class="vote-btn" data-poll-id="${doc.id}">Vote</button>
      `;

      pollResults.appendChild(div);
    });

    // Add event listeners for vote buttons
    const voteButtons = pollResults.querySelectorAll('.vote-btn');
    voteButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const pollId = button.getAttribute('data-poll-id');
        const selectedOption = pollResults.querySelector(`input[name="poll-${pollId}"]:checked`);
        if (!selectedOption) {
          alert('Please select an option to vote.');
          return;
        }
        const optionIndex = parseInt(selectedOption.value);

        const pollRef = db.collection('polls').doc(pollId);
        const pollDoc = await pollRef.get();
        if (!pollDoc.exists) {
          alert('Poll not found.');
          return;
        }
        const pollData = pollDoc.data();

        // Increment vote count for selected option
        const updatedOptions = pollData.options.map((opt, idx) => {
          if (idx === optionIndex) {
            return { ...opt, votes: (opt.votes || 0) + 1 };
          }
          return opt;
        });

        await pollRef.update({ options: updatedOptions });
        alert('Vote recorded successfully!');
        loadPollResults(); // Refresh poll results
      });
    });
  });
}

// Update loadQuestions to show question text as post header instead of "Anonymous"
function loadQuestions() {
  const questionsList = document.getElementById('questions-list');
  questionsList.innerHTML = '';

  db.collection('questions').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    questionsList.innerHTML = '';
    snapshot.forEach(doc => {
      const question = doc.data();
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="post" data-id="${doc.id}">
          <div class="post-header clickable">${question.question}</div>
          <small>${new Date(question.createdAt.seconds * 1000).toLocaleString()}</small>
          <div class="post-content" style="display:none;">
            <p>${question.question}</p>
          </div>
          <div class="post-actions" style="display:none;">
            <div class="like-button" data-liked="false">❤️ <span class="like-count">${question.upvotes || 0}</span></div>
          </div>
          <div class="comments-section" style="display:none;">
            <div class="comment-list"></div>
            <div class="comment-input">
              <textarea placeholder="Add a comment..."></textarea>
              <button>Comment</button>
            </div>
          </div>
        </div>
      `;
      questionsList.appendChild(div);
      setupPostInteractions(div, 'questions', doc.id);

      // Add click event to toggle content and comments
      const postHeader = div.querySelector('.post-header');
      const postContent = div.querySelector('.post-content');
      const postActions = div.querySelector('.post-actions');
      const commentsSection = div.querySelector('.comments-section');

      postHeader.addEventListener('click', () => {
        openPostDetailView('collegeUpdates', doc.id);
      });
    });
  });
}


function loadConfessions() {
  const confessionsList = document.getElementById('confessions-list');
  confessionsList.innerHTML = '';

  // Show loading spinner
  const loadingSpinner = document.createElement('div');
  loadingSpinner.className = 'loading-spinner';
  confessionsList.appendChild(loadingSpinner);

  db.collection('confessions').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    confessionsList.innerHTML = '';
    snapshot.forEach(doc => {
      const confession = doc.data();
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="post" data-id="${doc.id}">
          <div class="post-header clickable">${confession.title || 'Untitled'}</div>
          <small class="post-nickname-small">Posted by: <strong>${confession.nickname && confession.nickname.trim() !== '' ? confession.nickname : 'Anonymous'}</strong></small>
        </div>
      `;
      confessionsList.appendChild(div);
      div.querySelector('.post-header').addEventListener('click', () => {
        // Navigate to confession.html with the confession id to open modal there
        window.location.href = `confession.html?id=${doc.id}`;
      });
    });
  });
}

// Load confession data into the new modal
async function loadConfessionData(confessionId) {
  const confessionTitle = document.getElementById('confessionTitle');
  const confessionText = document.getElementById('confessionText');
  const confessionMedia = document.getElementById('confessionMedia');
  const likeCountSpan = document.getElementById('likeCount');
  const dislikeCountSpan = document.getElementById('dislikeCount');
  const commentList = document.getElementById('commentList');

  const docRef = db.collection('confessions').doc(confessionId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const data = docSnap.data();
    confessionTitle.textContent = data.title || 'Untitled';
    confessionText.textContent = data.text || '';

    // Clear previous media
    confessionMedia.innerHTML = '';
    if (data.imageUrl) {
      const img = document.createElement('img');
      img.src = data.imageUrl;
      img.style.maxWidth = '100%';
      img.style.borderRadius = '12px';
      img.style.marginBottom = '15px';
      confessionMedia.appendChild(img);
    }
    if (data.gifUrl) {
      const gif = document.createElement('img');
      gif.src = data.gifUrl;
      gif.style.maxWidth = '100%';
      gif.style.borderRadius = '12px';
      gif.style.marginBottom = '15px';
      confessionMedia.appendChild(gif);
    }

    likeCountSpan.textContent = data.upvotes || 0;
    dislikeCountSpan.textContent = data.downvotes || 0;

    // Load comments
    loadComments(confessionId);

    // Setup like/dislike button states and handlers
    setupLikeDislikeButtons(confessionId, data);
  } else {
    confessionTitle.textContent = 'Confession not found';
    confessionText.textContent = '';
    confessionMedia.innerHTML = '';
    likeCountSpan.textContent = '0';
    dislikeCountSpan.textContent = '0';
    commentList.innerHTML = '';
  }
}

// Load comments for a confession in the modal
function loadComments(confessionId) {
  const commentList = document.getElementById('commentList');
  commentList.innerHTML = 'Loading comments...';

  const commentsQuery = db.collection('confessions').doc(confessionId).collection('comments').orderBy('createdAt', 'asc');
  commentsQuery.onSnapshot(snapshot => {
    commentList.innerHTML = '';
    if (snapshot.empty) {
      commentList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
      return;
    }
    snapshot.forEach(doc => {
      const comment = doc.data();
      const commentElem = document.createElement('div');
      commentElem.classList.add('comment');
      commentElem.innerHTML = `<strong>${comment.username || 'Anonymous'}:</strong> ${comment.text}`;
      commentList.appendChild(commentElem);
    });
    commentList.scrollTop = commentList.scrollHeight;
  });
}

// Setup like and dislike buttons in the modal
function setupLikeDislikeButtons(confessionId, data) {
  const likeBtn = document.getElementById('likeBtn');
  const dislikeBtn = document.getElementById('dislikeBtn');
  const likeCountSpan = document.getElementById('likeCount');
  const dislikeCountSpan = document.getElementById('dislikeCount');

  let currentUserId = localStorage.getItem('userId');
  let userLiked = data.likedBy?.includes(currentUserId) || false;
  let userDisliked = data.dislikedBy?.includes(currentUserId) || false;

  function updateButtons() {
    likeBtn.setAttribute('aria-pressed', userLiked);
    dislikeBtn.setAttribute('aria-pressed', userDisliked);
    if (userLiked) {
      likeBtn.classList.add('liked');
    } else {
      likeBtn.classList.remove('liked');
    }
    if (userDisliked) {
      dislikeBtn.classList.add('liked');
    } else {
      dislikeBtn.classList.remove('liked');
    }
  }

  updateButtons();

  likeBtn.onclick = async () => {
    if (!currentUserId) {
      alert('Please log in to like confessions.');
      return;
    }
    const docRef = db.collection('confessions').doc(confessionId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return;

    const data = docSnap.data();
    let upvotes = data.upvotes || 0;
    let downvotes = data.downvotes || 0;
    let likedBy = data.likedBy || [];
    let dislikedBy = data.dislikedBy || [];

    if (userLiked) {
      upvotes--;
      likedBy = likedBy.filter(uid => uid !== currentUserId);
      userLiked = false;
    } else {
      upvotes++;
      likedBy.push(currentUserId);
      userLiked = true;
      if (userDisliked) {
        downvotes--;
        dislikedBy = dislikedBy.filter(uid => uid !== currentUserId);
        userDisliked = false;
      }
    }

    await docRef.update({
      upvotes,
      downvotes,
      likedBy,
      dislikedBy
    });
    likeCountSpan.textContent = upvotes;
    dislikeCountSpan.textContent = downvotes;
    updateButtons();
  };

  dislikeBtn.onclick = async () => {
    if (!currentUserId) {
      alert('Please log in to dislike confessions.');
      return;
    }
    const docRef = db.collection('confessions').doc(confessionId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return;

    const data = docSnap.data();
    let upvotes = data.upvotes || 0;
    let downvotes = data.downvotes || 0;
    let likedBy = data.likedBy || [];
    let dislikedBy = data.dislikedBy || [];

    if (userDisliked) {
      downvotes--;
      dislikedBy = dislikedBy.filter(uid => uid !== currentUserId);
      userDisliked = false;
    } else {
      downvotes++;
      dislikedBy.push(currentUserId);
      userDisliked = true;
      if (userLiked) {
        upvotes--;
        likedBy = likedBy.filter(uid => uid !== currentUserId);
        userLiked = false;
      }
    }

    await docRef.update({
      upvotes,
      downvotes,
      likedBy,
      dislikedBy
    });
    likeCountSpan.textContent = upvotes;
    dislikeCountSpan.textContent = downvotes;
    updateButtons();
  };
}

// --- College Updates Section ---
document.getElementById('college-update-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('college-update-title').value.trim() || 'Untitled';
  const nickname = document.getElementById('update-nickname').value.trim() || 'Anonymous';
  const updateText = document.getElementById('update-text').value.trim();
  const imageFile = document.getElementById('update-image-upload').files[0];

  if (!updateText) {
    alert('Update cannot be empty!');
    return;
  }

  let imageUrl = '';
  if (imageFile) {
    const storageRef = firebase.storage().ref('updateImages/' + imageFile.name);
    await storageRef.put(imageFile);
    imageUrl = await storageRef.getDownloadURL();
  }

  try {
    await db.collection('collegeUpdates').add({
      title: title,
      text: updateText,
      nickname: nickname,
      imageUrl: imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('college-update-title').value = '';
    document.getElementById('update-nickname').value = '';
    document.getElementById('update-text').value = '';
    document.getElementById('update-image-upload').value = '';

    alert("College Update posted successfully!");
    loadCollegeUpdates();  // Refresh the list of college updates
  } catch (error) {
    console.error('Error posting update:', error);
    alert('Failed to post update.');
  }
});

// Load College Updates
function loadCollegeUpdates() {
  const collegeUpdatesList = document.getElementById('college-updates-list');
  collegeUpdatesList.innerHTML = '';

  db.collection('collegeUpdates').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    collegeUpdatesList.innerHTML = '';
    snapshot.forEach(doc => {
      const update = doc.data();
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="post" data-id="${doc.id}">
          <div class="post-header clickable">${update.title || 'Untitled'}</div>
          <small>${new Date(update.createdAt.seconds * 1000).toLocaleString()}</small>
          <div class="post-content" style="display:none;">
            <p>${update.text}</p>
            ${update.imageUrl ? `<img src="${update.imageUrl}" width="100%" />` : ''}
          </div>
          <div class="post-actions" style="display:none;">
            <div class="like-button" data-liked="false">❤️ <span class="like-count">${update.upvotes || 0}</span></div>
          </div>
          <div class="comments-section" style="display:none;">
            <div class="comment-list"></div>
            <div class="comment-input">
              <textarea placeholder="Add a comment..."></textarea>
              <button>Comment</button>
            </div>
          </div>
        </div>
      `;
      collegeUpdatesList.appendChild(div);
      setupPostInteractions(div, 'collegeUpdates', doc.id);

      // Add click event to toggle content and comments
      const postHeader = div.querySelector('.post-header');
      const postContent = div.querySelector('.post-content');
      const postActions = div.querySelector('.post-actions');
      const commentsSection = div.querySelector('.comments-section');

      postHeader.addEventListener('click', () => {
        const isVisible = postContent.style.display === 'block';
        if (isVisible) {
          postContent.style.display = 'none';
          postActions.style.display = 'none';
          commentsSection.style.display = 'none';
        } else {
          postContent.style.display = 'block';
          postActions.style.display = 'block';
          commentsSection.style.display = 'block';
        }
      });
    });
  });
}

// --- Relationship Updates Section ---
document.getElementById('relationships-update-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nickname = document.getElementById('relationships-nickname').value.trim() || 'Anonymous';
  const relationshipsText = document.getElementById('relationships-text').value.trim();
  const imageFile = document.getElementById('relationships-image-upload').files[0];

  if (!relationshipsText) {
    alert('Relationship update cannot be empty!');
    return;
  }

  let imageUrl = '';
  if (imageFile) {
    const storageRef = firebase.storage().ref('relationshipsUpdateImages/' + imageFile.name);
    await storageRef.put(imageFile);
    imageUrl = await storageRef.getDownloadURL();
  }

  try {
    await db.collection('relationshipsUpdates').add({
      text: relationshipsText,
      nickname: nickname,
      imageUrl: imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('relationships-nickname').value = '';
    document.getElementById('relationships-text').value = '';
    document.getElementById('relationships-image-upload').value = '';

    alert("Relationship Update posted successfully!");
    loadRelationshipsUpdates();  // Refresh the list of relationship updates
  } catch (error) {
    console.error('Error posting relationship update:', error);
    alert('Failed to post relationship update.');
  }
});

// Load Relationship Updates
function loadRelationshipsUpdates() {
  const relationshipsUpdatesList = document.getElementById('relationships-updates-list');
  relationshipsUpdatesList.innerHTML = '';

  db.collection('relationshipsUpdates').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    relationshipsUpdatesList.innerHTML = '';
    snapshot.forEach(doc => {
      const update = doc.data();
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="post" data-id="${doc.id}">
          <div class="post-header clickable">${update.title || 'Untitled'}</div>
          <small>${new Date(update.createdAt.seconds * 1000).toLocaleString()}</small>
          <div class="post-content" style="display:none;">
            <p>${update.text}</p>
            ${update.imageUrl ? `<img src="${update.imageUrl}" width="100%" />` : ''}
          </div>
          <div class="post-actions" style="display:none;">
            <div class="like-button" data-liked="false">❤️ <span class="like-count">${update.upvotes || 0}</span></div>
          </div>
          <div class="comments-section" style="display:none;">
            <div class="comment-list"></div>
            <div class="comment-input">
              <textarea placeholder="Add a comment..."></textarea>
              <button>Comment</button>
            </div>
          </div>
        </div>
      `;
      relationshipsUpdatesList.appendChild(div);
      setupPostInteractions(div, 'relationshipsUpdates', doc.id);

      // Add click event to toggle content and comments
      const postHeader = div.querySelector('.post-header');
      const postContent = div.querySelector('.post-content');
      const postActions = div.querySelector('.post-actions');
      const commentsSection = div.querySelector('.comments-section');

      postHeader.addEventListener('click', () => {
        const isVisible = postContent.style.display === 'block';
        if (isVisible) {
          postContent.style.display = 'none';
          postActions.style.display = 'none';
          commentsSection.style.display = 'none';
        } else {
          postContent.style.display = 'block';
          postActions.style.display = 'block';
          commentsSection.style.display = 'block';
        }
      });
    });
  });
}

// Initialize the page with confessions, updates, and relationship updates
window.onload = function() {
  loadConfessions();  // Load confessions when the page loads
  loadCollegeUpdates(); // Load college updates when the page loads
  loadRelationshipsUpdates(); // Load relationship updates when the page loads
};
// --- Exam Confessions Section ---
document.getElementById('exam-confession-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nickname = document.getElementById('exam-nickname').value.trim() || 'Anonymous';
  const examText = document.getElementById('exam-text').value.trim();
  const imageFile = document.getElementById('exam-image-upload').files[0];

  if (!examText) {
    alert('Exam confession cannot be empty!');
    return;
  }

  let imageUrl = '';
  if (imageFile) {
    const storageRef = firebase.storage().ref('examConfessionsImages/' + imageFile.name);
    await storageRef.put(imageFile);
    imageUrl = await storageRef.getDownloadURL();
  }

  try {
    await db.collection('examConfessions').add({
      text: examText,
      nickname: nickname,
      imageUrl: imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('exam-nickname').value = '';
    document.getElementById('exam-text').value = '';
    document.getElementById('exam-image-upload').value = '';

    alert("Exam Confession posted successfully!");
    loadExamConfessions();  // Refresh the list of exam confessions
  } catch (error) {
    console.error('Error posting exam confession:', error);
    alert('Failed to post exam confession.');
  }
});

// Load Exam Confessions
function loadExamConfessions() {
  const examConfessionsList = document.getElementById('exam-confessions-list');
  examConfessionsList.innerHTML = '';

  db.collection('examConfessions').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    examConfessionsList.innerHTML = '';
    snapshot.forEach(doc => {
      const examConfession = doc.data();
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="post" data-id="${doc.id}">
          <div class="post-header clickable">${examConfession.title || 'Untitled'}</div>
          <small>${new Date(examConfession.createdAt.seconds * 1000).toLocaleString()}</small>
          <div class="post-content" style="display:none;">
            <p>${examConfession.text}</p>
            ${examConfession.imageUrl ? `<img src="${examConfession.imageUrl}" width="100%" />` : ''}
          </div>
          <div class="post-actions" style="display:none;">
            <div class="like-button" data-liked="false">❤️ <span class="like-count">${examConfession.upvotes || 0}</span></div>
          </div>
          <div class="comments-section" style="display:none;">
            <div class="comment-list"></div>
            <div class="comment-input">
              <textarea placeholder="Add a comment..."></textarea>
              <button>Comment</button>
            </div>
          </div>
        </div>
      `;
      examConfessionsList.appendChild(div);
      setupPostInteractions(div, 'examConfessions', doc.id);

      // Add click event to toggle content and comments
      const postHeader = div.querySelector('.post-header');
      const postContent = div.querySelector('.post-content');
      const postActions = div.querySelector('.post-actions');
      const commentsSection = div.querySelector('.comments-section');

      postHeader.addEventListener('click', () => {
        const isVisible = postContent.style.display === 'block';
        if (isVisible) {
          postContent.style.display = 'none';
          postActions.style.display = 'none';
          commentsSection.style.display = 'none';
        } else {
          postContent.style.display = 'block';
          postActions.style.display = 'block';
          commentsSection.style.display = 'block';
        }
      });
    });
  });
}

// --- Ask Confession Questions Section ---
// Remove old inline form event listener
// Add modal open/close and form submission handlers

// Open modal
document.getElementById('open-ask-modal-btn').addEventListener('click', () => {
  document.getElementById('ask-modal').style.display = 'block';
});

// Close modal
document.getElementById('close-ask-modal').addEventListener('click', () => {
  document.getElementById('ask-modal').style.display = 'none';
});

// Close modal on outside click
window.addEventListener('click', (event) => {
  const modal = document.getElementById('ask-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// Handle modal form submission
document.getElementById('ask-question-form-modal').addEventListener('submit', async (e) => {
  e.preventDefault();

  const questionTitle = document.getElementById('question-title-modal').value.trim();
  const questionText = document.getElementById('question-text-modal').value.trim();
  if (!questionText) {
    alert('Please ask a question!');
    return;
  }

  try {
    await db.collection('questions').add({
      title: questionTitle || 'Untitled',
      question: questionText,
      upvotes: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    document.getElementById('question-title-modal').value = '';
    document.getElementById('question-text-modal').value = '';
    alert("Question posted successfully!");
    document.getElementById('ask-modal').style.display = 'none';
    loadQuestions();  // Refresh the list of questions
  } catch (error) {
    console.error('Error posting question:', error);
    alert('Failed to post question.');
  }
});

// Load Questions
function loadQuestions() {
  const questionsList = document.getElementById('questions-list');
  questionsList.innerHTML = '';

  db.collection('questions').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    questionsList.innerHTML = '';
    snapshot.forEach(doc => {
      const question = doc.data();
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="post" data-id="${doc.id}">
          <div class="post-header clickable">Anonymous</div>
          <small>${new Date(question.createdAt.seconds * 1000).toLocaleString()}</small>
          <div class="post-content" style="display:none;">
            <p>${question.question}</p>
          </div>
          <div class="post-actions" style="display:none;">
            <div class="like-button" data-liked="false">❤️ <span class="like-count">${question.upvotes || 0}</span></div>
          </div>
          <div class="comments-section" style="display:none;">
            <div class="comment-list"></div>
            <div class="comment-input">
              <textarea placeholder="Add a comment..."></textarea>
              <button>Comment</button>
            </div>
          </div>
        </div>
      `;
      questionsList.appendChild(div);
      setupPostInteractions(div, 'questions', doc.id);

      // Add click event to toggle content and comments
      const postHeader = div.querySelector('.post-header');
      const postContent = div.querySelector('.post-content');
      const postActions = div.querySelector('.post-actions');
      const commentsSection = div.querySelector('.comments-section');

      postHeader.addEventListener('click', () => {
        const isVisible = postContent.style.display === 'block';
        if (isVisible) {
          postContent.style.display = 'none';
          postActions.style.display = 'none';
          commentsSection.style.display = 'none';
        } else {
          postContent.style.display = 'block';
          postActions.style.display = 'block';
          commentsSection.style.display = 'block';
        }
      });
    });
  });
}

document.getElementById('open-poll-modal-btn').addEventListener('click', () => {
  document.getElementById('poll-modal').style.display = 'block';
});

document.getElementById('close-poll-modal').addEventListener('click', () => {
  document.getElementById('poll-modal').style.display = 'none';
});

window.addEventListener('click', (event) => {
  const modal = document.getElementById('poll-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

const pollOptionsContainer = document.getElementById('poll-options-container');
const addOptionBtn = document.getElementById('add-option-btn');

addOptionBtn.addEventListener('click', () => {
  const currentOptions = pollOptionsContainer.querySelectorAll('input[name="poll-option"]');
  if (currentOptions.length < 5) {
    const newOptionNumber = currentOptions.length + 1;
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.name = 'poll-option';
    newInput.placeholder = `Option ${newOptionNumber}`;
    newInput.required = true;
    pollOptionsContainer.appendChild(newInput);
  } else {
    alert('Maximum 5 options allowed.');
  }
});

document.getElementById('poll-form-modal').addEventListener('submit', async (e) => {
  e.preventDefault();

  const question = document.getElementById('poll-question').value.trim();
  const optionInputs = pollOptionsContainer.querySelectorAll('input[name="poll-option"]');
  const options = [];

  optionInputs.forEach(input => {
    if (input.value.trim() !== '') {
      options.push({ option: input.value.trim(), votes: 0 });
    }
  });

  if (!question) {
    alert('Please enter a poll question.');
    return;
  }

  if (options.length < 2) {
    alert('Please enter at least two options.');
    return;
  }

  try {
    // Create a new poll document with question and options
    const pollRef = await db.collection('polls').add({
      question: question,
      options: options,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert('Poll created successfully!');
    document.getElementById('poll-question').value = '';
    pollOptionsContainer.innerHTML = '';
    // Reset to 2 options
    for (let i = 1; i <= 2; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'poll-option';
      input.placeholder = `Option ${i}`;
      input.required = true;
      pollOptionsContainer.appendChild(input);
    }
    document.getElementById('poll-modal').style.display = 'none';
    loadPollResults();
  } catch (error) {
    console.error('Error creating poll:', error);
    alert('Failed to create poll.');
  }
});

// Load Poll Results
function loadPollResults() {
  const pollResults = document.getElementById('poll-results');
  pollResults.innerHTML = '';

  db.collection('polls').orderBy('createdAt', 'desc').limit(5).get().then(querySnapshot => {
    querySnapshot.forEach(doc => {
      const poll = doc.data();
      const pollId = doc.id;
      const div = document.createElement('div');
      div.classList.add('poll');

      // Check if user has voted on this poll
      const votedPolls = JSON.parse(sessionStorage.getItem('votedPolls') || '{}');
      const hasVoted = votedPolls[pollId] === true;

      if (!hasVoted) {
        // Show options as radio buttons and vote button
        let optionsHtml = '';
        poll.options.forEach((opt, index) => {
          optionsHtml += `
            <label>
              <input type="radio" name="poll-${pollId}" value="${index}" />
              ${opt.option}
            </label><br/>
          `;
        });

        div.innerHTML = `
          <h3>${poll.question}</h3>
          ${optionsHtml}
          <button class="vote-btn" data-poll-id="${pollId}">Vote</button>
        `;

        pollResults.appendChild(div);

        // Add event listener for vote button
        const voteButton = div.querySelector('.vote-btn');
        voteButton.addEventListener('click', async () => {
          const selectedOption = div.querySelector(`input[name="poll-${pollId}"]:checked`);
          if (!selectedOption) {
            alert('Please select an option to vote.');
            return;
          }
          const optionIndex = parseInt(selectedOption.value);

          const pollRef = db.collection('polls').doc(pollId);
          const pollDoc = await pollRef.get();
          if (!pollDoc.exists) {
            alert('Poll not found.');
            return;
          }
          const pollData = pollDoc.data();

          // Increment vote count for selected option
          const updatedOptions = pollData.options.map((opt, idx) => {
            if (idx === optionIndex) {
              return { ...opt, votes: (opt.votes || 0) + 1 };
            }
            return opt;
          });

          await pollRef.update({ options: updatedOptions });

          // Mark poll as voted in sessionStorage
          votedPolls[pollId] = true;
          sessionStorage.setItem('votedPolls', JSON.stringify(votedPolls));

          alert('Vote recorded successfully!');

          // Reload poll results to show percentages
          loadPollResults();
        });

      } else {
        // Show options with vote percentages
        const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
        let optionsHtml = '';
        poll.options.forEach(opt => {
          const percentage = totalVotes > 0 ? ((opt.votes || 0) / totalVotes * 100).toFixed(1) : 0;
          optionsHtml += `<p>${opt.option}: ${percentage}% (${opt.votes || 0} votes)</p>`;
        });

        div.innerHTML = `
          <h3>${poll.question}</h3>
          ${optionsHtml}
          <p><em>You have already voted on this poll.</em></p>
        `;

        pollResults.appendChild(div);
      }
    });
  });
}

// Setup interactions for likes and comments on a post element
function setupPostInteractions(postElement, collectionName, docId) {
  const likeButton = postElement.querySelector('.like-button');
  const commentList = postElement.querySelector('.comment-list');
  const commentInput = postElement.querySelector('.comment-input textarea');
  const commentButton = postElement.querySelector('.comment-input button');

  // Load existing comments for this post
  db.collection(collectionName).doc(docId).collection('comments').orderBy('createdAt', 'asc').onSnapshot(snapshot => {
    if (!commentList) {
      console.error('Comment list container not found');
      return;
    }
    commentList.innerHTML = '';

    // Build a map of comments by id
    const commentsById = {};
    const rootComments = [];

    snapshot.forEach(doc => {
      const comment = { id: doc.id, ...doc.data(), replies: [] };
      commentsById[comment.id] = comment;
    });

    // Organize comments into tree structure
    Object.values(commentsById).forEach(comment => {
      if (comment.parentCommentId) {
        if (commentsById[comment.parentCommentId]) {
          commentsById[comment.parentCommentId].replies.push(comment);
        } else {
          rootComments.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    // Recursive function to render comments and replies
    function renderComments(comments, container, level = 0) {
      comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.classList.add('comment');
        commentDiv.style.marginLeft = `${level * 20}px`;

        const displayName = comment.nickname && comment.nickname.trim() !== '' ? comment.nickname : 'Anonymous';

        commentDiv.innerHTML = `
          <strong>${displayName}</strong>: ${comment.text}
          <button class="reply-btn" style="margin-left: 10px; font-size: 0.8rem;">Reply</button>
          <div class="reply-input-container" style="display:none; margin-top: 5px;">
            <textarea class="reply-textarea" rows="2" placeholder="Write a reply..."></textarea>
            <button class="submit-reply-btn">Submit</button>
            <button class="cancel-reply-btn">Cancel</button>
          </div>
        `;

        container.appendChild(commentDiv);

        // Reply button event
        const replyBtn = commentDiv.querySelector('.reply-btn');
        const replyInputContainer = commentDiv.querySelector('.reply-input-container');
        const submitReplyBtn = commentDiv.querySelector('.submit-reply-btn');
        const cancelReplyBtn = commentDiv.querySelector('.cancel-reply-btn');
        const replyTextarea = commentDiv.querySelector('.reply-textarea');

        replyBtn.addEventListener('click', () => {
          replyInputContainer.style.display = 'block';
          replyBtn.style.display = 'none';
          replyTextarea.focus();
        });

        cancelReplyBtn.addEventListener('click', () => {
          replyInputContainer.style.display = 'none';
          replyBtn.style.display = 'inline';
          replyTextarea.value = '';
        });

        submitReplyBtn.addEventListener('click', async () => {
          const replyText = replyTextarea.value.trim();
          if (!replyText) {
            alert('Reply cannot be empty!');
            return;
          }
          try {
            let nickname = 'Anonymous';
            const nicknameInput = document.getElementById('nickname') || document.getElementById('update-nickname') || document.getElementById('relationships-nickname') || document.getElementById('exam-nickname');
            if (nicknameInput && nicknameInput.value.trim() !== '') {
              nickname = nicknameInput.value.trim();
            }
            await db.collection(collectionName).doc(docId).collection('comments').add({
              text: replyText,
              nickname: nickname,
              parentCommentId: comment.id,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            replyTextarea.value = '';
            replyInputContainer.style.display = 'none';
            replyBtn.style.display = 'inline';
          } catch (error) {
            console.error('Error posting reply:', error);
            alert('Failed to post reply.');
          }
        });

        // Render replies recursively
        if (comment.replies.length > 0) {
          renderComments(comment.replies, container, level + 1);
        }
      });
    }

    renderComments(rootComments, commentList);
  });

  // Handle like button click
  likeButton.addEventListener('click', async () => {
    const liked = likeButton.getAttribute('data-liked') === 'true';
    const likeCountSpan = likeButton.querySelector('.like-count');
    let likeCount = parseInt(likeCountSpan.textContent);

    if (liked) {
      // Unlike
      likeCount--;
      likeButton.setAttribute('data-liked', 'false');
      likeButton.classList.remove('liked');
      await db.collection(collectionName).doc(docId).update({
        upvotes: firebase.firestore.FieldValue.increment(-1)
      });
    } else {
      // Like
      likeCount++;
      likeButton.setAttribute('data-liked', 'true');
      likeButton.classList.add('liked');
      await db.collection(collectionName).doc(docId).update({
        upvotes: firebase.firestore.FieldValue.increment(1)
      });
    }
    likeCountSpan.textContent = likeCount;
  });

  // Handle comment submission
  commentButton.addEventListener('click', async () => {
    const text = commentInput.value.trim();
    if (!text) {
      alert('Comment cannot be empty!');
      return;
    }
    try {
      // Use the nickname input if available, else default to 'Anonymous'
      let nickname = 'Anonymous';
      const nicknameInput = document.getElementById('nickname') || document.getElementById('update-nickname') || document.getElementById('relationships-nickname') || document.getElementById('exam-nickname');
      if (nicknameInput && nicknameInput.value.trim() !== '') {
        nickname = nicknameInput.value.trim();
      }
      await db.collection(collectionName).doc(docId).collection('comments').add({
        text: text,
        nickname: nickname,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      commentInput.value = '';
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment.');
    }
  });
}

// Open detailed post view in full screen modal
async function openPostDetailView(collectionName, docId) {
  try {
    const docRef = db.collection(collectionName).doc(docId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      alert('Post not found.');
      return;
    }
    const post = docSnap.data();

    // Populate right side panel elements
    document.getElementById('right-panel-post-title').textContent = post.title || 'Untitled';
    document.getElementById('right-panel-post-nickname').textContent = post.nickname || 'Anonymous';
    const contentDiv = document.getElementById('right-panel-post-content');
    contentDiv.innerHTML = `<p>${post.text}</p>`;
    if (post.imageUrl) {
      const img = document.createElement('img');
      img.src = post.imageUrl;
      img.style.maxWidth = '100%';
      img.style.borderRadius = '12px';
      img.style.marginTop = '15px';
      contentDiv.appendChild(img);
    }
    if (post.gifUrl) {
      const gif = document.createElement('img');
      gif.src = post.gifUrl;
      gif.style.maxWidth = '100%';
      gif.style.borderRadius = '12px';
      gif.style.marginTop = '15px';
      contentDiv.appendChild(gif);
    }

    // Setup actions
    const actionsDiv = document.getElementById('right-panel-post-actions');
    actionsDiv.innerHTML = `
      <button id="right-panel-like-button" aria-label="Like post">👍 <span id="right-panel-like-count">${post.upvotes || 0}</span></button>
      <button id="right-panel-dislike-button" aria-label="Dislike post">👎 <span id="right-panel-dislike-count">${post.downvotes || 0}</span></button>
      <button id="right-panel-share-button" aria-label="Share post">🔗 Share</button>
    `;

    // Load comments
    const commentList = document.getElementById('right-panel-comment-list');
    commentList.innerHTML = '';
    db.collection(collectionName).doc(docId).collection('comments').orderBy('createdAt', 'asc').onSnapshot(snapshot => {
      commentList.innerHTML = '';
      snapshot.forEach(doc => {
        const comment = doc.data();
        const commentDiv = document.createElement('div');
        commentDiv.classList.add('comment');
        commentDiv.innerHTML = `<strong>${comment.nickname || 'Anonymous'}</strong>: ${comment.text}`;
        commentList.appendChild(commentDiv);
      });
    });

    // Show right side panel
    const panel = document.getElementById('right-side-panel');
    panel.style.display = 'flex';

    // Like button functionality
    const likeButton = document.getElementById('right-panel-like-button');
    likeButton.onclick = async () => {
      const liked = likeButton.getAttribute('data-liked') === 'true';
      const likeCountSpan = document.getElementById('right-panel-like-count');
      let likeCount = parseInt(likeCountSpan.textContent);

      if (liked) {
        likeCount--;
        likeButton.setAttribute('data-liked', 'false');
        likeButton.classList.remove('liked');
        await docRef.update({
          upvotes: firebase.firestore.FieldValue.increment(-1)
        });
      } else {
        likeCount++;
        likeButton.setAttribute('data-liked', 'true');
        likeButton.classList.add('liked');
        await docRef.update({
          upvotes: firebase.firestore.FieldValue.increment(1)
        });
      }
      likeCountSpan.textContent = likeCount;
    };

    // Dislike button functionality
    const dislikeButton = document.getElementById('right-panel-dislike-button');
    dislikeButton.onclick = async () => {
      const disliked = dislikeButton.getAttribute('data-disliked') === 'true';
      const dislikeCountSpan = document.getElementById('right-panel-dislike-count');
      let dislikeCount = parseInt(dislikeCountSpan.textContent);

      if (disliked) {
        dislikeCount--;
        dislikeButton.setAttribute('data-disliked', 'false');
        dislikeButton.classList.remove('disliked');
        await docRef.update({
          downvotes: firebase.firestore.FieldValue.increment(-1)
        });
      } else {
        dislikeCount++;
        dislikeButton.setAttribute('data-disliked', 'true');
        dislikeButton.classList.add('disliked');
        await docRef.update({
          downvotes: firebase.firestore.FieldValue.increment(1)
        });
      }
      dislikeCountSpan.textContent = dislikeCount;
    };

    // Share button functionality
    const shareButton = document.getElementById('right-panel-share-button');
    shareButton.onclick = () => {
      const url = window.location.href + `#post-${docId}`;
      navigator.clipboard.writeText(url).then(() => {
        alert('Post URL copied to clipboard!');
      });
    };

    // Close right side panel button
    document.getElementById('close-right-panel').onclick = () => {
      panel.style.display = 'none';
    };

    // Comment submission
    const commentInput = document.getElementById('right-panel-comment-textarea');
    const commentButton = document.getElementById('right-panel-comment-button');
    commentButton.onclick = async () => {
      const text = commentInput.value.trim();
      if (!text) {
        alert('Comment cannot be empty!');
        return;
      }
      try {
        // Use nickname from localStorage or default to 'Anonymous'
        const nickname = localStorage.getItem('username') || 'Anonymous';
        await db.collection(collectionName).doc(docId).collection('comments').add({
          text: text,
          nickname: nickname,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        commentInput.value = '';
      } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment.');
      }
    };

  } catch (error) {
    console.error('Error loading post:', error);
    alert('Failed to load post.');
  }
}
