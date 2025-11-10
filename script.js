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
	
	// Function to sync displays across calculators
	function updateDisplays() {
		// Update result displays
		displays.simple.result.textContent = calculatorState.current || '0';
		displays.scientific.result.textContent = calculatorState.current || '0';
		
		// Update formula displays
		const formulaText = getFormulaText();
		displays.simple.formula.textContent = formulaText;
		displays.scientific.formula.textContent = formulaText;
	}
	
	// Function to get formatted formula text
	function getFormulaText() {
		let text = '';
		if (calculatorState.operand !== '') {
			text += calculatorState.operand;
		}
		if (calculatorState.operator !== '') {
			text += ' ' + (
				calculatorState.operator === '*' ? '×' :
				calculatorState.operator === '/' ? '÷' :
				calculatorState.operator === '-' ? '−' :
				calculatorState.operator === '+' ? '+' :
				calculatorState.operator === '2^' ? '²' :
				calculatorState.operator
			);
		}
		if (calculatorState.current !== '') {
			text += ' ' + calculatorState.current;
		}
		return text || '0';
	}
	
	// Tab switching functionality
	const tabs = document.querySelectorAll('.tab-btn');
	const calculators = document.querySelectorAll('.calculator');
	
	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const targetId = tab.getAttribute('data-tab') + '-calc';
			
			// Update tab buttons
			tabs.forEach(t => t.classList.remove('active'));
			tab.classList.add('active');
			
			// Update calculator displays
			calculators.forEach(calc => {
				calc.classList.remove('active');
				if (calc.id === targetId) {
					calc.classList.add('active');
				}
			});
			
			// Ensure displays are synced when switching tabs
			updateDisplays();
		});
	});
	
	const buttons = document.querySelectorAll('.btn');
	
	// Function to update the formula display
	function updateFormula(formulaElement, op1, oper, op2) {
		let formulaText = '';
		if (op1 !== '') {
			formulaText += op1;
		}
		if (oper !== '') {
			formulaText += ' ' + (
				oper === '*' ? '×' :
				oper === '/' ? '÷' :
				oper === '-' ? '−' :
				oper === '+' ? '+' :
				oper === '2^' ? '²' : oper
			);
		}
		if (op2 !== '') {
			formulaText += ' ' + op2;
		}
		formulaElement.textContent = formulaText || '0';
	}
	
	// Initialize speech synthesis
	const synth = window.speechSynthesis;
	let preferredVoice = null;
	
	// Set up preferred voice when voices are loaded
	function initVoice() {
		const voices = synth.getVoices();
		console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
		
		// Try to find a natural sounding English voice
		preferredVoice = voices.find(voice => 
			(voice.name.includes('Samantha') || // macOS
			 voice.name.includes('Microsoft David') || // Windows
			 voice.name.includes('Google UK English Male')) && // Chrome
			voice.lang.startsWith('en')
		) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
		
		if (preferredVoice) {
			console.log('Selected voice:', preferredVoice.name);
			// Test the voice immediately
			const test = new SpeechSynthesisUtterance('Calculator ready');
			test.voice = preferredVoice;
			synth.speak(test);
		} else {
			console.warn('No suitable voice found');
		}
	}
	
	// Handle voices loading
	if (synth.onvoiceschanged !== undefined) {
		console.log('Setting up onvoiceschanged handler');
		synth.onvoiceschanged = initVoice;
	} else {
		console.log('onvoiceschanged not supported, trying immediate initialization');
		initVoice();
	}
	
	// Convert button value to speakable text
	function getButtonText(val) {
		const valueMap = {
			'0': 'zero',
			'1': 'one',
			'2': 'two',
			'3': 'three',
			'4': 'four',
			'5': 'five',
			'6': 'six',
			'7': 'seven',
			'8': 'eight',
			'9': 'nine',
			'.': 'point',
			'+': 'plus',
			'-': 'minus',
			'*': 'times',
			'/': 'divided by',
			'=': 'equals',
			'C': 'clear',
			'sin': 'sine',
			'cos': 'cosine',
			'tan': 'tangent',
			'log': 'logarithm',
			'sqrt': 'square root',
			'pi': 'pi',
			'e': 'e',
			'(': 'open parenthesis',
			')': 'close parenthesis',
			'2^': 'squared',
			'mc': 'memory clear',
			'm+': 'memory plus',
			'm-': 'memory minus',
			'mr': 'memory recall'
		};
		return valueMap[val] || val;
	}
	
	// Scientific calculator functions
	function evaluateScientific(expression) {
		try {
			// Replace scientific functions and constants
			expression = expression
				.replace(/π/g, 'Math.PI')
				.replace(/e/g, 'Math.E')
				.replace(/sin\(/g, `Math.${isRadians ? 'sin' : 'sin'}(`)
				.replace(/cos\(/g, `Math.${isRadians ? 'cos' : 'cos'}(`)
				.replace(/tan\(/g, `Math.${isRadians ? 'tan' : 'tan'}(`)
				.replace(/log\(/g, 'Math.log10(')
				.replace(/sqrt\(/g, 'Math.sqrt(')
				.replace(/2\^/g, 'Math.pow(2,');
			
			return eval(expression);
		} catch (e) {
			console.error('Scientific evaluation error:', e);
			return 'Error';
		}
	}
	
	// Memory functions
	function handleMemory(action, value = 0) {
		switch (action) {
			case 'mc':
				memory = 0;
				speak('Memory cleared');
				break;
			case 'm+':
				memory += parseFloat(value) || 0;
				speak('Memory plus');
				break;
			case 'm-':
				memory -= parseFloat(value) || 0;
				speak('Memory minus');
				break;
			case 'mr':
				speak('Memory recall');
				return memory.toString();
		}
		return value.toString();
	}
	
	// Speak the given text with natural-sounding settings
	function speak(text) {
		console.log('Speaking:', text);
		
		// Some browsers require user interaction before allowing speech
		if (synth.speaking) {
			console.log('Cancelling previous speech');
			synth.cancel();
		}
		
		const utterance = new SpeechSynthesisUtterance(text);
		
		// Use our preferred voice if we found one
		if (preferredVoice) {
			utterance.voice = preferredVoice;
		}
		
		// Adjust for more natural sound
		utterance.rate = 1.1;      // Slightly faster than default
		utterance.pitch = 1.0;     // Natural pitch
		utterance.volume = 1.0;    // Full volume
		
		// Add event handlers to track speech status
		utterance.onstart = () => console.log('Speech started');
		utterance.onend = () => console.log('Speech ended');
		utterance.onerror = (e) => console.error('Speech error:', e);
		
		try {
			synth.speak(utterance);
		} catch (e) {
			console.error('Error speaking:', e);
		}
	}

	// Define some accent colors to choose from
	const colors = ['#6200ee', '#1e88e5', '#e53935', '#43a047', '#ff9800', '#8e24aa', '#00bcd4'];

	// Convert hex color to rgba with given alpha
	function hexToRGBA(hex, alpha) {
		hex = hex.replace('#', '');
		const bigint = parseInt(hex, 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	// Randomly set accent color and update button styles
	function setRandomAccentColor() {
		const randomColor = colors[Math.floor(Math.random() * colors.length)];
		document.documentElement.style.setProperty('--accent-color', randomColor);
		document.querySelectorAll('.btn.operator').forEach(btn => {
			btn.style.color = randomColor;
		});
		document.querySelectorAll('.btn.equals').forEach(btn => {
			btn.style.background = randomColor;
		});
	}

	// Add a test button for speech
	const testButton = document.createElement('button');
	testButton.textContent = 'Test Speech';
	testButton.style.position = 'fixed';
	testButton.style.bottom = '10px';
	testButton.style.right = '10px';
	testButton.onclick = () => speak('Testing calculator voice');
	document.body.appendChild(testButton);
	
	buttons.forEach(btn => {
		btn.addEventListener('click', () => {
			const val = btn.getAttribute('data-value');
			const textToSpeak = getButtonText(val);
			console.log('Button clicked:', val, '-> Speaking:', textToSpeak);
			speak(textToSpeak);
			
			// Get the active calculator
			const isScientific = btn.closest('#scientific-calc') !== null;
			const activeDisplay = isScientific ? sciDisplay : display;
			const activeFormula = isScientific ? sciFormula : formula;
			if (val === 'C') {
				current = '';
				operator = '';
				operand = '';
				display.textContent = '0';
				formula.textContent = '0';
				return;
			}
			if (val === '=') {
				if (calculatorState.operator && calculatorState.operand !== '') {
					const expression = calculatorState.operand + calculatorState.operator + calculatorState.current;
					let result;
					try {
						result = btn.closest('#scientific-calc') !== null ? 
							evaluateScientific(expression) : 
							eval(expression);
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
				setRandomAccentColor();
				return;
			}
			// Handle scientific functions
			if (['sin', 'cos', 'tan', 'log', 'sqrt'].includes(val)) {
				if (current === '') {
					current = activeDisplay.textContent;
				}
				operand = val + '(' + current + ')';
				current = '';
				updateFormula(activeFormula, operand, operator, current);
				return;
			}
			
			// Handle constants
			if (['pi', 'e'].includes(val)) {
				calculatorState.current += val === 'pi' ? 'π' : 'e';
				updateDisplays();
				return;
			}
			
			// Handle memory operations
			if (['mc', 'm+', 'm-', 'mr'].includes(val)) {
				calculatorState.current = handleMemory(val, calculatorState.current || displays.simple.result.textContent);
				updateDisplays();
				return;
			}
			
			if (['+', '-', '*', '/', '2^'].includes(val)) {
				if (calculatorState.current === '') {
					calculatorState.operand = displays.simple.result.textContent;
				} else {
					calculatorState.operand = calculatorState.current;
				}
				calculatorState.operator = val;
				calculatorState.current = '';
				updateDisplays();
				return;
			}
			if (val === '.' && current.includes('.')) {
				return;
			}
			calculatorState.current += val;
			updateDisplays();
		});
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			const equalsBtn = document.querySelector('.btn.equals');
			if (equalsBtn) {
				equalsBtn.click();
			}
		}
	});
});
