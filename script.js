const pixelGrid = document.getElementById('pixelGrid');
const colorPalette = document.getElementById('colorPalette');
const selectedColorDisplay = document.getElementById('selectedColor');
const gridSizeSlider = document.getElementById('gridSize');
const gridSizeValue = document.getElementById('gridSizeValue');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const brushTool = document.getElementById('brushTool');
const bucketTool = document.getElementById('bucketTool');

// Color palette organized in groups of 3 analogous colors
const pixelArtPalette = [
	// Row 1: Black and Greys
	'#000000', // Black
	'#5F574F', // Dark grey
	'#C2C3C7', // Light grey

	// Row 2: Orange/Red group
	'#EF5350', // Reddish-orange
	'#FF9800', // Orange
	'#FFB74D', // Light orange/peach
	'#FFCCAA', // Light skin tone

	// Row 3: Yellow/Green group
	'#FFD54F', // Golden yellow
	'#FFEE58', // Bright yellow
	'#AED581', // Light lime green

	// Row 4: Green/Teal group
	'#66BB6A', // Medium green
	'#26A69A', // Teal/blue-green
	'#4DD0E1', // Bright cyan

	// Row 5: Blue/Purple group
	'#42A5F5', // Medium blue
	'#7E57C2', // Lavender/purple
	'#BA68C8', // Light magenta/pink-purple

	// Row 6: Red/Pink group
	'#E91E63', // Pink/red
	'#F06292', // Light pink
	'#F48FB1', // Pale pink

	// Row 7: Deep Blue group
	'#1D2B53', // Dark blue
	'#3F51B5', // Indigo
	'#5C6BC0', // Medium indigo

	// Row 8: Brown/Earth group
	'#8D6E63', // Brown
	'#A1887F', // Light brown
	'#BCAAA4', // Pale brown

	// Row 9: Deep Green group
	'#2E7D32', // Dark green
	'#388E3C', // Medium-dark green
	'#4CAF50' // Medium green
];

let selectedColor = '#000000';
let gridSize = 32;
let isDrawing = false;
let currentPixelIndex = 0;
let pixels = [];
let currentTool = 'brush'; // 'brush' or 'bucket'
let undoHistory = [];
let maxHistorySize = 50;

// Initialize color palette
function initPalette() {
	colorPalette.innerHTML = '';
	pixelArtPalette.forEach((color, index) => {
		const swatch = document.createElement('div');
		swatch.className = 'color-swatch';
		swatch.style.backgroundColor = color;
		swatch.dataset.color = color;
		if (index === 0) {
			swatch.classList.add('selected');
		}
		swatch.addEventListener('click', () => selectColor(color, swatch));
		colorPalette.appendChild(swatch);
	});
}

// Select a color
function selectColor(color, swatchElement) {
	selectedColor = color;
	selectedColorDisplay.style.backgroundColor = color;

	// Update selected state
	document.querySelectorAll('.color-swatch').forEach((swatch) => {
		swatch.classList.remove('selected');
	});
	if (swatchElement) {
		swatchElement.classList.add('selected');
	} else {
		// Find the swatch element if not provided
		document.querySelectorAll('.color-swatch').forEach((swatch) => {
			if (swatch.dataset.color === color) {
				swatch.classList.add('selected');
			}
		});
	}
}

// Get pixel element by index
function getPixel(index) {
	return pixels[index];
}

// Update current pixel highlight
function updateCurrentPixel() {
	pixels.forEach((pixel, index) => {
		if (index === currentPixelIndex) {
			pixel.classList.add('current');
		} else {
			pixel.classList.remove('current');
		}
	});
}

// Paint pixel (with toggle/delete functionality)
function paintPixel(index, color, isClick = false, isStartOfAction = false) {
	const pixel = getPixel(index);
	if (!pixel) return;

	const currentColor = pixel.style.backgroundColor || '#ffffff';

	// Normalize colors for comparison
	const normalizedCurrent = normalizeColor(currentColor);
	const normalizedSelected = normalizeColor(color);

	// Save state before painting if this is the start of a new action
	if (isStartOfAction && !isDrawing) {
		saveState();
		isDrawing = true;
	}

	// If clicking (not dragging) on a pixel that's already the selected color, delete it (make white)
	if (isClick && normalizedCurrent === normalizedSelected) {
		pixel.style.backgroundColor = '#ffffff';
	} else {
		pixel.style.backgroundColor = color;
	}
}

