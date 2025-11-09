document.addEventListener('DOMContentLoaded', function () {
  const display = document.getElementById('display');
  const buttons = document.querySelectorAll('.btn');
  let current = '';
  let operator = '';
  let operand = '';

  // Define a list of accent colors to cycle through
  const colors = ['#6200ee', '#1e88e5', '#e53935', '#43a047', '#ff9800', '#8e24aa', '#00bcd4'];

  function setRandomAccentColor() {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    // Update CSS variable
    document.documentElement.style.setProperty('--accent-color', randomColor);
    // Also update operator button text color and equals button background directly
    document.querySelectorAll('.btn.operator').forEach(opBtn => {
      opBtn.style.color = randomColor;
    });
    const eqBtn = document.querySelector('.btn.equals');
    if (eqBtn) {
      eqBtn.style.background = randomColor;
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
      } else if (val === '=') {
        if (operator && operand !== '') {
          let expression = operand + operator + current;
          let result = eval(expression);
          display.textContent = result;
          current = result.toString();
          operator = '';
          operand = '';
        }
        // Change accent color when equals is pressed
        setRandomAccentColor();
      } else if (['+', '-', '*', '/'].includes(val)) {
        if (current === '') {
          operand = display.textContent;
        } else {
          operand = current;
        }
        operator = val;
        current = '';
      } else {
        current += val;
        display.textContent = current;
      }
    });
  });

  // Handle Enter key on keyboard to trigger equals and color change
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const equalsBtn = document.querySelector('[data-value="="]');
      if (equalsBtn) equalsBtn.click();
    }
  });
});
