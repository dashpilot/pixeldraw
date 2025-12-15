const pixelGrid = document.getElementById('pixelGrid');
const colorPalette = document.getElementById('colorPalette');
const gridSizeButtons = document.querySelectorAll('.btn-grid-size');
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const exportBtn = document.getElementById('exportBtn');
const exportPngBtn = document.getElementById('exportPngBtn');
const exportSvgBtn = document.getElementById('exportSvgBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const vectorizeBtn = document.getElementById('vectorizeBtn');
const brushTool = document.getElementById('brushTool');
const eraserTool = document.getElementById('eraserTool');
const bucketTool = document.getElementById('bucketTool');
const eraserSizeControl = document.getElementById('eraserSizeControl');
const eraserSizeSlider = document.getElementById('eraserSize');
const eraserSizeValue = document.getElementById('eraserSizeValue');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const moveUpBtn = document.getElementById('moveUpBtn');
const moveDownBtn = document.getElementById('moveDownBtn');
const moveLeftBtn = document.getElementById('moveLeftBtn');
const moveRightBtn = document.getElementById('moveRightBtn');
const previewCanvas = document.getElementById('previewCanvas');

// Modal elements
const saveModal = document.getElementById('saveModal');
const loadModal = document.getElementById('loadModal');
const exportModal = document.getElementById('exportModal');
const vectorizeModal = document.getElementById('vectorizeModal');
const closeSaveModal = document.getElementById('closeSaveModal');
const closeLoadModal = document.getElementById('closeLoadModal');
const closeExportModal = document.getElementById('closeExportModal');
const closeVectorizeModal = document.getElementById('closeVectorizeModal');
const closeVectorizeBtn = document.getElementById('closeVectorizeBtn');
const artworkNameInput = document.getElementById('artworkName');
const confirmSaveBtn = document.getElementById('confirmSaveBtn');
const cancelSaveBtn = document.getElementById('cancelSaveBtn');
const savedArtworksList = document.getElementById('savedArtworksList');
const vectorPreview = document.getElementById('vectorPreview');
const smoothPathsCheckbox = document.getElementById('smoothPaths');
const simplifyPathsCheckbox = document.getElementById('simplifyPaths');
const maxDistanceSlider = document.getElementById('maxDistance');
const maxDistanceValue = document.getElementById('maxDistanceValue');
const regenerateVectorBtn = document.getElementById('regenerateVector');
const downloadVectorBtn = document.getElementById('downloadVectorBtn');

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
let gridSize = 16;
let isDrawing = false;
let currentPixelIndex = 0;
let pixels = [];
let currentTool = 'brush'; // 'brush', 'eraser', or 'bucket'
let eraserSize = 2;
let undoHistory = [];
let maxHistorySize = 50;
let isShiftPressed = false;
let drawStartIndex = -1;

// LocalStorage key
const STORAGE_KEY = 'pixelArtworks';

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

// Clear current pixel highlight
function clearCurrentPixel() {
	pixels.forEach((pixel) => {
		pixel.classList.remove('current');
	});
	currentPixelIndex = -1;
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
	updatePreview();
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
	updatePreview();
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
	updatePreview();
}

// Eraser function - erases multiple pixels at once
function erasePixels(centerIndex) {
	const centerRow = Math.floor(centerIndex / gridSize);
	const centerCol = centerIndex % gridSize;
	const radius = Math.floor(eraserSize / 2);

	for (let offsetRow = -radius; offsetRow <= radius; offsetRow++) {
		for (let offsetCol = -radius; offsetCol <= radius; offsetCol++) {
			const row = centerRow + offsetRow;
			const col = centerCol + offsetCol;

			// Check if within bounds
			if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
				const index = row * gridSize + col;
				if (pixels[index]) {
					pixels[index].style.backgroundColor = '#ffffff';
				}
			}
		}
	}
	updatePreview();
}

