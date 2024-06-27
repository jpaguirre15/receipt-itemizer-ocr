const canvas = document.getElementById('receiptCanvas');
const ctx = canvas.getContext('2d');
const loadingIndicator = document.getElementById('loading');
let img = new Image();

document.getElementById('receiptImage').addEventListener('change', handleImage, false);

function handleImage(e) {
  const reader = new FileReader();
  reader.onload = function(event) {
    img = new Image();
    img.onload = function() {
      preprocessImage(img);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
}

function preprocessImage(image) {
  const maxDim = 1024;
  let width = image.width;
  let height = image.height;

  if (width > height) {
    if (width > maxDim) {
      height *= maxDim / width;
      width = maxDim;
    }
  } else {
    if (height > maxDim) {
      width *= maxDim / height;
      height = maxDim;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
}

const extractText = async (imageDataURL) => {
  return new Promise((resolve, reject) => {
    const worker = Tesseract.createWorker({
      logger: (m) => console.log(m), // Optional: log progress
    });
    (async () => {
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const result = await worker.recognize(imageDataURL);
      await worker.terminate();
      resolve(result.data.text);
    })();
  });
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
  loadingIndicator.style.display = 'block';
  const dataURL = canvas.toDataURL('image/png');
  const text = await extractText(dataURL);
  const items = parseReceipt(text);
  displayChecklist(items);
  loadingIndicator.style.display = 'none';
};

const displayChecklist = (items) => {
  const checklist = document.getElementById('checklist');
  checklist.innerHTML = ''; // Clear previous items
  items.forEach((item, index) => {
    const itemElement = document.createElement('div');
    itemElement.className = 'item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `item-${index}`;
    checkbox.value = item.item;

    const label = document.createElement('label');
    label.htmlFor = `item-${index}`;
    label.textContent = `${item.item}: $${item.price}`;

    itemElement.appendChild(checkbox);
    itemElement.appendChild(label);
    checklist.appendChild(itemElement);
  });
};

const submitChecklist = () => {
  const checkedItems = [];
  const checkboxes = document.querySelectorAll('#checklist input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      checkedItems.push(checkbox.value);
    }
  });
  console.log('Submitted items:', checkedItems);
  // Further processing for the submitted items can be added here
};