// Normalize color for comparison (handles rgb, hex, etc.)
function normalizeColor(color) {
	if (!color) return '#FFFFFF';
	if (color.startsWith('#')) {
		return color.toUpperCase();
	}
	if (color.startsWith('rgb')) {
		const matches = color.match(/\d+/g);
		if (matches && matches.length >= 3) {
			const r = parseInt(matches[0]).toString(16).padStart(2, '0');
			const g = parseInt(matches[1]).toString(16).padStart(2, '0');
			const b = parseInt(matches[2]).toString(16).padStart(2, '0');
			return `#${r}${g}${b}`.toUpperCase();
		}
	}
	return color.toUpperCase();
}

// Get pixel color at index
function getPixelColor(index) {
	const pixel = getPixel(index);
	if (!pixel) return '#FFFFFF';
	return pixel.style.backgroundColor || '#ffffff';
}

// Save current canvas state to history
function saveState() {
	const state = pixels.map((pixel) => {
		return pixel.style.backgroundColor || '#ffffff';
	});
	undoHistory.push(state);

	// Limit history size
	if (undoHistory.length > maxHistorySize) {
		undoHistory.shift();
	}
}

// Restore canvas state from history
function restoreState(state) {
	if (!state) return;
	state.forEach((color, index) => {
		const pixel = getPixel(index);
		if (pixel) {
			pixel.style.backgroundColor = color;
		}
	});
}

// Undo last action
function undo() {
	if (undoHistory.length === 0) return;

	const previousState = undoHistory.pop();
	restoreState(previousState);
}

// Flood fill algorithm (paint bucket)
function floodFill(startIndex, fillColor) {
	// Save state before filling
	saveState();

	const startColor = normalizeColor(getPixelColor(startIndex));
	const normalizedFillColor = normalizeColor(fillColor);

	// If start color is same as fill color, do nothing
	if (startColor === normalizedFillColor) {
		undoHistory.pop(); // Remove the state we just saved since nothing changed
		return;
	}

	const size = gridSize;
	const stack = [startIndex];
	const visited = new Set();

	while (stack.length > 0) {
		const index = stack.pop();

		// Skip if already visited or out of bounds
		if (visited.has(index) || index < 0 || index >= size * size) {
			continue;
		}

		// Skip if color doesn't match start color
		const currentColor = normalizeColor(getPixelColor(index));
		if (currentColor !== startColor) {
			continue;
		}

		// Fill this pixel
		const pixel = getPixel(index);
		if (pixel) {
			pixel.style.backgroundColor = fillColor;
		}
		visited.add(index);

		// Add neighbors to stack
		const row = Math.floor(index / size);
		const col = index % size;

		// Up
		if (row > 0) {
			stack.push(index - size);
		}
		// Down
		if (row < size - 1) {
			stack.push(index + size);
		}
		// Left
		if (col > 0) {
			stack.push(index - 1);
		}
		// Right
		if (col < size - 1) {
			stack.push(index + 1);
		}
	}
}

// Create pixel grid
function createGrid(size) {
	pixelGrid.innerHTML = '';
	pixelGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
	pixels = [];

	// Calculate pixel size based on grid size to keep canvas reasonable
	const maxCanvasSize = 600;
	const pixelSize = Math.max(8, Math.floor(maxCanvasSize / size));

	for (let i = 0; i < size * size; i++) {
		const pixel = document.createElement('div');
		pixel.className = 'pixel';
		pixel.style.width = `${pixelSize}px`;
		pixel.style.height = `${pixelSize}px`;
		pixel.style.backgroundColor = '#ffffff';
		pixel.dataset.index = i;

		pixel.addEventListener('mousedown', (e) => {
			e.preventDefault();
			currentPixelIndex = i;
			updateCurrentPixel();

			if (currentTool === 'bucket') {
				floodFill(i, selectedColor);
			} else {
				paintPixel(i, selectedColor, true, true);
			}
		});

		pixel.addEventListener('mouseenter', () => {
			if (isDrawing && currentTool === 'brush') {
				paintPixel(i, selectedColor, false, false);
			}
		});

		pixel.addEventListener('touchstart', (e) => {
			e.preventDefault();
			currentPixelIndex = i;
			updateCurrentPixel();

			if (currentTool === 'bucket') {
				floodFill(i, selectedColor);
			} else {
				paintPixel(i, selectedColor, true, true);
			}
		});

		pixel.addEventListener('touchmove', (e) => {
			e.preventDefault();
			if (isDrawing && currentTool === 'brush') {
				const touch = e.touches[0];
				const element = document.elementFromPoint(touch.clientX, touch.clientY);
				if (element && element.classList.contains('pixel')) {
					const index = parseInt(element.dataset.index);
					currentPixelIndex = index;
					updateCurrentPixel();
					paintPixel(index, selectedColor, false, false);
				}
			}
		});

		pixels.push(pixel);
		pixelGrid.appendChild(pixel);
	}

	// Reset current pixel index and update highlight
	currentPixelIndex = 0;
	updateCurrentPixel();
	updateToolCursor();
}

