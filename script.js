const codeArea = document.getElementById('code');
const gutter = document.getElementById('gutter');
const runBtn = document.getElementById('run-btn');
const outputPanel = document.getElementById('output-panel');
const outputPre = document.getElementById('output');
const backBtn = document.getElementById('back-btn');

function updateLineNumbers() {
  const text = codeArea.value || '';
  const lineCount = text.split('\n').length;
  if (gutter.dataset.lineCount !== String(lineCount)) {
    gutter.dataset.lineCount = lineCount;
    gutter.textContent = Array.from({length: lineCount}, (_, i) => i + 1).join('\n');
  }
  requestAnimationFrame(() => gutter.scrollTop = codeArea.scrollTop);
}

codeArea.addEventListener('input', updateLineNumbers);
codeArea.addEventListener('scroll', () => requestAnimationFrame(() => gutter.scrollTop = codeArea.scrollTop));
codeArea.addEventListener('paste', () => setTimeout(updateLineNumbers, 10));
window.addEventListener('resize', updateLineNumbers);
updateLineNumbers();

async function getUserInput(promptText) {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.className = 'input-container';
    container.innerHTML = `
      <div class="input-prompt">${promptText}</div>
      <div class="input-wrapper">
        <input type="text" id="user-input-field" autocomplete="off" autofocus>
        <button id="send-input-btn">OK</button>
      </div>
    `;
    outputPre.appendChild(container);
    outputPre.scrollTop = outputPre.scrollHeight;

    const input = container.querySelector('#user-input-field');
    const btn = container.querySelector('#send-input-btn');

    const submit = () => {
      const val = input.value;
      container.innerHTML = `<div class="input-prompt">${promptText} <span style="color:#aff5b4">${val}</span></div>`;
      resolve(val);
    };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { 
      if(e.key === 'Enter') submit(); 
    });
    
    setTimeout(() => input.focus(), 50);
  });
}

async function runCode() {
  const code = codeArea.value;
  const syntaxErrors = validateVexSyntax(code);

  outputPanel.classList.add('visible');
  outputPre.className = '';
  outputPre.innerHTML = '';

  if (syntaxErrors) {
    outputPre.innerHTML = formatErrors(syntaxErrors)
      .split('\n')
      .map(l => `<span class="error-line">${l}</span>`)
      .join('<br>');
    outputPre.className = 'error';
    return;
  }

  const lines = code.split('\n');
  const actions = new Map();
  let braceLevel = 0;
  let currentAction = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('act ')) {
      let def = trimmed.slice(4).trim();
      let nameEnd = def.indexOf('(') !== -1 ? def.indexOf('(') : def.indexOf('{');
      let name = def.slice(0, nameEnd).trim();
      actions.set(name, {start: i, end: -1});
      currentAction = name;
      braceLevel = 1;
    }
    if (trimmed === '{') braceLevel++;
    if (trimmed === '}') {
      braceLevel--;
      if (braceLevel === 0 && currentAction) {
        actions.get(currentAction).end = i;
        currentAction = null;
      }
    }
  }

  if (actions.size === 0) {
    outputPre.textContent = 'Error: Keine act-Funktion gefunden';
    return;
  }

  const firstActionName = [...actions.keys()][0];

  async function executeAction(name) {
    const def = actions.get(name);
    if (!def) {
      outputPre.innerHTML += `<br><span style="color:red">[Funktion ${name} nicht gefunden]</span>`;
      return;
    }

    for (let i = def.start + 1; i < def.end; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line === 'sys.clear();') {
        outputPre.innerHTML = '';
        continue;
      }

      if (line.startsWith('sys.output =') || line.startsWith('sys.input =')) {
        const isInput = line.startsWith('sys.input =');
        const original = lines[i];
        const start = original.indexOf('"');
        if (start === -1) continue;
        const end = original.indexOf('";', start + 1);
        if (end === -1) continue;
        const value = original.substring(start + 1, end);
        
        if (isInput) {
          const userInput = await getUserInput(value);
        } else {
          outputPre.innerHTML += value + '<br>';
        }
        outputPre.scrollTop = outputPre.scrollHeight;
        continue;
      }

      if (line.startsWith('sys.wait(')) {
        const rest = line.slice(9).trim();
        if (rest.endsWith(');')) {
          const sec = Number(rest.slice(0, -2).trim());
          if (!isNaN(sec) && sec > 0) await new Promise(r => setTimeout(r, sec * 1000));
        }
        continue;
      }

      if (line.startsWith('call ')) {
        const callName = line.slice(5, -3).trim();
        await executeAction(callName);
        continue;
      }

      if (line === 'exit.code 0;') {
        return;
      }
    }
  }

  await executeAction(firstActionName);

  if (outputPre.innerHTML === '') outputPre.textContent = '(no output)';
}

runBtn.addEventListener('click', runCode);
backBtn.addEventListener('click', () => outputPanel.classList.remove('visible'));

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runCode();
  }
});
