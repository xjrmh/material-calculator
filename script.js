document.addEventListener('DOMContentLoaded', () => {
	// Check if speech synthesis is supported
	if (!window.speechSynthesis) {
		console.error('Speech synthesis is not supported in this browser');
		return;
	}
	console.log('Speech synthesis is supported');
	
	// Shared calculator state
	const calculatorState = {
		current: '',
		operator: '',
		operand: '',
		memory: 0,
		isRadians: true
	};
	
	// Settings state
	const settings = {
		roundingDigits: 4,
		randomMin: 0,
		randomMax: 1000,
		voiceEnabled: true
	};
	
	// Load settings from localStorage
	function loadSettings() {
		const saved = localStorage.getItem('calculatorSettings');
		if (saved) {
			Object.assign(settings, JSON.parse(saved));
		}
		updateSettingsUI();
	}
	
	// Save settings to localStorage
	function saveSettings() {
		localStorage.setItem('calculatorSettings', JSON.stringify(settings));
	}
	
	// Update settings UI elements
	function updateSettingsUI() {
		document.getElementById('rounding-digits').value = settings.roundingDigits;
		document.getElementById('random-min').value = settings.randomMin;
		document.getElementById('random-max').value = settings.randomMax;
		document.getElementById('voice-enabled').checked = settings.voiceEnabled;
	}
	
	// Initialize displays for both calculators
	const displays = {
		simple: {
			result: document.getElementById('display'),
			formula: document.getElementById('formula')
		},
		scientific: {
			result: document.getElementById('sci-display'),
			formula: document.getElementById('sci-formula')
		}
	};
	
	// Operator display mapping
	const operatorSymbols = {
		'*': '×',
		'/': '÷',
		'-': '−',
		'+': '+',
		'2^': '²'
	};
	
	// Button text mapping for speech
	const buttonTextMap = {
		'0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
		'5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
		'.': 'point', '+': 'plus', '-': 'minus', '*': 'times', '/': 'divided by',
		'=': 'equals', 'C': 'clear', 'sin': 'sine', 'cos': 'cosine',
		'tan': 'tangent', 'log': 'logarithm', 'sqrt': 'square root',
		'pi': 'pi', 'e': 'e', '(': 'open parenthesis', ')': 'close parenthesis',
		'2^': 'squared', 'mc': 'memory clear', 'm+': 'memory plus',
		'm-': 'memory minus', 'mr': 'memory recall', 'random': 'random calculation'
	};
	
	// Accent colors for random selection
	const accentColors = ['#6200ee', '#1e88e5', '#e53935', '#43a047', '#ff9800', '#8e24aa', '#00bcd4'];
	
	// Speech synthesis variables
	const synth = window.speechSynthesis;
	let preferredVoice = null;
	
	// ==================== UTILITY FUNCTIONS ====================
	
	// Function to format numbers with thousand delimiters
	function formatNumber(value) {
		if (!value || value === '0') return '0';
		if (value === 'Error' || isNaN(value)) return value;
		
		let num = parseFloat(value);
		if (isNaN(num)) return value;
		
		// Apply rounding based on settings
		if (settings.roundingDigits >= 0) {
			const factor = Math.pow(10, settings.roundingDigits);
			num = Math.round(num * factor) / factor;
		}
		
		const parts = num.toString().split('.');
		const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		let decimalPart = parts[1] || '';
		
		// Limit decimal places
		if (decimalPart && settings.roundingDigits >= 0) {
			decimalPart = decimalPart.substring(0, settings.roundingDigits);
		}
		
		return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
	}
	
	// Function to get formatted operator symbol
	function getOperatorSymbol(operator) {
		return operatorSymbols[operator] || operator;
	}
	
	// Function to get formatted formula text
	function getFormulaText() {
		let text = '';
		if (calculatorState.operand !== '') {
			text += formatNumber(calculatorState.operand);
		}
		if (calculatorState.operator !== '') {
			text += ' ' + getOperatorSymbol(calculatorState.operator);
		}
		if (calculatorState.current !== '') {
			text += ' ' + formatNumber(calculatorState.current);
		}
		return text || '0';
	}
	
	// Function to sync displays across calculators
	function updateDisplays() {
		const formattedValue = formatNumber(calculatorState.current) || '0';
		const formulaText = getFormulaText();
		
		displays.simple.result.textContent = formattedValue;
		displays.scientific.result.textContent = formattedValue;
		displays.simple.formula.textContent = formulaText;
		displays.scientific.formula.textContent = formulaText;
	}
	
	// Reset calculator state
	function resetState() {
		calculatorState.current = '';
		calculatorState.operator = '';
		calculatorState.operand = '';
		updateDisplays();
	}
	
	// ==================== SPEECH FUNCTIONS ====================
	
	// Set up preferred voice when voices are loaded
	function initVoice() {
		const voices = synth.getVoices();
		console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
		
		preferredVoice = voices.find(voice => 
			(voice.name.includes('Samantha') || 
			 voice.name.includes('Microsoft David') || 
			 voice.name.includes('Google UK English Male')) && 
			voice.lang.startsWith('en')
		) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
		
		if (preferredVoice) {
			console.log('Selected voice:', preferredVoice.name);
		} else {
			console.warn('No suitable voice found');
		}
	}
	
	// Initialize voice handlers
	if (synth.onvoiceschanged !== undefined) {
		synth.onvoiceschanged = initVoice;
	}
	initVoice();
	
	// Speak the given text
	function speak(text) {
		if (!settings.voiceEnabled) return;
		
		text = text.toString().replace(/,/g, '');
		console.log('Speaking:', text);
		
		if (synth.speaking) {
			synth.cancel();
		}
		
		const utterance = new SpeechSynthesisUtterance(text);
		if (preferredVoice) utterance.voice = preferredVoice;
		utterance.rate = 1.1;
		utterance.pitch = 1.0;
		utterance.volume = 1.0;
		
		try {
			synth.speak(utterance);
		} catch (e) {
			console.error('Error speaking:', e);
		}
	}
	
	// Convert button value to speakable text
	function getButtonText(val) {
		return buttonTextMap[val] || val;
	}
	
	// ==================== CALCULATION FUNCTIONS ====================
	
	// Scientific calculator evaluation
	function evaluateScientific(expression) {
		try {
			expression = expression
				.replace(/π/g, 'Math.PI')
				.replace(/\be\b/g, 'Math.E')
				.replace(/sin\(/g, 'Math.sin(')
				.replace(/cos\(/g, 'Math.cos(')
				.replace(/tan\(/g, 'Math.tan(')
				.replace(/log\(/g, 'Math.log10(')
				.replace(/sqrt\(/g, 'Math.sqrt(')
				.replace(/2\^/g, 'Math.pow(2,');
			
			return eval(expression);
		} catch (e) {
			console.error('Scientific evaluation error:', e);
			return 'Error';
		}
	}
	
	// Perform calculation
	function calculate(isScientific) {
		if (!calculatorState.operator || calculatorState.operand === '') return;
		
		const expression = calculatorState.operand + calculatorState.operator + calculatorState.current;
		let result;
		
		try {
			result = isScientific ? evaluateScientific(expression) : eval(expression);
			speak(result.toString());
		} catch (e) {
			result = 'Error';
			speak('Error');
		}
		
		calculatorState.current = result.toString();
		calculatorState.operator = '';
		calculatorState.operand = '';
		updateDisplays();
	}
	
	// Memory operations
	function handleMemory(action, value = 0) {
		const numValue = parseFloat(value) || 0;
		
		switch (action) {
			case 'mc':
				calculatorState.memory = 0;
				speak('Memory cleared');
				break;
			case 'm+':
				calculatorState.memory += numValue;
				speak('Memory plus');
				break;
			case 'm-':
				calculatorState.memory -= numValue;
				speak('Memory minus');
				break;
			case 'mr':
				speak('Memory recall');
				return calculatorState.memory.toString();
		}
		return value.toString();
	}
	
	// Handle scientific function
	function handleScientificFunction(func, currentValue) {
		const expression = `${func}(${currentValue})`;
		const result = evaluateScientific(expression);
		
		if (result !== 'Error') {
			speak(result.toString());
			calculatorState.current = result.toString();
			calculatorState.operator = '';
			calculatorState.operand = '';
		} else {
			speak('Error');
		}
		updateDisplays();
	}
	
	// Generate random calculation
	function generateRandomCalculation(isScientific) {
		let result;
		const min = settings.randomMin;
		const max = settings.randomMax;
		
		if (isScientific) {
			const operations = [
				() => {
					const num = Math.floor(Math.random() * (max - min + 1)) + min;
					return { expr: `sqrt(${num})`, result: Math.sqrt(num) };
				},
				() => {
					const num = Math.random() * Math.PI;
					return { expr: `sin(${num.toFixed(4)})`, result: Math.sin(num) };
				},
				() => {
					const num = Math.random() * Math.PI;
					return { expr: `cos(${num.toFixed(4)})`, result: Math.cos(num) };
				},
				() => {
					const num = Math.floor(Math.random() * (max - min + 1)) + min;
					if (num <= 0) num = 1; // Ensure log is valid
					return { expr: `log(${num})`, result: Math.log10(num) };
				},
				() => {
					const num = Math.floor(Math.random() * 20) + 1;
					return { expr: `${num}²`, result: num * num };
				},
				() => {
					const num1 = Math.floor(Math.random() * (max - min + 1)) + min;
					const num2 = Math.floor(Math.random() * (max - min + 1)) + min;
					const ops = ['+', '-', '*', '/'];
					const op = ops[Math.floor(Math.random() * ops.length)];
					return { expr: `${num1} ${op} ${num2}`, result: eval(`${num1}${op}${num2}`) };
				}
			];
			const operation = operations[Math.floor(Math.random() * operations.length)]();
			result = operation.result;
			speak(`Random calculation: ${operation.expr} equals ${result.toFixed(settings.roundingDigits)}`);
		} else {
			const num1 = Math.floor(Math.random() * (max - min + 1)) + min;
			const num2 = Math.floor(Math.random() * (max - min + 1)) + min;
			const operations = [
				{ op: '+', calc: num1 + num2, symbol: 'plus' },
				{ op: '-', calc: num1 - num2, symbol: 'minus' },
				{ op: '*', calc: num1 * num2, symbol: 'times' },
				{ op: '/', calc: num1 / num2, symbol: 'divided by' }
			];
			const selected = operations[Math.floor(Math.random() * operations.length)];
			result = selected.calc;
			speak(`Random calculation: ${num1} ${selected.symbol} ${num2} equals ${result.toFixed(settings.roundingDigits)}`);
		}
		
		calculatorState.current = result.toString();
		calculatorState.operator = '';
		calculatorState.operand = '';
		updateDisplays();
	}
	
	// Randomly set accent color
	function setRandomAccentColor() {
		const randomColor = accentColors[Math.floor(Math.random() * accentColors.length)];
		document.documentElement.style.setProperty('--accent-color', randomColor);
		document.querySelectorAll('.btn.operator').forEach(btn => btn.style.color = randomColor);
		document.querySelectorAll('.btn.equals').forEach(btn => btn.style.background = randomColor);
	}
	
	// ==================== EVENT HANDLERS ====================
	
	// Tab switching
	const tabs = document.querySelectorAll('.tab-btn');
	const calculators = document.querySelectorAll('.calculator');
	
	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const targetId = tab.getAttribute('data-tab') + '-calc';
			
			tabs.forEach(t => t.classList.remove('active'));
			tab.classList.add('active');
			
			calculators.forEach(calc => {
				calc.classList.remove('active');
				if (calc.id === targetId) calc.classList.add('active');
			});
			
			updateDisplays();
		});
	});
	
	// Button click handler
	const buttons = document.querySelectorAll('.btn');
	
	// Long press support for random button
	let longPressTimer = null;
	let longPressInterval = null;
	let speedUpTimer = null;
	
	buttons.forEach(btn => {
		const val = btn.getAttribute('data-value');
		
		// Add long press handlers for random button
		if (val === 'random') {
			btn.addEventListener('mousedown', (e) => {
				e.preventDefault();
				const isScientific = btn.closest('#scientific-calc') !== null;
				
				// Start long press timer
				longPressTimer = setTimeout(() => {
					// Start repeating execution at 0.3s intervals
					longPressInterval = setInterval(() => {
						generateRandomCalculation(isScientific);
						setRandomAccentColor();
					}, 300);
					
					// After 3 seconds, speed up to 0.1s intervals
					speedUpTimer = setTimeout(() => {
						clearInterval(longPressInterval);
						longPressInterval = setInterval(() => {
							generateRandomCalculation(isScientific);
							setRandomAccentColor();
						}, 100);
					}, 3000);
				}, 500); // Wait 0.5 seconds before starting auto-repeat
			});
			
			btn.addEventListener('mouseup', () => {
				clearTimeout(longPressTimer);
				clearInterval(longPressInterval);
				clearTimeout(speedUpTimer);
				longPressTimer = null;
				longPressInterval = null;
				speedUpTimer = null;
			});
			
			btn.addEventListener('mouseleave', () => {
				clearTimeout(longPressTimer);
				clearInterval(longPressInterval);
				clearTimeout(speedUpTimer);
				longPressTimer = null;
				longPressInterval = null;
				speedUpTimer = null;
			});
			
			// Touch support for mobile
			btn.addEventListener('touchstart', (e) => {
				e.preventDefault();
				const isScientific = btn.closest('#scientific-calc') !== null;
				
				longPressTimer = setTimeout(() => {
					longPressInterval = setInterval(() => {
						generateRandomCalculation(isScientific);
						setRandomAccentColor();
					}, 300);
					
					// After 3 seconds, speed up to 0.1s intervals
					speedUpTimer = setTimeout(() => {
						clearInterval(longPressInterval);
						longPressInterval = setInterval(() => {
							generateRandomCalculation(isScientific);
							setRandomAccentColor();
						}, 100);
					}, 3000);
				}, 500);
			});
			
			btn.addEventListener('touchend', () => {
				clearTimeout(longPressTimer);
				clearInterval(longPressInterval);
				clearTimeout(speedUpTimer);
				longPressTimer = null;
				longPressInterval = null;
				speedUpTimer = null;
			});
			
			btn.addEventListener('touchcancel', () => {
				clearTimeout(longPressTimer);
				clearInterval(longPressInterval);
				clearTimeout(speedUpTimer);
				longPressTimer = null;
				longPressInterval = null;
				speedUpTimer = null;
			});
		}
		
		btn.addEventListener('click', () => {
			const val = btn.getAttribute('data-value');
			const isScientific = btn.closest('#scientific-calc') !== null;
			const activeDisplays = isScientific ? displays.scientific : displays.simple;
			
			speak(getButtonText(val));
			
			// Clear button
			if (val === 'C') {
				resetState();
				return;
			}
			
			// Equals button
			if (val === '=') {
				calculate(isScientific);
				setRandomAccentColor();
				return;
			}
			
			// Random calculation button
			if (val === 'random') {
				generateRandomCalculation(isScientific);
				setRandomAccentColor();
				return;
			}
			
			// Scientific functions
			if (['sin', 'cos', 'tan', 'log', 'sqrt'].includes(val)) {
				const currentValue = calculatorState.current || activeDisplays.result.textContent.replace(/,/g, '');
				handleScientificFunction(val, currentValue);
				return;
			}
			
			// Square function
			if (val === '2^') {
				const currentValue = calculatorState.current || activeDisplays.result.textContent.replace(/,/g, '');
				const num = parseFloat(currentValue);
				const result = num * num;
				speak(result.toString());
				calculatorState.current = result.toString();
				calculatorState.operator = '';
				calculatorState.operand = '';
				updateDisplays();
				return;
			}
			
			// Constants
			if (['pi', 'e'].includes(val)) {
				if (calculatorState.current !== '' && calculatorState.current !== '0') {
					calculatorState.operand = calculatorState.current;
					calculatorState.operator = '*';
				}
				calculatorState.current = val === 'pi' ? Math.PI.toString() : Math.E.toString();
				updateDisplays();
				return;
			}
			
			// Memory operations
			if (['mc', 'm+', 'm-', 'mr'].includes(val)) {
				const currentValue = calculatorState.current || activeDisplays.result.textContent.replace(/,/g, '');
				calculatorState.current = handleMemory(val, currentValue);
				updateDisplays();
				return;
			}
			
			// Operators
			if (['+', '-', '*', '/'].includes(val)) {
				if (calculatorState.current === '') {
					calculatorState.operand = activeDisplays.result.textContent.replace(/,/g, '');
				} else {
					calculatorState.operand = calculatorState.current;
				}
				calculatorState.operator = val;
				calculatorState.current = '';
				updateDisplays();
				return;
			}
			
			// Decimal point
			if (val === '.' && calculatorState.current.includes('.')) {
				return;
			}
			
			// Numbers and decimal point
			calculatorState.current += val;
			updateDisplays();
		});
	});
	
	// Keyboard support
	document.addEventListener('keydown', (event) => {
		// Enter key
		if (event.key === 'Enter') {
			document.querySelector('.btn.equals')?.click();
			return;
		}
		
		// Number keys
		if (event.key >= '0' && event.key <= '9') {
			document.querySelector(`.btn[data-value="${event.key}"]`)?.click();
			return;
		}
		
		// Operators
		if (['+', '-', '*', '/', '.'].includes(event.key)) {
			document.querySelector(`.btn[data-value="${event.key}"]`)?.click();
			return;
		}
		
		// Clear (Escape or c)
		if (event.key === 'Escape' || event.key.toLowerCase() === 'c') {
			document.querySelector('.btn[data-value="C"]')?.click();
			return;
		}
	});
	
	// ==================== SETTINGS HANDLERS ====================
	
	// Load settings on startup
	loadSettings();
	
	// Settings event listeners
	document.getElementById('rounding-digits').addEventListener('change', (e) => {
		settings.roundingDigits = parseInt(e.target.value);
		saveSettings();
		updateDisplays(); // Refresh display with new rounding
	});
	
	document.getElementById('random-min').addEventListener('change', (e) => {
		settings.randomMin = parseInt(e.target.value);
		saveSettings();
	});
	
	document.getElementById('random-max').addEventListener('change', (e) => {
		settings.randomMax = parseInt(e.target.value);
		saveSettings();
	});
	
	document.getElementById('voice-enabled').addEventListener('change', (e) => {
		settings.voiceEnabled = e.target.checked;
		saveSettings();
		if (settings.voiceEnabled) {
			speak('Voice enabled');
		}
	});
	
	document.getElementById('reset-settings').addEventListener('click', () => {
		settings.roundingDigits = 4;
		settings.randomMin = 0;
		settings.randomMax = 1000;
		settings.voiceEnabled = true;
		saveSettings();
		updateSettingsUI();
		updateDisplays();
		speak('Settings reset to defaults');
	});
	
	// Add test button for speech
	const testButton = document.createElement('button');
	testButton.textContent = 'Test Speech';
	testButton.style.cssText = 'position:fixed;bottom:10px;right:10px;';
	testButton.onclick = () => speak('Testing calculator voice');
	document.body.appendChild(testButton);
});
