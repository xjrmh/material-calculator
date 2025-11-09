document.addEventListener('DOMContentLoaded', function () {
  const display = document.getElementById('display');
  const buttons = document.querySelectorAll('.btn');
  let current = '';
  let operator = '';
  let operand = '';
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
});
