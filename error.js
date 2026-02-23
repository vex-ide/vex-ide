const errorMessages = {
  MISSING_REQUIRED_CONTAIN_DIRECTIVE: "The very first line must be exactly '#contain <sysio>' – your code is missing this required header.",
  INVALID_FIRST_LINE: "First line must be exactly '#contain <sysio>' (you wrote: {got}). This line is mandatory and must be the very first non-empty line.",
  MULTIPLE_CONTAIN: "#contain <sysio> can only appear once and must be the first line. You have it multiple times or in the wrong place.",

  NESTED_ACTIONS: "You cannot define an action (act ...) inside another action. Actions cannot be nested.",
  MISSING_ACTION_NAME: "Every 'act' must have a name, e.g. act start() { ... } or act hello { ... }. No name was found.",
  INVALID_ACTION_NAME: "Invalid action name '{got}'. Names must start with a letter or underscore and can only contain letters, numbers and underscores.",
  MISSING_OPEN_BRACE_AFTER_ACTION: "After the action name you must have an opening brace '{'. Example: act main() { ... }. You wrote: {got}",

  UNEXPECTED_CLOSING_BRACE: "Unexpected closing brace '}'. There is no matching opening brace '{' for this '}'. Too many closing braces.",
  UNCLOSED_BRACE_BLOCK: "One or more opening braces '{' are missing their closing '}'. Check that every { has a matching }.",
  CODE_OUTSIDE_ACTION_BLOCK: "Code is not allowed outside an action block. Every statement must be inside some act { ... }. Found outside: {got}",
  ACTION_MISSING_EXIT_CODE: "Every action must end with 'exit.code 0;' right before the closing brace '}'. This action block is missing it.",

  SYS_OUTPUT_MISSING_OPEN_QUOTE: "After 'sys.output =' you must start with a double quote \". Example: sys.output = \"Hello\"; You wrote: {got}",
  SYS_OUTPUT_MISSING_CLOSING_QUOTE: "The string after sys.output = is missing the closing double quote \" before the semicolon. Found: {got}",
  
  SYS_INPUT_MISSING_OPEN_QUOTE: "After 'sys.input =' you must start with a double quote \". Example: sys.input = \"Name:\"; You wrote: {got}",
  SYS_INPUT_MISSING_CLOSING_QUOTE: "The string after sys.input = is missing the closing double quote \" before the semicolon. Found: {got}",

  MISSING_SEMICOLON_AFTER_STATEMENT: "Every statement must end with a semicolon ';'. Missing ; after the string.",
  INVALID_CHARACTERS_IN_STRING: "String content between \"...\" may not contain \", ;, { or }. These characters break the syntax. Found: {got}",

  SYS_WAIT_INVALID_FORMAT: "sys.wait must be written exactly like this: sys.wait(1.5); You wrote something else: {got}",
  SYS_WAIT_INVALID_ARGUMENT: "sys.wait() expects a positive number (e.g. 1, 0.5, 2.3). Negative or zero or non-number is not allowed. Got: {got}",

  CALL_INVALID_FORMAT: "call must be written exactly like this: call functionName(); Missing parentheses or semicolon. You wrote: {got}",
  CALL_INVALID_NAME: "Invalid name in call. Function names must start with letter or underscore and can only contain letters, numbers, underscores. Got: {got}",
  CALL_UNDEFINED: "You are calling a function that does not exist in this code: '{got}'. Make sure the act with that name is defined somewhere.",

  UNKNOWN_STATEMENT: "Unknown or invalid statement: {got}. Only allowed: sys.output = \"...\"; sys.input = \"...\"; sys.wait(...); call name(); exit.code 0;"
};

function getErrorMessage(err) {
  let msg = errorMessages[err.code] || "Unknown error";

  if (err.got) {
    msg = msg.replace('{got}', `"${err.got}"`);
  }

  if (err.line !== undefined) {
    return `Line ${err.line}: ${msg}`;
  }

  return msg;
}

function formatErrors(errors) {
  if (!errors || errors.length === 0) return "";

  return errors
    .map(getErrorMessage)
    .join('\n');
}
