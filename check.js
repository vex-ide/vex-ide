function validateVexSyntax(code) {
  const lines = code.split('\n');
  const errors = [];
  let hasContain = false;
  let inAction = false;
  let braceLevel = 0;
  let actionCount = 0;
  let exitFoundInCurrentAction = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) continue;

    if (lineNum === 1) {
      if (trimmed !== '#contain <sysio>') {
        errors.push({ code: "INVALID_FIRST_LINE", line: lineNum, got: trimmed });
      }
      hasContain = true;
      continue;
    }

    if (trimmed === '#contain <sysio>') {
      errors.push({ code: "MULTIPLE_CONTAIN", line: lineNum });
      continue;
    }

    if (trimmed.startsWith('act ')) {
      if (inAction && braceLevel > 0) {
        errors.push({ code: "NESTED_ACTIONS", line: lineNum });
        continue;
      }

      let def = trimmed.slice(4).trim();
      let hasOpenBrace = def.endsWith('{');
      if (hasOpenBrace) def = def.slice(0, -1).trim();

      let namePart = def;
      if (def.endsWith('()')) {
        namePart = def.slice(0, -2).trim();
      }

      if (!namePart) {
        errors.push({ code: "MISSING_ACTION_NAME", line: lineNum });
        continue;
      }

      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(namePart)) {
        errors.push({ code: "INVALID_ACTION_NAME", line: lineNum, got: namePart });
        continue;
      }

      if (!hasOpenBrace) {
        errors.push({ code: "MISSING_OPEN_BRACE_AFTER_ACTION", line: lineNum, got: def });
        continue;
      }

      inAction = true;
      braceLevel++;
      actionCount++;
      exitFoundInCurrentAction = false;
      continue;
    }

    if (trimmed === '{') {
      braceLevel++;
      continue;
    }

    if (trimmed === '}') {
      braceLevel--;
      if (braceLevel < 0) {
        errors.push({ code: "UNEXPECTED_CLOSING_BRACE", line: lineNum });
        continue;
      }
      if (braceLevel === 0) {
        inAction = false;
        if (!exitFoundInCurrentAction) {
          errors.push({ code: "ACTION_MISSING_EXIT_CODE", line: lineNum });
        }
      }
      continue;
    }

    if (!inAction || braceLevel === 0) {
      errors.push({ code: "CODE_OUTSIDE_ACTION_BLOCK", line: lineNum, got: trimmed });
      continue;
    }

    if (trimmed.startsWith('sys.output =') || trimmed.startsWith('sys.input =')) {
      const isInput = trimmed.startsWith('sys.input =');
      let prefixLength = isInput ? 11 : 12;
      let rest = trimmed.slice(prefixLength).trim();

      if (!rest.startsWith('"')) {
        errors.push({ code: isInput ? "SYS_INPUT_MISSING_OPEN_QUOTE" : "SYS_OUTPUT_MISSING_OPEN_QUOTE", line: lineNum, got: rest });
        continue;
      }

      let semicolonPos = rest.lastIndexOf(';');
      if (semicolonPos === -1) {
        errors.push({ code: "MISSING_SEMICOLON_AFTER_STATEMENT", line: lineNum });
        continue;
      }

      let beforeSemicolon = rest.slice(0, semicolonPos).trimEnd();

      if (!beforeSemicolon.endsWith('"')) {
        errors.push({ code: isInput ? "SYS_INPUT_MISSING_CLOSING_QUOTE" : "SYS_OUTPUT_MISSING_CLOSING_QUOTE", line: lineNum, got: beforeSemicolon });
        continue;
      }

      let value = beforeSemicolon.slice(1, -1);

      if (value.includes('"') || /[{}\\;]/.test(value)) {
        errors.push({ code: "INVALID_CHARACTERS_IN_STRING", line: lineNum, got: value });
        continue;
      }

      continue;
    }

    if (trimmed.startsWith('sys.wait(')) {
      let rest = trimmed.slice(9).trim();

      if (!rest.endsWith(');')) {
        errors.push({ code: "SYS_WAIT_INVALID_FORMAT", line: lineNum, got: rest });
        continue;
      }

      let argPart = rest.slice(0, -2).trim();
      let num = Number(argPart);

      if (isNaN(num) || num <= 0) {
        errors.push({ code: "SYS_WAIT_INVALID_ARGUMENT", line: lineNum, got: argPart });
        continue;
      }

      continue;
    }

    if (trimmed === 'sys.clear();') {
      continue;
    }

    if (trimmed.startsWith('call ')) {
      let rest = trimmed.slice(5).trim();

      if (!rest.endsWith('();')) {
        errors.push({ code: "CALL_INVALID_FORMAT", line: lineNum });
        continue;
      }

      let name = rest.slice(0, -3).trim();
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        errors.push({ code: "CALL_INVALID_NAME", line: lineNum, got: name });
        continue;
      }

      continue;
    }

    if (trimmed.startsWith('exit.code')) {
      const rest = trimmed.slice(9).trim();
      if (rest !== '0;') {
        errors.push({ code: "INVALID_EXIT_CODE_SYNTAX", line: lineNum, got: rest });
        continue;
      }
      exitFoundInCurrentAction = true;
      continue;
    }

    errors.push({ code: "UNKNOWN_STATEMENT", line: lineNum, got: trimmed });
  }

  if (!hasContain) {
    errors.unshift({ code: "MISSING_REQUIRED_CONTAIN_DIRECTIVE" });
  }

  if (braceLevel > 0) {
    errors.push({ code: "UNCLOSED_BRACE_BLOCK" });
  }

  return errors.length > 0 ? errors : null;
}
