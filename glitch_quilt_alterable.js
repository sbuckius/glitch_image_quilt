// ✅ Replace with your Firebase config
const firebaseConfig = {

  apiKey: "AIzaSyAkStOxZYoqVPWBp1-qigNC9ILOn6Vlw5Q",

  authDomain: "glitchimagequilt.firebaseapp.com",

  projectId: "glitchimagequilt",

  storageBucket: "glitchimagequilt.firebasestorage.app",

  messagingSenderId: "722799290406",

  appId: "1:722799290406:web:e7ede568905ceb04ff9ee7",

  measurementId: "G-F6XSV2Y2FM"

};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let quiltImages = [];
const gridSize = 100;
let draggingImage = null;
let offsetX = 0;
let offsetY = 0;

function setup() {
  createCanvas(1200, 800);
  background(255);

  const input = document.getElementById("imgUpload");
  input.addEventListener("change", handleImageUpload);

  db.ref("quiltImages").on("child_added", snapshot => {
    const data = snapshot.val();
    loadImage(data.base64, img => {
      quiltImages.push({ ...data, img });
    });
  });

  db.ref("quiltImages").on("child_changed", snapshot => {
    const changed = snapshot.val();
    for (let item of quiltImages) {
      if (item.id === changed.id) {
        item.x = changed.x;
        item.y = changed.y;
      }
    }
  });

  db.ref("quiltImages").on("child_removed", snapshot => {
    const removed = snapshot.val();
    quiltImages = quiltImages.filter(item => item.id !== removed.id);
  });
}

function draw() {
  background(240);
  for (let item of quiltImages) {
    if (item.img) {
      image(item.img, item.x, item.y, item.w, item.h);
    }
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result;
    const id = db.ref().child("quiltImages").push().key;

    const gridX = Math.floor(random(width) / gridSize) * gridSize;
    const gridY = Math.floor(random(height) / gridSize) * gridSize;

    const data = {
      id,
      base64,
      x: gridX,
      y: gridY,
      w: gridSize,
      h: gridSize
    };

    db.ref("quiltImages/" + id).set(data);
  };

  reader.readAsDataURL(file);
}

function mousePressed() {
  for (let item of quiltImages) {
    if (mouseX > item.x && mouseX < item.x + item.w &&
        mouseY > item.y && mouseY < item.y + item.h) {
      draggingImage = item;
      offsetX = mouseX - item.x;
      offsetY = mouseY - item.y;
      break;
    }
  }
}

function mouseDragged() {
  if (draggingImage) {
    draggingImage.x = mouseX - offsetX;
    draggingImage.y = mouseY - offsetY;
  }
}

function mouseReleased() {
  if (draggingImage) {
    // Snap to grid
    draggingImage.x = Math.floor(draggingImage.x / gridSize) * gridSize;
    draggingImage.y = Math.floor(draggingImage.y / gridSize) * gridSize;

    // Update in Firebase
    db.ref("quiltImages/" + draggingImage.id).update({
      x: draggingImage.x,
      y: draggingImage.y
    });

    draggingImage = null;
  }
}

function saveQuilt() {
  saveCanvas("digital_quilt", "png");
}

function resetQuilt() {
  if (confirm("Are you sure you want to delete all quilt images?")) {
    db.ref("quiltImages").remove().then(() => {
      quiltImages = [];
    });
  }
}