// Create pixel grid
function createGrid(size) {
	pixelGrid.innerHTML = '';
	pixelGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
	pixels = [];

	// Use fixed canvas size of 512px (divisible by all grid sizes: 8, 16, 32, 64)
	// Account for 1px gaps between pixels: total size = (N * pixelSize) + ((N-1) * 1px)
	// Solving for pixelSize: N * pixelSize + N - 1 = 512, so pixelSize = (513 - N) / N
	const fixedCanvasSize = 512;
	const pixelSize = (fixedCanvasSize + 1 - size) / size;

	for (let i = 0; i < size * size; i++) {
		const pixel = document.createElement('div');
		pixel.className = 'pixel';
		pixel.style.width = `${pixelSize}px`;
		pixel.style.height = `${pixelSize}px`;
		pixel.style.backgroundColor = '#ffffff';
		pixel.dataset.index = i;

		pixel.addEventListener('mousedown', (e) => {
			e.preventDefault();
			drawStartIndex = i;

			if (currentTool === 'bucket') {
				currentPixelIndex = i;
				updateCurrentPixel();
				floodFill(i, selectedColor);
			} else if (currentTool === 'eraser') {
				clearCurrentPixel();
				saveState();
				isDrawing = true;
				erasePixels(i);
			} else {
				currentPixelIndex = i;
				updateCurrentPixel();
				paintPixel(i, selectedColor, true, true);
			}
		});

		pixel.addEventListener('mouseenter', () => {
			if (isDrawing) {
				if (currentTool === 'brush') {
					const constrainedIndex = getConstrainedIndex(i, drawStartIndex);
					currentPixelIndex = constrainedIndex;
					updateCurrentPixel();
					paintPixel(constrainedIndex, selectedColor, false, false);
				} else if (currentTool === 'eraser') {
					erasePixels(i);
				}
			}
		});

		pixel.addEventListener('touchstart', (e) => {
			e.preventDefault();
			drawStartIndex = i;

			if (currentTool === 'bucket') {
				currentPixelIndex = i;
				updateCurrentPixel();
				floodFill(i, selectedColor);
			} else if (currentTool === 'eraser') {
				clearCurrentPixel();
				saveState();
				isDrawing = true;
				erasePixels(i);
			} else {
				currentPixelIndex = i;
				updateCurrentPixel();
				paintPixel(i, selectedColor, true, true);
			}
		});

		pixel.addEventListener('touchmove', (e) => {
			e.preventDefault();
			if (isDrawing) {
				const touch = e.touches[0];
				const element = document.elementFromPoint(touch.clientX, touch.clientY);
				if (element && element.classList.contains('pixel')) {
					const index = parseInt(element.dataset.index);
					if (currentTool === 'brush') {
						const constrainedIndex = getConstrainedIndex(index, drawStartIndex);
						currentPixelIndex = constrainedIndex;
						updateCurrentPixel();
						paintPixel(constrainedIndex, selectedColor, false, false);
					} else if (currentTool === 'eraser') {
						erasePixels(index);
					}
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
	updatePreview();
}

// Update preview canvas
function updatePreview() {
	const ctx = previewCanvas.getContext('2d');
	const canvasSize = 200;
	const pixelSize = canvasSize / gridSize;

	// Set canvas dimensions
	previewCanvas.width = canvasSize;
	previewCanvas.height = canvasSize;

	// Clear canvas
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, canvasSize, canvasSize);

	// Disable image smoothing to prevent anti-aliasing
	ctx.imageSmoothingEnabled = false;

	// Draw each pixel with proper alignment to eliminate gaps
	pixels.forEach((pixel, index) => {
		const row = Math.floor(index / gridSize);
		const col = index % gridSize;
		const x = Math.round(col * pixelSize);
		const y = Math.round(row * pixelSize);
		const w = Math.round((col + 1) * pixelSize) - x;
		const h = Math.round((row + 1) * pixelSize) - y;

		const color = pixel.style.backgroundColor || '#ffffff';
		const normalizedColor = normalizeColor(color);

		ctx.fillStyle = normalizedColor;
		ctx.fillRect(x, y, w, h);
	});
}

// Scale pixel data when changing grid size
function scalePixelData(oldSize, newSize, oldPixelColors) {
	const scaleFactor = newSize / oldSize;
	const newPixelColors = new Array(newSize * newSize).fill('#ffffff');

	if (scaleFactor >= 1) {
		// Upscaling: each old pixel becomes a block of pixels
		for (let oldRow = 0; oldRow < oldSize; oldRow++) {
			for (let oldCol = 0; oldCol < oldSize; oldCol++) {
				const oldIndex = oldRow * oldSize + oldCol;
				const color = oldPixelColors[oldIndex];

				// Fill the corresponding block in the new grid
				for (let dy = 0; dy < scaleFactor; dy++) {
					for (let dx = 0; dx < scaleFactor; dx++) {
						const newRow = oldRow * scaleFactor + dy;
						const newCol = oldCol * scaleFactor + dx;
						const newIndex = newRow * newSize + newCol;
						newPixelColors[newIndex] = color;
					}
				}
			}
		}
	} else {
		// Downscaling: sample from blocks using nearest-neighbor
		const inverseScale = oldSize / newSize;
		for (let newRow = 0; newRow < newSize; newRow++) {
			for (let newCol = 0; newCol < newSize; newCol++) {
				// Sample from the center of the corresponding block in the old grid
				const oldRow = Math.floor((newRow + 0.5) * inverseScale);
				const oldCol = Math.floor((newCol + 0.5) * inverseScale);
				const oldIndex = oldRow * oldSize + oldCol;
				const newIndex = newRow * newSize + newCol;
				newPixelColors[newIndex] = oldPixelColors[oldIndex];
			}
		}
	}

	return newPixelColors;
}

// Grid size buttons
gridSizeButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const newSize = parseInt(button.dataset.size);
		const oldSize = gridSize;

		// If size hasn't changed, do nothing
		if (newSize === oldSize) return;

		// Capture current pixel colors
		const oldPixelColors = pixels.map(
			(pixel) => pixel.style.backgroundColor || '#ffffff'
		);

		// Check if canvas has any non-white pixels
		const hasContent = oldPixelColors.some(
			(color) => normalizeColor(color) !== '#FFFFFF'
		);

		// Warn if downscaling with content
		if (hasContent && newSize < oldSize) {
			const confirmed = confirm(
				`Switching to a smaller grid (${oldSize}→${newSize}) will lose detail. Continue?`
			);
			if (!confirmed) {
				return; // User cancelled, don't change grid size
			}
			// Save state before downscaling so user can undo
			saveState();
		}

		// Scale the pixel data if there's content
		let scaledColors = null;
		if (hasContent) {
			scaledColors = scalePixelData(oldSize, newSize, oldPixelColors);
		}

		// Update grid size
		gridSize = newSize;

		// Update active state
		gridSizeButtons.forEach((btn) => btn.classList.remove('active'));
		button.classList.add('active');

		// Create new grid
		createGrid(gridSize);

		// Apply scaled colors if we had content
		if (scaledColors) {
			scaledColors.forEach((color, index) => {
				if (pixels[index]) {
					pixels[index].style.backgroundColor = color;
				}
			});
			updatePreview();
		}

		// Refocus grid after recreation
		setTimeout(() => pixelGrid.focus(), 0);
	});
});

