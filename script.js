document.addEventListener('DOMContentLoaded', () => {
  const colors = ['#6200ee', '#1e88e5', '#e53935', '#43a047', '#ff9800', '#8e24aa', '#00bcd4'];

  function hexToRGBA(hex, alpha) {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function setRandomAccentColor() {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    document.documentElement.style.setProperty('--accent-color', randomColor);
    document.querySelectorAll('.btn.operator').forEach(btn => {
      btn.style.color = randomColor;
    });
    const equalsBtn = document.querySelector('.btn.equals');
    if (equalsBtn) {
      equalsBtn.style.background = randomColor;
    }
    const display = document.querySelector('.display');
    if (display) {
      display.style.background = hexToRGBA(randomColor, 0.3);
    }
  }

  let expression = '';
  let currentNumber = '';

  const formulaEl = document.getElementById('formula');
  const resultEl = document.getElementById('result');
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-value');
      if (value === 'C') {
        expression = '';
        currentNumber = '';
        formulaEl.textContent = '';
        resultEl.textContent = '0';
        return;
      }
      if (value === '=') {
        if (!currentNumber) return;
        expression += currentNumber;
        try {
          const result = eval(expression);
          resultEl.textContent = result;
          formulaEl.textContent = expression;
          // prepare for next calculation
          expression = '';
          currentNumber = String(result);
          setRandomAccentColor();
        } catch (e) {
          resultEl.textContent = 'Error';
        }
        return;
      }
      if (['+', '-', '*', '/'].includes(value)) {
        if (currentNumber === '' && expression === '') {
          return;
        }
        expression += currentNumber + value;
        currentNumber = '';
        formulaEl.textContent = expression;
        resultEl.textContent = '0';
        return;
      }
      // number or decimal
      currentNumber += value;
      resultEl.textContent = currentNumber;
      formulaEl.textContent = expression + currentNumber;
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const equalsBtn = document.querySelector('.btn.equals');
      if (equalsBtn) {
        equalsBtn.click();
      }
    }
  });
});
