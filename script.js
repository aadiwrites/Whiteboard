// script.js const canvas = document.getElementById('board'); const ctx = canvas.getContext('2d'); const textInput = document.getElementById('textInput'); const stickyContainer = document.getElementById('stickyContainer');

canvas.width = window.innerWidth; canvas.height = window.innerHeight;

let drawing = false; let mode = 'draw'; let penColor = '#000000'; let penSize = 2; let eraserSize = 10; let history = []; let redoStack = [];

function setMode(m) { mode = m; }

function updatePenSize() { penSize = parseInt(document.getElementById('penSize').value); }

function updateEraserSize() { eraserSize = parseInt(document.getElementById('eraserSize').value); }

function updatePenColor() { penColor = document.getElementById('penColor').value; }

canvas.addEventListener('mousedown', startDrawing); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', stopDrawing); canvas.addEventListener('click', placeText);

function startDrawing(e) { if (mode === 'text') return; drawing = true; ctx.beginPath(); ctx.moveTo(e.clientX, e.clientY); saveHistory(); }

function draw(e) { if (!drawing) return; if (mode === 'erase') { ctx.clearRect(e.clientX - eraserSize / 2, e.clientY - eraserSize / 2, eraserSize, eraserSize); } else { ctx.lineTo(e.clientX, e.clientY); ctx.strokeStyle = penColor; ctx.lineWidth = penSize; ctx.lineCap = 'round'; ctx.stroke(); } }

function stopDrawing() { drawing = false; ctx.closePath(); }

function clearCanvas() { ctx.clearRect(0, 0, canvas.widt
