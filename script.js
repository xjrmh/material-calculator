document.addEventListener('DOMContentLoaded', () => {
  const display = document.getElementById('display');
  const buttons = document.querySelectorAll('.btn');
  let current = '';
  let operator = '';
  let operand = '';

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

  // Randomly set accent color and update button styles and display background
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
    if (display) {
      display.style.background = hexToRGBA(randomColor, 0.3);
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-value');
      if (val === 'C') {
        current = '';
        operator = '';
        operand = '';
        display.textContent = '0';
        return;
      }
      if (val === '=') {
        if (operator && operand !== '') {
          const expression = operand + operator + current;
          let result;
          try {
            result = eval(expression);
          } catch (e) {
            result = 'Error';
          }
          display.textContent = result;
          current = result.toString();
          operator = '';
          operand = '';
        }
        setRandomAccentColor();
        return;
      }
      if (['+', '-', '*', '/'].includes(val)) {
        if (current === '') {
          operand = display.textContent;
        } else {
          operand = current;
        }
        operator = val;
        current = '';
        return;
      }
      if (val === '.' && current.includes('.')) {
        return;
      }
      current += val;
      display.textContent = current;
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