// Set initial active state for grid size 16
gridSizeButtons.forEach((button) => {
	if (parseInt(button.dataset.size) === 16) {
		button.classList.add('active');
	}
});

// Stop drawing when mouse is released
document.addEventListener('mouseup', () => {
	if (isDrawing) {
		isDrawing = false;
		drawStartIndex = -1;
	}
});

// Clear current pixel highlight when clicking outside the canvas
document.addEventListener('mousedown', (e) => {
	const clickedInsideGrid = pixelGrid.contains(e.target);
	if (!clickedInsideGrid) {
		clearCurrentPixel();
	}
});

// Constrain drawing to straight or 45-degree lines when Shift is pressed
function getConstrainedIndex(currentIndex, startIndex) {
	if (!isShiftPressed || startIndex === -1) {
		return currentIndex;
	}

	const startRow = Math.floor(startIndex / gridSize);
	const startCol = startIndex % gridSize;
	const currentRow = Math.floor(currentIndex / gridSize);
	const currentCol = currentIndex % gridSize;

	const deltaRow = currentRow - startRow;
	const deltaCol = currentCol - startCol;

	// If already at start position, return current
	if (deltaRow === 0 && deltaCol === 0) {
		return currentIndex;
	}

	const absDeltaRow = Math.abs(deltaRow);
	const absDeltaCol = Math.abs(deltaCol);

	let constrainedRow = currentRow;
	let constrainedCol = currentCol;

	// Determine which constraint to use based on angle
	// 0°/180° (horizontal), 90°/270° (vertical), or 45°/135°/225°/315° (diagonal)
	if (absDeltaCol === 0) {
		// Perfectly vertical
		constrainedCol = startCol;
	} else if (absDeltaRow === 0) {
		// Perfectly horizontal
		constrainedRow = startRow;
	} else {
		const ratio = absDeltaRow / absDeltaCol;

		if (ratio < 0.5) {
			// Closer to horizontal
			constrainedRow = startRow;
		} else if (ratio > 2) {
			// Closer to vertical
			constrainedCol = startCol;
		} else {
			// Closer to 45-degree diagonal
			const minDelta = Math.min(absDeltaRow, absDeltaCol);
			constrainedRow = startRow + (deltaRow > 0 ? minDelta : -minDelta);
			constrainedCol = startCol + (deltaCol > 0 ? minDelta : -minDelta);
		}
	}

	return constrainedRow * gridSize + constrainedCol;
}

// Track Shift key state
document.addEventListener('keydown', (e) => {
	if (e.key === 'Shift') {
		isShiftPressed = true;
	}
});

document.addEventListener('keyup', (e) => {
	if (e.key === 'Shift') {
		isShiftPressed = false;
	}
});

