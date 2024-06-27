const canvas = document.getElementById('highlightCanvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let startX, startY, endX, endY, isDrawing = false;
let rectangles = [];

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

canvas.addEventListener('mousedown', (e) => {
  startX = e.offsetX;
  startY = e.offsetY;
  isDrawing = true;
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    endX = e.offsetX;
    endY = e.offsetY;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.beginPath();
    ctx.rect(startX, startY, endX - startX, endY - startY);
    ctx.stroke();
  }
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
  rectangles.push({ startX, startY, width: endX - startX, height: endY - startY });
});

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
    croppedCanvas.width = rect.width;
    croppedCanvas.height = rect.height;
    croppedCtx.drawImage(canvas, rect.startX, rect.startY, rect.width, rect.height, 0, 0, rect.width, rect.height);
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
