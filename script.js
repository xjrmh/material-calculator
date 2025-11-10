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
	
	// Function to format numbers with thousand delimiters
	function formatNumber(value) {
		if (!value || value === '0') return '0';
		
		// Handle error messages
		if (value === 'Error' || isNaN(value)) return value;
		
		const num = parseFloat(value);
		if (isNaN(num)) return value;
		
		// Format with thousand separators
		// Use toLocaleString for proper formatting
		// Preserve precision for scientific calculations
		const parts = value.toString().split('.');
		const integerPart = parts[0];
		const decimalPart = parts[1] || '';
		
		// Add commas to integer part
		const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		
		// Combine with decimal part if exists
		return decimalPart ? formattedInteger + '.' + decimalPart : formattedInteger;
	}
	
	// Function to sync displays across calculators
	function updateDisplays() {
		// Update result displays with formatted numbers
		const formattedValue = formatNumber(calculatorState.current) || '0';
		displays.simple.result.textContent = formattedValue;
		displays.scientific.result.textContent = formattedValue;
		
		// Update formula displays
		const formulaText = getFormulaText();
		displays.simple.formula.textContent = formulaText;
		displays.scientific.formula.textContent = formulaText;
	}
	
	// Function to get formatted formula text
	function getFormulaText() {
		let text = '';
		if (calculatorState.operand !== '') {
			text += formatNumber(calculatorState.operand);
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
			text += ' ' + formatNumber(calculatorState.current);
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
			'mr': 'memory recall',
			'random': 'random calculation'
		};
		return valueMap[val] || val;
	}
	
	// Scientific calculator functions
	function evaluateScientific(expression) {
		try {
			// Replace scientific functions and constants
			// Be careful to replace constants only when they appear as standalone values
			expression = expression
				.replace(/π/g, 'Math.PI')
				.replace(/\be\b/g, 'Math.E')  // Only replace 'e' as a standalone constant
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
	
	// Memory functions
	function handleMemory(action, value = 0) {
		switch (action) {
			case 'mc':
				calculatorState.memory = 0;
				speak('Memory cleared');
				break;
			case 'm+':
				calculatorState.memory += parseFloat(value) || 0;
				speak('Memory plus');
				break;
			case 'm-':
				calculatorState.memory -= parseFloat(value) || 0;
				speak('Memory minus');
				break;
			case 'mr':
				speak('Memory recall');
				return calculatorState.memory.toString();
		}
		return value.toString();
	}
	
	// Speak the given text with natural-sounding settings
	function speak(text) {
		// Remove commas from numbers for better speech
		text = text.toString().replace(/,/g, '');
		
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
			const activeDisplays = isScientific ? displays.scientific : displays.simple;
			if (val === 'C') {
				calculatorState.current = '';
				calculatorState.operator = '';
				calculatorState.operand = '';
				updateDisplays();
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
			
			// Handle random calculation
			if (val === 'random') {
				const isScientific = btn.closest('#scientific-calc') !== null;
				let result;
				
				if (isScientific) {
					// Scientific random calculations
					const operations = [
						() => {
							const num = Math.floor(Math.random() * 100);
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
							const num = Math.floor(Math.random() * 100) + 1;
							return { expr: `log(${num})`, result: Math.log10(num) };
						},
						() => {
							const num = Math.floor(Math.random() * 20) + 1;
							return { expr: `${num}²`, result: num * num };
						},
						() => {
							const num1 = Math.floor(Math.random() * 100);
							const num2 = Math.floor(Math.random() * 100);
							const ops = ['+', '-', '*', '/'];
							const op = ops[Math.floor(Math.random() * ops.length)];
							return { expr: `${num1} ${op} ${num2}`, result: eval(`${num1}${op}${num2}`) };
						}
					];
					const operation = operations[Math.floor(Math.random() * operations.length)]();
					result = operation.result;
					speak(`Random calculation: ${operation.expr} equals ${result.toFixed(4)}`);
				} else {
					// Simple random calculations
					const num1 = Math.floor(Math.random() * 1000);
					const num2 = Math.floor(Math.random() * 1000);
					const operations = [
						{ op: '+', calc: num1 + num2, symbol: 'plus' },
						{ op: '-', calc: num1 - num2, symbol: 'minus' },
						{ op: '*', calc: num1 * num2, symbol: 'times' },
						{ op: '/', calc: num1 / num2, symbol: 'divided by' }
					];
					const selected = operations[Math.floor(Math.random() * operations.length)];
					result = selected.calc;
					speak(`Random calculation: ${num1} ${selected.symbol} ${num2} equals ${result.toFixed(2)}`);
				}
				
				calculatorState.current = result.toString();
				calculatorState.operator = '';
				calculatorState.operand = '';
				updateDisplays();
				setRandomAccentColor();
				return;
			}
			// Handle scientific functions
			if (['sin', 'cos', 'tan', 'log', 'sqrt'].includes(val)) {
				if (calculatorState.current === '') {
					calculatorState.current = activeDisplays.result.textContent;
				}
				// Immediately evaluate the scientific function
				const expression = val + '(' + calculatorState.current + ')';
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
				return;
			}
			
			// Handle x² (square function)
			if (val === '2^') {
				if (calculatorState.current === '') {
					calculatorState.current = activeDisplays.result.textContent;
				}
				const num = parseFloat(calculatorState.current);
				const result = num * num;
				speak(result.toString());
				calculatorState.current = result.toString();
				calculatorState.operator = '';
				calculatorState.operand = '';
				updateDisplays();
				return;
			}
			
			// Handle constants
			if (['pi', 'e'].includes(val)) {
				// If there's already a number, treat constants as multiplication
				if (calculatorState.current !== '' && calculatorState.current !== '0') {
					calculatorState.operand = calculatorState.current;
					calculatorState.operator = '*';
					calculatorState.current = val === 'pi' ? Math.PI.toString() : Math.E.toString();
				} else {
					calculatorState.current = val === 'pi' ? Math.PI.toString() : Math.E.toString();
				}
				updateDisplays();
				return;
			}
			
			// Handle memory operations
			if (['mc', 'm+', 'm-', 'mr'].includes(val)) {
				calculatorState.current = handleMemory(val, calculatorState.current || displays.simple.result.textContent);
				updateDisplays();
				return;
			}
			
			if (['+', '-', '*', '/'].includes(val)) {
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
			if (val === '.' && calculatorState.current.includes('.')) {
				return;
			}
			calculatorState.current += val;
			updateDisplays();
		});
	});

	document.addEventListener('keydown', (event) => {
		// Handle Enter key
		if (event.key === 'Enter') {
			const equalsBtn = document.querySelector('.btn.equals');
			if (equalsBtn) {
				equalsBtn.click();
			}
			return;
		}
		
		// Handle number keys
		if (event.key >= '0' && event.key <= '9') {
			const btn = document.querySelector(`.btn[data-value="${event.key}"]`);
			if (btn) {
				btn.click();
			}
			return;
		}
		
		// Handle operators
		const operatorMap = {
			'+': '+',
			'-': '-',
			'*': '*',
			'/': '/',
			'.': '.'
		};
		
		if (operatorMap[event.key]) {
			const btn = document.querySelector(`.btn[data-value="${operatorMap[event.key]}"]`);
			if (btn) {
				btn.click();
			}
			return;
		}
		
		// Handle Clear (Escape or c key)
		if (event.key === 'Escape' || event.key.toLowerCase() === 'c') {
			const clearBtn = document.querySelector('.btn[data-value="C"]');
			if (clearBtn) {
				clearBtn.click();
			}
			return;
		}
	});
});
