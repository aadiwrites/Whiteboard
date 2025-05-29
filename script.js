// ==== SETUP & GLOBALS ====

const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const toolbar = document.getElementById('toolbar');
const stickyNotesContainer = document.getElementById('stickyNotesContainer');
const templateModal = document.getElementById('templateModal');
const templateList = document.getElementById('templateList');
const closeModalBtn = templateModal.querySelector('.close');

let isDrawing = false;
let currentTool = 'draw'; // draw, erase, text
let undoStack = [];
let redoStack = [];
let lines = []; // store drawn lines for undo/redo
let currentLine = [];
let eraserRadius = 10;
let textActive = false;
let gridOn = false;
let collabActive = false;

const templates = [
  {name: 'Heart', src: 'images/heart.png'},
  {name: 'Nephron', src: 'images/nephron.png'},
  {name: 'Eye', src: 'images/eye.png'}
];

// Adjust canvas size to full container
function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  redrawAll();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==== DRAWING LOGIC ====

canvas.addEventListener('pointerdown', e => {
  if (currentTool === 'draw') {
    isDrawing = true;
    currentLine = [{x: e.offsetX, y: e.offsetY}];
  } else if (currentTool === 'erase') {
    isDrawing = true;
    eraseAt(e.offsetX, e.offsetY);
  }
});

canvas.addEventListener('pointermove', e => {
  if (!isDrawing) return;
  if (currentTool === 'draw') {
    const point = {x: e.offsetX, y: e.offsetY};
    currentLine.push(point);
    drawLineSegment(currentLine);
  } else if (currentTool === 'erase') {
    eraseAt(e.offsetX, e.offsetY);
  }
});

canvas.addEventListener('pointerup', e => {
  if (isDrawing && currentTool === 'draw') {
    lines.push(currentLine);
    undoStack.push(currentLine);
    redoStack = [];
  }
  isDrawing = false;
});

function drawLineSegment(line) {
  if (line.length < 2) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(line[line.length - 2].x, line[line.length - 2].y);
  ctx.lineTo(line[line.length - 1].x, line[line.length - 1].y);
  ctx.stroke();
}

function redrawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gridOn) {
    canvas.classList.add('grid');
  } else {
    canvas.classList.remove('grid');
  }
  lines.forEach(line => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(line[0].x, line[0].y);
    for (let i = 1; i < line.length; i++) {
      ctx.lineTo(line[i].x, line[i].y);
    }
    ctx.stroke();
  });
}

// ==== ERASER ====

function eraseAt(x, y) {
  // Erase part of lines near x,y with eraserRadius
  // We remove points from lines near the eraser circle

  let erasedAny = false;
  for (let i = lines.length - 1; i >= 0; i--) {
    let line = lines[i];
    // Filter points NOT inside erase radius
    const newLine = line.filter(pt => {
      const dx = pt.x - x;
      const dy = pt.y - y;
      return dx*dx + dy*dy > eraserRadius*eraserRadius;
    });
    if (newLine.length !== line.length) {
      erasedAny = true;
      if (newLine.length < 2) {
        lines.splice(i, 1); // remove entire line if less than 2 points left
      } else {
        lines[i] = newLine;
      }
    }
  }
  if (erasedAny) {
    undoStack.push(JSON.parse(JSON.stringify(lines))); // deep copy of lines
    redoStack = [];
    redrawAll();
  }
}

// ==== UNDO / REDO ====

document.getElementById('undoBtn').addEventListener('click', () => {
  if (undoStack.length === 0) return;
  redoStack.push(undoStack.pop());
  if (undoStack.length > 0) {
    lines = JSON.parse(JSON.stringify(undoStack[undoStack.length - 1]));
  } else {
    lines = [];
  }
  redrawAll();
});

document.getElementById('redoBtn').addEventListener('click', () => {
  if (redoStack.length === 0) return;
  const redoLines = redoStack.pop();
  undoStack.push(redoLines);
  lines = JSON.parse(JSON.stringify(redoLines));
  redrawAll();
});

// ==== CLEAR ALL ====

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Clear the entire board?')) return;
  lines = [];
  undoStack = [];
  redoStack = [];
  redrawAll();
  // Also remove sticky notes
  stickyNotesContainer.innerHTML = '';
});

// ==== TOOL BUTTONS ====

function setActiveTool(tool) {
  currentTool = tool;
  textActive = false;
  document.querySelectorAll('#toolbar button').forEach(btn => btn.classList.remove('active'));
  switch(tool) {
    case 'draw': document.getElementById('drawBtn').classList.add('active'); break;
    case 'erase': document.getElementById('eraseBtn').classList.add('active'); break;
    case 'text': document.getElementById('textBtn').classList.add('active'); break;
  }
}

document.getElementById('drawBtn').addEventListener('click', () => setActiveTool('draw'));
document.getElementById('eraseBtn').addEventListener('click', () => setActiveTool('erase'));

// ==== TEXT TOOL ====

document.getElementById('textBtn').addEventListener('click', () => {
  setActiveTool('text');
  textActive = true;
  canvas.style.cursor = 'text';
});

canvas.addEventListener('click', e => {
  if (!textActive) return;
  const x = e.offsetX;
  const y = e.offsetY;
  addTextInput(x, y);
  setActiveTool('draw');
  canvas.style.cursor = 'crosshair';
  textActive = false;
});

function addTextInput(x, y) {
  const input = document.createElement('input');
  input.type = 'text';
  input.style.position = 'absolute';
  input.style.left = (canvas.offsetLeft + x) + 'px';
  input.style.top = (canvas.offsetTop + y) + 'px';
  input.style.fontSize = '16px';
  input.style.border = '1px solid #666';
  input.style.padding = '2px 4px';
  input.style.zIndex = 10;
  document.body.appendChild(input);
  input.focus();

  input.addEventListener('blur', () => {
    if (input.value.trim() !== '') {
      ctx.font = '16px Arial';
      ctx.fillStyle = 'black';
      ctx.fillText(input.value, x, y);
      lines.push([{x, y}, {x: x + 1, y: y}]); // Dummy line to keep undo working
      undoStack.push(JSON.parse(JSON.stringify(lines)));
      redoStack = [];
    }
    document.body.removeChild(input);
  });
}

// ==== SAVE AS IMAGE ====

document.getElementById('saveBtn').addEventListener('click', () => {
  // Temporarily hide sticky notes for screenshot
  stickyNotesContainer.style.display = 'none';

  const link = document.createElement('a');
  link.download = 'whiteboard.png';
  link.href = canvas.toDataURL('image/png');
  link.click();

  stickyNotesContainer.style.display = 'block';
});

// ==== GRID TOGGLE ====

document.getElementById('gridToggleBtn').addEventListener('click', () => {
  gridOn = !gridOn;
  redrawAll();
});

// ==== STICKY NOTES ====

document.getElementById('stickyNoteBtn').addEventListener('click', () => {
  addStickyNote(50, 50, 'Write here...');
});

function addStickyNote(x, y, text) {
  const note = document.createElement('div');
  note.classList.add('sticky-note');
  note.style.left = x + 'px';
  note.style.top = y + 'px';
  note.contentEditable = true;
  note.textContent = text;
  stickyNotesContainer.appendChild(note);

  // Make sticky notes draggable
  let offsetX, offsetY, isDragging = false;
  note.addEventListener('mousedown', e => {
    isDragging = true;
    offsetX = e.clientX - note.offsetLeft;
    offsetY = e.clientY - note.offsetTop;
    note.style.cursor = 'grabbing';
  });