// Grid size slider
gridSizeSlider.addEventListener('input', (e) => {
	gridSize = parseInt(e.target.value);
	gridSizeValue.textContent = gridSize;
	createGrid(gridSize);
	// Refocus grid after recreation
	setTimeout(() => pixelGrid.focus(), 0);
});

// Stop drawing when mouse is released
document.addEventListener('mouseup', () => {
	if (isDrawing) {
		isDrawing = false;
	}
});

document.addEventListener('touchend', () => {
	if (isDrawing) {
		isDrawing = false;
	}
});

// Arrow key navigation and painting
pixelGrid.addEventListener('keydown', (e) => {
	const size = gridSize;
	let newIndex = currentPixelIndex;

	switch (e.key) {
		case 'ArrowUp':
			e.preventDefault();
			if (currentPixelIndex >= size) {
				newIndex = currentPixelIndex - size;
			}
			break;
		case 'ArrowDown':
			e.preventDefault();
			if (currentPixelIndex < size * (size - 1)) {
				newIndex = currentPixelIndex + size;
			}
			break;
		case 'ArrowLeft':
			e.preventDefault();
			if (currentPixelIndex % size !== 0) {
				newIndex = currentPixelIndex - 1;
			}
			break;
		case 'ArrowRight':
			e.preventDefault();
			if (currentPixelIndex % size !== size - 1) {
				newIndex = currentPixelIndex + 1;
			}
			break;
		case ' ':
			e.preventDefault();
			// Spacebar to paint or fill
			if (currentTool === 'bucket') {
				floodFill(currentPixelIndex, selectedColor);
			} else {
				paintPixel(currentPixelIndex, selectedColor, true, true);
			}
			return;
		default:
			return;
	}

	currentPixelIndex = newIndex;
	updateCurrentPixel();

	// Auto-scroll to keep current pixel visible
	const pixel = getPixel(currentPixelIndex);
	if (pixel) {
		pixel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}
});

// Global keyboard shortcuts (undo)
document.addEventListener('keydown', (e) => {
	// Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
	if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
		e.preventDefault();
		undo();
	}
});

// Export to PNG
function exportToPNG() {
	const size = gridSize;
	const pixelSize = Math.max(8, Math.floor(600 / size));
	const canvasSize = size * pixelSize;

	// Create a temporary canvas
	const canvas = document.createElement('canvas');
	canvas.width = canvasSize;
	canvas.height = canvasSize;
	const ctx = canvas.getContext('2d');

	// Disable smoothing for pixel-perfect rendering
	ctx.imageSmoothingEnabled = false;

	// Draw each pixel
	pixels.forEach((pixel, index) => {
		const row = Math.floor(index / size);
		const col = index % size;
		const x = col * pixelSize;
		const y = row * pixelSize;

		const bgColor = pixel.style.backgroundColor || '#ffffff';
		const normalizedColor = normalizeColor(bgColor);

		// Skip white pixels (leave them transparent)
		if (normalizedColor !== '#FFFFFF') {
			ctx.fillStyle = bgColor;
			ctx.fillRect(x, y, pixelSize, pixelSize);
		}
	});

	// Convert to blob and download
	canvas.toBlob((blob) => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `pixel-art-${Date.now()}.png`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	});
}

// Clear canvas
clearBtn.addEventListener('click', () => {
	saveState();
	pixels.forEach((pixel) => {
		pixel.style.backgroundColor = '#ffffff';
	});
	currentPixelIndex = 0;
	updateCurrentPixel();
});

// Export button
exportBtn.addEventListener('click', exportToPNG);

// Tool selection
function updateToolCursor() {
	if (currentTool === 'bucket') {
		pixelGrid.style.cursor = 'grab';
		pixels.forEach((pixel) => {
			pixel.style.cursor = 'grab';
		});
	} else {
		pixelGrid.style.cursor = 'crosshair';
		pixels.forEach((pixel) => {
			pixel.style.cursor = 'pointer';
		});
	}
}

brushTool.addEventListener('click', () => {
	currentTool = 'brush';
	brushTool.classList.add('active');
	bucketTool.classList.remove('active');
	updateToolCursor();
});

bucketTool.addEventListener('click', () => {
	currentTool = 'bucket';
	bucketTool.classList.add('active');
	brushTool.classList.remove('active');
	updateToolCursor();
});

// Initialize
initPalette();
selectColor('#000000');
createGrid(gridSize);

// Save initial state
saveState();

// Focus the grid for keyboard navigation
pixelGrid.focus();
