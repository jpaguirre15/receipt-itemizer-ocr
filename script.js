const canvas = document.getElementById('highlightCanvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let isFirstTap = true;
let startX, startY, endX, endY;
let rectangles = [];

// Handle image upload
document.getElementById('receiptImage').addEventListener('change', handleImage, false);

function handleImage(e) {
  const reader = new FileReader();
  reader.onload = function(event) {
    img = new Image();
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
}

// Handle touch events
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  if (isFirstTap) {
    startX = x;
    startY = y;
    isFirstTap = false;
  } else {
    endX = x;
    endY = y;
    isFirstTap = true;
    rectangles.push({ startX, startY, endX, endY });
    drawRectangle(startX, startY, endX, endY);
  }
});

function drawRectangle(startX, startY, endX, endY) {
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(startX, startY, endX - startX, endY - startY);
  ctx.stroke();
}

const extractText = async (imageDataURL) => {
  const result = await Tesseract.recognize(imageDataURL, 'eng', {
    logger: (m) => console.log(m), // Optional: log progress
  });
  return result.data.text;
};

const parseReceipt = (text) => {
  const lines = text.split('\n');
  const items = [];

  lines.forEach((line) => {
    const match = line.match(/(.+?)\s+([\d,.]+)$/);
    if (match) {
      items.push({
        item: match[1].trim(),
        price: match[2].trim(),
      });
    }
  });

  return items;
};

const processReceipt = async () => {
  const items = [];
  for (const rect of rectangles) {
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    const width = rect.endX - rect.startX;
    const height = rect.endY - rect.startY;
    croppedCanvas.width = width;
    croppedCanvas.height = height;
    croppedCtx.drawImage(canvas, rect.startX, rect.startY, width, height, 0, 0, width, height);
    const dataURL = croppedCanvas.toDataURL('image/png');
    const text = await extractText(dataURL);
    const parsedItems = parseReceipt(text);
    items.push(...parsedItems);
  }
  displayItems(items);
};

const displayItems = (items) => {
  const itemsList = document.getElementById('itemsList');
  itemsList.innerHTML = ''; // Clear previous items
  items.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.textContent = `${item.item}: $${item.price}`;
    itemsList.appendChild(itemElement);
  });
};
