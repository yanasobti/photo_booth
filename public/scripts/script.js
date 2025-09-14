const video = document.getElementById('video');
const snapBtn = document.getElementById('snap-btn');
const countdown = document.getElementById('countdown');
const strip = document.getElementById('strip');
const shutterSound = document.getElementById('shutter-sound');
const poseReminder = document.getElementById('pose-reminder');
const filterButtons = document.querySelectorAll('.filter-btn');
let currentFilter = 'none';

filterButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    currentFilter = btn.getAttribute('data-filter');
    video.style.filter = currentFilter;
    // Remove active from all, add to clicked
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
// Set default active
if (filterButtons.length) filterButtons[0].classList.add('active');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function showCountdown(seconds) {
  for (let i = seconds; i > 0; i--) {
    countdown.textContent = i;
    await wait(1000);
  }
  countdown.textContent = '';
}

async function showPoseReminder(i) {
  poseReminder.textContent = `Get ready for Pose ${i + 1}!`;
  poseReminder.style.display = 'block';
  await wait(1500);
  poseReminder.style.display = 'none';
}

function captureToCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 300;
    canvas.height = video.videoHeight || 400;
    const ctx = canvas.getContext('2d');
  
    // Flip horizontally before drawing (undo mirroring)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Apply the current filter to the context
    ctx.filter = currentFilter;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none'; // Reset filter for safety
    return canvas;
  }

// Start the camera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
    };
  })
  .catch(err => {
    console.error("Camera error:", err);
  });

// On button click
snapBtn.addEventListener('click', async () => {
  strip.innerHTML = '';
  const photos = [];

  for (let i = 0; i < 4; i++) {
    await showPoseReminder(i);
    await showCountdown(3);
    shutterSound.play();  // <-- Play inside the loop
    const canvas = captureToCanvas();
    photos.push(canvas);
    await wait(500);
  }

  // Merge into one vertical strip
  const stripCanvas = document.createElement('canvas');
  const w = photos[0].width;
  const h = photos[0].height;
  stripCanvas.width = w;
  stripCanvas.height = h * 4;
  const stripCtx = stripCanvas.getContext('2d');

  photos.forEach((photo, i) => {
    stripCtx.drawImage(photo, 0, i * h, w, h);
  });

  const dataURL = stripCanvas.toDataURL('image/jpeg');
  const now = new Date();
  const formatted = encodeURIComponent(now.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }));

  sessionStorage.setItem('photoStripData', dataURL);
  sessionStorage.setItem('photoTimestamp', formatted);

  // Generate or retrieve a unique userId for this session
  let userId = sessionStorage.getItem('userId');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    sessionStorage.setItem('userId', userId);
  }


// SERVER KO BHEJDEGA
fetch(`/upload/${userId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: dataURL })
})
.then(res => res.json())
.then(data => console.log('Uploaded:', data))
.catch(err => console.error('Upload failed:', err));

window.open(`strip-img.html?userId=${userId}`, '_blank');
});
