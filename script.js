const pixelGrid = document.getElementById('pixelGrid');
const colorPalette = document.getElementById('colorPalette');
const selectedColorDisplay = document.getElementById('selectedColor');
const gridSizeSlider = document.getElementById('gridSize');
const gridSizeValue = document.getElementById('gridSizeValue');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const exportSvgBtn = document.getElementById('exportSvgBtn');
const vectorizeBtn = document.getElementById('vectorizeBtn');
const brushTool = document.getElementById('brushTool');
const bucketTool = document.getElementById('bucketTool');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');

// Modal elements
const saveModal = document.getElementById('saveModal');
const loadModal = document.getElementById('loadModal');
const vectorizeModal = document.getElementById('vectorizeModal');
const closeSaveModal = document.getElementById('closeSaveModal');
const closeLoadModal = document.getElementById('closeLoadModal');
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

// Export to SVG
function exportToSVG() {
	const size = gridSize;
	const pixelSize = 10; // Each pixel will be 10x10 units in the SVG
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

// Clear canvas
clearBtn.addEventListener('click', () => {
	saveState();
	pixels.forEach((pixel) => {
		pixel.style.backgroundColor = '#ffffff';
	});
	currentPixelIndex = 0;
	updateCurrentPixel();
});

// Export buttons
exportBtn.addEventListener('click', exportToPNG);
exportSvgBtn.addEventListener('click', exportToSVG);

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
	grid.forEach(row => {
		row.forEach(color => {
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
	const visited = Array(size).fill(null).map(() => Array(size).fill(false));
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
		return row >= 0 && row < size && col >= 0 && col < size &&
		       grid[row][col] === targetColor && !visited[row][col];
	}

	// Get all adjacent pixels (8-directional)
	function getNeighbors(row, col) {
		return [
			{ row: row - 1, col: col },     // up
			{ row: row + 1, col: col },     // down
			{ row: row, col: col - 1 },     // left
			{ row: row, col: col + 1 },     // right
			{ row: row - 1, col: col - 1 }, // up-left
			{ row: row - 1, col: col + 1 }, // up-right
			{ row: row + 1, col: col - 1 }, // down-left
			{ row: row + 1, col: col + 1 }  // down-right
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
function orderPathPoints(points, maxDistance = 15.0) {
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

	const dist = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / norm;
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
function pointsToSmoothPath(points, smooth = true, simplify = true, maxDistance = 15.0) {
	if (points.length === 0) return '';

	// Order points to create continuous path segments
	const segments = orderPathPoints(points, maxDistance);

	let allPaths = '';

	// Process each segment
	segments.forEach(segment => {
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
function generateVectorizedSVG(smoothPaths = true, simplifyPaths = true, maxDistance = 15.0) {
	const grid = createPixelColorGrid();
	const colors = getUniqueColors(grid);
	const size = gridSize;
	const pixelSize = 10;
	const svgSize = size * pixelSize;

	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">\n`;

	// Process each color
	colors.forEach(color => {
		const paths = findColoredPixelPaths(grid, color);

		paths.forEach(path => {
			if (path.length > 0) {
				// Scale points
				const scaledPoints = path.map(p => ({
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
		gridSizeSlider.value = gridSize;
		gridSizeValue.textContent = gridSize;
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

// Delete artwork
function deleteArtwork(id) {
	const artworks = getSavedArtworks();
	const filtered = artworks.filter((artwork) => artwork.id !== id);
	saveArtworksToStorage(filtered);
}

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
