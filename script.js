const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let currentTool = 'draw';
let paths = [];
let undone = [];

let currentPath = [];

canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);

canvas.addEventListener('touchstart', (e) => start(e.touches[0]));
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  draw(e.touches[0]);
}, { passive: false });
canvas.addEventListener('touchend', stop);

canvas.addEventListener('click', handleTextClick);

function setMode(mode) {
  currentTool = mode;
}

function start(e) {
  if (currentTool !== 'draw' && currentTool !== 'erase') return;
  drawing = true;
  currentPath = [];
  ctx.beginPath();
  ctx.moveTo(e.clientX, e.clientY);
  currentPath.push([e.clientX, e.clientY]);
}

function draw(e) {
  if (!drawing) return;
  ctx.lineTo(e.clientX, e.clientY);
  ctx.strokeStyle = currentTool === 'erase' ? '#ffffff' : '#000000';
  ctx.lineWidth = currentTool === 'erase' ? 20 : 2;
  ctx.lineCap = 'round';
  ctx.stroke();
  currentPath.push([e.clientX, e.clientY]);
}

function stop() {
  if (!drawing) return;
  drawing = false;
  paths.push({ type: currentTool, points: currentPath });
  undone = [];
}

function undo() {
  if (paths.length === 0) return;
  undone.push(paths.pop());
  redraw();
}

function redo() {
  if (undone.length === 0) return;
  paths.push(undone.pop());
  redraw();
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paths = [];
  undone = [];
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paths.forEach(p => {
    ctx.beginPath();
    ctx.moveTo(p.points[0][0], p.points[0][1]);
    p.points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.strokeStyle = p.type === 'erase' ? '#ffffff' : '#000000';
    ctx.lineWidth = p.type === 'erase' ? 20 : 2;
    ctx.stroke();
  });
}

function handleTextClick(e) {
  if (currentTool !== 'text') return;

  textInput.style.left = e.clientX + 'px';
  textInput.style.top = e.clientY + 'px';
  textInput.style.display = 'block';
  textInput.focus();

  textInput.onkeydown = function (evt) {
    if (evt.key === 'Enter') {
      const text = textInput.value;
      ctx.fillStyle = '#000000';
      ctx.font = '18px sans-serif';
      ctx.fillText(text, e.clientX, e.clientY);
      textInput.value = '';
      textInput.style.display = 'none';
    }
  };
}