document.addEventListener('touchend', () => {
	if (isDrawing) {
		isDrawing = false;
		drawStartIndex = -1;
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

// Export to SVG
function exportToSVG() {
	const size = gridSize;
	const pixelSize = 20; // Each pixel will be 20x20 units in the SVG (2x larger)
	const svgSize = size * pixelSize;

	// Create SVG header
	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" shape-rendering="crispEdges">\n`;

	// Add each colored pixel as a rect
	pixels.forEach((pixel, index) => {
		const row = Math.floor(index / size);
		const col = index % size;
		const x = col * pixelSize;
		const y = row * pixelSize;

		const bgColor = pixel.style.backgroundColor || '#ffffff';
		const normalizedColor = normalizeColor(bgColor);

		// Skip white pixels (leave them transparent)
		if (normalizedColor !== '#FFFFFF') {
			svg += `  <rect x="${x}" y="${y}" width="${pixelSize}" height="${pixelSize}" fill="${normalizedColor}"/>\n`;
		}
	});

	svg += '</svg>';

	// Create blob and download
	const blob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `pixel-art-${Date.now()}.svg`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Export current canvas as JSON
function exportCurrentCanvasAsJSON() {
	const exportData = {
		name: 'Current Canvas',
		gridSize: gridSize,
		timestamp: new Date().toISOString(),
		pixels: []
	};

	// Convert pixel array to coordinate-based format
	pixels.forEach((pixel, index) => {
		const color = pixel.style.backgroundColor || '#ffffff';
		const normalizedColor = normalizeColor(color);

		// Only export non-white pixels
		if (normalizedColor !== '#FFFFFF') {
			const row = Math.floor(index / gridSize);
			const col = index % gridSize;
			exportData.pixels.push({
				x: col,
				y: row,
				color: normalizedColor
			});
		}
	});

	// Create and download the JSON file
	const jsonString = JSON.stringify(exportData, null, 2);
	const blob = new Blob([jsonString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `pixel-art-${Date.now()}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Undo button
undoBtn.addEventListener('click', () => {
	undo();
});

// Clear canvas
clearBtn.addEventListener('click', () => {
	const confirmed = confirm('Are you sure you want to clear the canvas?');
	if (!confirmed) {
		return;
	}
	saveState();
	pixels.forEach((pixel) => {
		pixel.style.backgroundColor = '#ffffff';
	});
	currentPixelIndex = 0;
	updateCurrentPixel();
	updatePreview();
});

// Move all pixels in a direction
function movePixels(direction) {
	saveState();
	const size = gridSize;
	const colorGrid = [];

	// Store current colors in a 2D array
	for (let row = 0; row < size; row++) {
		colorGrid[row] = [];
		for (let col = 0; col < size; col++) {
			const index = row * size + col;
			colorGrid[row][col] = pixels[index].style.backgroundColor || '#ffffff';
		}
	}

	// Clear all pixels
	pixels.forEach((pixel) => {
		pixel.style.backgroundColor = '#ffffff';
	});

	// Move pixels based on direction
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			let newRow = row;
			let newCol = col;

			if (direction === 'up') {
				newRow = row - 1;
			} else if (direction === 'down') {
				newRow = row + 1;
			} else if (direction === 'left') {
				newCol = col - 1;
			} else if (direction === 'right') {
				newCol = col + 1;
			}

			// Only move if within bounds
			if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
				const newIndex = newRow * size + newCol;
				pixels[newIndex].style.backgroundColor = colorGrid[row][col];
			}
		}
	}
	updatePreview();
}

// Move buttons
moveUpBtn.addEventListener('click', () => movePixels('up'));
moveDownBtn.addEventListener('click', () => movePixels('down'));
moveLeftBtn.addEventListener('click', () => movePixels('left'));
moveRightBtn.addEventListener('click', () => movePixels('right'));

// Export button - open modal
exportBtn.addEventListener('click', () => {
	exportModal.classList.add('show');
});

// Export modal buttons
exportPngBtn.addEventListener('click', () => {
	exportToPNG();
	exportModal.classList.remove('show');
});

exportSvgBtn.addEventListener('click', () => {
	exportToSVG();
	exportModal.classList.remove('show');
});

exportJsonBtn.addEventListener('click', () => {
	exportCurrentCanvasAsJSON();
	exportModal.classList.remove('show');
});

// ============== VECTORIZATION FUNCTIONALITY ==============

let currentVectorizedSVG = '';

// Create a 2D grid representing pixel colors
function createPixelColorGrid() {
	const size = gridSize;
	const grid = [];

	for (let row = 0; row < size; row++) {
		grid[row] = [];
		for (let col = 0; col < size; col++) {
			const index = row * size + col;
			const color = normalizeColor(getPixelColor(index));
			grid[row][col] = color;
		}
	}

	return grid;
}

// Get unique colors from the grid (excluding white)
function getUniqueColors(grid) {
	const colors = new Set();
	grid.forEach((row) => {
		row.forEach((color) => {
			if (color !== '#FFFFFF') {
				colors.add(color);
			}
		});
	});
	return Array.from(colors);
}

// Find all colored pixels and group them into connected paths
function findColoredPixelPaths(grid, targetColor) {
	const size = grid.length;
	const visited = Array(size)
		.fill(null)
		.map(() => Array(size).fill(false));
	const paths = [];

	// Get all pixels with the target color
	const coloredPixels = [];
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			if (grid[row][col] === targetColor) {
				coloredPixels.push({ row, col });
			}
		}
	}

	// For each unvisited colored pixel, trace a path
	for (const startPixel of coloredPixels) {
		if (!visited[startPixel.row][startPixel.col]) {
			const path = tracePath(grid, targetColor, startPixel.row, startPixel.col, visited);
			if (path.length > 0) {
				paths.push(path);
			}
		}
	}

	return paths;
}

// Trace a path from a starting pixel by following adjacent pixels of the same color
function tracePath(grid, targetColor, startRow, startCol, visited) {
	const size = grid.length;
	const path = [];

	// Check if pixel is valid and has target color
	function isValidPixel(row, col) {
		return (
			row >= 0 &&
			row < size &&
			col >= 0 &&
			col < size &&
			grid[row][col] === targetColor &&
			!visited[row][col]
		);
	}

	// Get all adjacent pixels (8-directional)
	function getNeighbors(row, col) {
		return [
			{ row: row - 1, col: col }, // up
			{ row: row + 1, col: col }, // down
			{ row: row, col: col - 1 }, // left
			{ row: row, col: col + 1 }, // right
			{ row: row - 1, col: col - 1 }, // up-left
			{ row: row - 1, col: col + 1 }, // up-right
			{ row: row + 1, col: col - 1 }, // down-left
			{ row: row + 1, col: col + 1 } // down-right
		];
	}

	// Start DFS from the starting pixel
	const stack = [{ row: startRow, col: startCol }];

	while (stack.length > 0) {
		const current = stack.pop();

		if (!isValidPixel(current.row, current.col)) {
			continue;
		}

		visited[current.row][current.col] = true;
		path.push({ x: current.col + 0.5, y: current.row + 0.5 }); // Center of pixel

		// Add all valid neighbors to stack
		const neighbors = getNeighbors(current.row, current.col);
		for (const neighbor of neighbors) {
			if (isValidPixel(neighbor.row, neighbor.col)) {
				stack.push(neighbor);
			}
		}
	}

	// Sort path points to create a more natural line
	if (path.length > 1) {
		path.sort((a, b) => {
			// Sort primarily by distance from origin to create a more coherent path
			const distA = Math.sqrt(a.x * a.x + a.y * a.y);
			const distB = Math.sqrt(b.x * b.x + b.y * b.y);
			return distA - distB;
		});
	}

	return path;
}

// Order points to form continuous paths, breaking into segments when points are far apart
function orderPathPoints(points, maxDistance = 30.0) {
	if (points.length <= 1) return [points];

	const segments = [];
	const visited = new Set();

	for (let startIdx = 0; startIdx < points.length; startIdx++) {
		if (visited.has(startIdx)) continue;

		const segment = [points[startIdx]];
		visited.add(startIdx);
		let currentIdx = startIdx;

		while (true) {
			let nearestIdx = -1;
			let nearestDist = Infinity;

			// Find nearest unvisited point
			for (let i = 0; i < points.length; i++) {
				if (visited.has(i)) continue;

				const dx = points[i].x - points[currentIdx].x;
				const dy = points[i].y - points[currentIdx].y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < nearestDist) {
					nearestDist = dist;
					nearestIdx = i;
				}
			}

			// If nearest point is too far, start a new segment
			if (nearestIdx === -1 || nearestDist > maxDistance) {
				break;
			}

			segment.push(points[nearestIdx]);
			visited.add(nearestIdx);
			currentIdx = nearestIdx;
		}

		if (segment.length > 0) {
			segments.push(segment);
		}
	}

	return segments;
}

// Simplify path using Douglas-Peucker algorithm
function simplifyPath(points, tolerance = 0.5) {
	if (points.length <= 2) return points;

	// Find the point with maximum distance
	let maxDist = 0;
	let maxIndex = 0;
	const first = points[0];
	const last = points[points.length - 1];

	for (let i = 1; i < points.length - 1; i++) {
		const dist = perpendicularDistance(points[i], first, last);
		if (dist > maxDist) {
			maxDist = dist;
			maxIndex = i;
		}
	}

	// If max distance is greater than tolerance, recursively simplify
	if (maxDist > tolerance) {
		const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
		const right = simplifyPath(points.slice(maxIndex), tolerance);
		return left.slice(0, -1).concat(right);
	} else {
		return [first, last];
	}
}

function perpendicularDistance(point, lineStart, lineEnd) {
	const dx = lineEnd.x - lineStart.x;
	const dy = lineEnd.y - lineStart.y;
	const norm = Math.sqrt(dx * dx + dy * dy);

	if (norm === 0) {
		const px = point.x - lineStart.x;
		const py = point.y - lineStart.y;
		return Math.sqrt(px * px + py * py);
	}

	const dist =
		Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) /
		norm;
	return dist;
}

// Convert a single segment to smooth SVG path
function segmentToSmoothPath(processedPoints, smooth, closePathOption) {
	if (processedPoints.length === 0) return '';
	if (processedPoints.length === 1) {
		// Single point - draw a small circle
		const p = processedPoints[0];
		return `M ${p.x - 0.3} ${p.y} a 0.3 0.3 0 1 0 0.6 0 a 0.3 0.3 0 1 0 -0.6 0`;
	}

	// Determine if path should be closed based on proximity of start and end points
	const first = processedPoints[0];
	const last = processedPoints[processedPoints.length - 1];
	const dx = last.x - first.x;
	const dy = last.y - first.y;
	const distance = Math.sqrt(dx * dx + dy * dy);

	// Auto-close if start and end are within 30 units of each other
	const shouldClosePath = closePathOption && (distance < 30 || processedPoints.length < 4);

	if (!smooth || processedPoints.length < 3) {
		// Simple line path
		let path = `M ${processedPoints[0].x} ${processedPoints[0].y}`;
		for (let i = 1; i < processedPoints.length; i++) {
			path += ` L ${processedPoints[i].x} ${processedPoints[i].y}`;
		}
		if (shouldClosePath) {
			path += ' Z';
		}
		return path;
	}

	// Create smooth path using Catmull-Rom to Bezier conversion
	let path = `M ${processedPoints[0].x} ${processedPoints[0].y}`;

	if (shouldClosePath) {
		// Draw curves through all points (closed loop)
		for (let i = 0; i < processedPoints.length; i++) {
			const p0 = processedPoints[(i - 1 + processedPoints.length) % processedPoints.length];
			const p1 = processedPoints[i];
			const p2 = processedPoints[(i + 1) % processedPoints.length];
			const p3 = processedPoints[(i + 2) % processedPoints.length];

			// Calculate control points for cubic Bezier curve
			const cp1x = p1.x + (p2.x - p0.x) / 6;
			const cp1y = p1.y + (p2.y - p0.y) / 6;
			const cp2x = p2.x - (p3.x - p1.x) / 6;
			const cp2y = p2.y - (p3.y - p1.y) / 6;

			path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
		}
		path += ' Z';
	} else {
		// Draw curves through points (open path)
		for (let i = 0; i < processedPoints.length - 1; i++) {
			const p0 = i > 0 ? processedPoints[i - 1] : processedPoints[i];
			const p1 = processedPoints[i];
			const p2 = processedPoints[i + 1];
			const p3 = i < processedPoints.length - 2 ? processedPoints[i + 2] : p2;

			// Calculate control points for cubic Bezier curve
			const cp1x = p1.x + (p2.x - p0.x) / 6;
			const cp1y = p1.y + (p2.y - p0.y) / 6;
			const cp2x = p2.x - (p3.x - p1.x) / 6;
			const cp2y = p2.y - (p3.y - p1.y) / 6;

			path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
		}
	}

	return path;
}

// Convert points to smooth SVG path (handles multiple segments)
function pointsToSmoothPath(points, smooth = true, simplify = true, maxDistance = 30.0) {
	if (points.length === 0) return '';

	// Order points to create continuous path segments
	const segments = orderPathPoints(points, maxDistance);

	let allPaths = '';

	// Process each segment
	segments.forEach((segment) => {
		const processedPoints = simplify ? simplifyPath(segment, 1.5) : segment;
		// Always enable auto-closing for paths where start and end are close
		const pathData = segmentToSmoothPath(processedPoints, smooth, true);
		if (pathData) {
			allPaths += pathData + ' ';
		}
	});

	return allPaths.trim();
}

// Generate vectorized SVG
function generateVectorizedSVG(smoothPaths = true, simplifyPaths = true, maxDistance = 30.0) {
	const grid = createPixelColorGrid();
	const colors = getUniqueColors(grid);
	const size = gridSize;
	const pixelSize = 20;
	const svgSize = size * pixelSize;

	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">\n`;

	// Process each color
	colors.forEach((color) => {
		const paths = findColoredPixelPaths(grid, color);

		paths.forEach((path) => {
			if (path.length > 0) {
				// Scale points
				const scaledPoints = path.map((p) => ({
					x: p.x * pixelSize,
					y: p.y * pixelSize
				}));

				const pathData = pointsToSmoothPath(scaledPoints, smoothPaths, simplifyPaths, maxDistance);

				// Draw as stroked path instead of filled
				svg += `  <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n`;
			}
		});
	});

	svg += '</svg>';
	return svg;
}

// Open vectorize modal
vectorizeBtn.addEventListener('click', () => {
	exportModal.classList.remove('show');
	generateAndShowVector();
	vectorizeModal.classList.add('show');
});

// Generate and display vectorized image
function generateAndShowVector() {
	const smoothPaths = smoothPathsCheckbox.checked;
	const simplifyPaths = simplifyPathsCheckbox.checked;
	const maxDistance = parseFloat(maxDistanceSlider.value);

	currentVectorizedSVG = generateVectorizedSVG(smoothPaths, simplifyPaths, maxDistance);
	vectorPreview.innerHTML = currentVectorizedSVG;
}

// Update max distance display value
maxDistanceSlider.addEventListener('input', (e) => {
	maxDistanceValue.textContent = e.target.value;
});

// Regenerate vector with new options
regenerateVectorBtn.addEventListener('click', generateAndShowVector);

// Download vectorized SVG
downloadVectorBtn.addEventListener('click', () => {
	const blob = new Blob([currentVectorizedSVG], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `pixel-art-vectorized-${Date.now()}.svg`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
});

// Close vectorize modal
function closeVectorizeModalFn() {
	vectorizeModal.classList.remove('show');
}

closeVectorizeModal.addEventListener('click', closeVectorizeModalFn);
closeVectorizeBtn.addEventListener('click', closeVectorizeModalFn);

vectorizeModal.addEventListener('click', (e) => {
	if (e.target === vectorizeModal) {
		closeVectorizeModalFn();
	}
});

// Tool selection
function updateToolCursor() {
	if (currentTool === 'bucket') {
		pixelGrid.style.cursor = 'grab';
		pixels.forEach((pixel) => {
			pixel.style.cursor = 'grab';
		});
	} else if (currentTool === 'eraser') {
		pixelGrid.style.cursor = 'crosshair';
		pixels.forEach((pixel) => {
			pixel.style.cursor = 'crosshair';
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
	eraserTool.classList.remove('active');
	bucketTool.classList.remove('active');
	eraserSizeControl.style.display = 'none';
	updateToolCursor();
});

eraserTool.addEventListener('click', () => {
	currentTool = 'eraser';
	eraserTool.classList.add('active');
	brushTool.classList.remove('active');
	bucketTool.classList.remove('active');
	eraserSizeControl.style.display = 'block';
	updateToolCursor();
});

bucketTool.addEventListener('click', () => {
	currentTool = 'bucket';
	bucketTool.classList.add('active');
	brushTool.classList.remove('active');
	eraserTool.classList.remove('active');
	eraserSizeControl.style.display = 'none';
	updateToolCursor();
});

// Eraser size slider
eraserSizeSlider.addEventListener('input', (e) => {
	eraserSize = parseInt(e.target.value);
	eraserSizeValue.textContent = eraserSize;
});

// ============== SAVE/LOAD FUNCTIONALITY ==============

// Get all saved artworks from localStorage
function getSavedArtworks() {
	const data = localStorage.getItem(STORAGE_KEY);
	return data ? JSON.parse(data) : [];
}

// Save artworks to localStorage
function saveArtworksToStorage(artworks) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(artworks));
}

// Generate preview image as data URL
function generatePreview() {
	const size = gridSize;
	const previewSize = 200; // Preview canvas size
	const pixelSize = previewSize / size;

	const canvas = document.createElement('canvas');
	canvas.width = previewSize;
	canvas.height = previewSize;
	const ctx = canvas.getContext('2d');

	ctx.imageSmoothingEnabled = false;

	// Draw each pixel
	pixels.forEach((pixel, index) => {
		const row = Math.floor(index / size);
		const col = index % size;
		const x = col * pixelSize;
		const y = row * pixelSize;

		const bgColor = pixel.style.backgroundColor || '#ffffff';
		ctx.fillStyle = bgColor;
		ctx.fillRect(x, y, pixelSize, pixelSize);
	});

	return canvas.toDataURL();
}

// Get current canvas data
function getCurrentCanvasData() {
	return {
		gridSize: gridSize,
		pixels: pixels.map((pixel) => pixel.style.backgroundColor || '#ffffff')
	};
}

// Load canvas data
function loadCanvasData(data) {
	// Change grid size if needed
	if (data.gridSize !== gridSize) {
		gridSize = data.gridSize;

		// Update active state on grid size buttons
		gridSizeButtons.forEach((button) => {
			if (parseInt(button.dataset.size) === gridSize) {
				button.classList.add('active');
			} else {
				button.classList.remove('active');
			}
		});

		createGrid(gridSize);
	}

	// Load pixel colors
	data.pixels.forEach((color, index) => {
		const pixel = getPixel(index);
		if (pixel) {
			pixel.style.backgroundColor = color;
		}
	});

	// Reset undo history and save initial state
	undoHistory = [];
	saveState();
	updatePreview();
}

// Open save modal
saveBtn.addEventListener('click', () => {
	artworkNameInput.value = '';
	saveModal.classList.add('show');
	artworkNameInput.focus();
});

// Close save modal
function closeSaveModalFn() {
	saveModal.classList.remove('show');
}

closeSaveModal.addEventListener('click', closeSaveModalFn);
cancelSaveBtn.addEventListener('click', closeSaveModalFn);

// Save artwork
confirmSaveBtn.addEventListener('click', () => {
	const name = artworkNameInput.value.trim();
	if (!name) {
		alert('Please enter a name for your artwork');
		return;
	}

	const artworks = getSavedArtworks();
	const artwork = {
		id: Date.now(),
		name: name,
		timestamp: new Date().toISOString(),
		preview: generatePreview(),
		data: getCurrentCanvasData()
	};

	artworks.push(artwork);
	saveArtworksToStorage(artworks);

	closeSaveModalFn();
	alert('Artwork saved successfully!');
});

// Save on Enter key
artworkNameInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') {
		confirmSaveBtn.click();
	}
});

// Open load modal
loadBtn.addEventListener('click', () => {
	renderSavedArtworks();
	loadModal.classList.add('show');
});

// Close load modal
function closeLoadModalFn() {
	loadModal.classList.remove('show');
}

closeLoadModal.addEventListener('click', closeLoadModalFn);

// Render saved artworks list
function renderSavedArtworks() {
	const artworks = getSavedArtworks();
	savedArtworksList.innerHTML = '';

	if (artworks.length === 0) {
		return; // CSS will show "no artworks" message
	}

	artworks.reverse().forEach((artwork) => {
		const item = document.createElement('div');
		item.className = 'artwork-item';

		const preview = document.createElement('img');
		preview.className = 'artwork-preview';
		preview.src = artwork.preview;
		preview.alt = artwork.name;

		const info = document.createElement('div');
		info.className = 'artwork-info';

		const name = document.createElement('div');
		name.className = 'artwork-name';
		name.textContent = artwork.name;

		const meta = document.createElement('div');
		meta.className = 'artwork-meta';
		const date = new Date(artwork.timestamp);
		meta.textContent = `${artwork.data.gridSize}×${artwork.data.gridSize} • ${date.toLocaleDateString()}`;

		const actions = document.createElement('div');
		actions.className = 'artwork-actions';

		const loadButton = document.createElement('button');
		loadButton.className = 'btn';
		loadButton.textContent = 'Load';
		loadButton.addEventListener('click', (e) => {
			e.stopPropagation();
			loadCanvasData(artwork.data);
			closeLoadModalFn();
		});

		const exportJsonButton = document.createElement('button');
		exportJsonButton.className = 'btn btn-secondary';
		exportJsonButton.textContent = 'Export JSON';
		exportJsonButton.addEventListener('click', (e) => {
			e.stopPropagation();
			exportArtworkAsJSON(artwork);
		});

		const deleteButton = document.createElement('button');
		deleteButton.className = 'btn btn-danger';
		deleteButton.textContent = 'Delete';
		deleteButton.addEventListener('click', (e) => {
			e.stopPropagation();
			if (confirm(`Delete "${artwork.name}"?`)) {
				deleteArtwork(artwork.id);
				renderSavedArtworks();
			}
		});

		actions.appendChild(loadButton);
		actions.appendChild(exportJsonButton);
		actions.appendChild(deleteButton);

		info.appendChild(name);
		info.appendChild(meta);

		item.appendChild(preview);
		item.appendChild(info);
		item.appendChild(actions);

		// Click on item to load
		item.addEventListener('click', () => {
			loadCanvasData(artwork.data);
			closeLoadModalFn();
		});

		savedArtworksList.appendChild(item);
	});
}

// Export artwork as JSON
function exportArtworkAsJSON(artwork) {
	// Create a clean export object with pixel coordinates and colors
	const exportData = {
		name: artwork.name,
		gridSize: artwork.data.gridSize,
		timestamp: artwork.timestamp,
		pixels: []
	};

	// Convert pixel array to coordinate-based format
	artwork.data.pixels.forEach((color, index) => {
		// Only export non-white pixels
		const normalizedColor = normalizeColor(color);
		if (normalizedColor !== '#FFFFFF') {
			const row = Math.floor(index / artwork.data.gridSize);
			const col = index % artwork.data.gridSize;
			exportData.pixels.push({
				x: col,
				y: row,
				color: normalizedColor
			});
		}
	});

	// Create and download the JSON file
	const jsonString = JSON.stringify(exportData, null, 2);
	const blob = new Blob([jsonString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${artwork.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Delete artwork
function deleteArtwork(id) {
	const artworks = getSavedArtworks();
	const filtered = artworks.filter((artwork) => artwork.id !== id);
	saveArtworksToStorage(filtered);
}

// Close export modal
function closeExportModalFn() {
	exportModal.classList.remove('show');
}

closeExportModal.addEventListener('click', closeExportModalFn);

exportModal.addEventListener('click', (e) => {
	if (e.target === exportModal) {
		closeExportModalFn();
	}
});

// Close modals on background click
saveModal.addEventListener('click', (e) => {
	if (e.target === saveModal) {
		closeSaveModalFn();
	}
});

loadModal.addEventListener('click', (e) => {
	if (e.target === loadModal) {
		closeLoadModalFn();
	}
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		if (saveModal.classList.contains('show')) {
			closeSaveModalFn();
		}
		if (loadModal.classList.contains('show')) {
			closeLoadModalFn();
		}
	}
});

// Initialize
initPalette();
selectColor('#000000');
createGrid(gridSize);

// Save initial state
saveState();

// Focus the grid for keyboard navigation
pixelGrid.focus();
