const canvas = document.getElementById('receiptCanvas');
const ctx = canvas.getContext('2d');
let img = new Image();

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
  const dataURL = canvas.toDataURL('image/png');
  const text = await extractText(dataURL);
  const items = parseReceipt(text);
  displayChecklist(items);
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
  // You can add further processing for the submitted items here
};
