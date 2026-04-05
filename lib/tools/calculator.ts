// Calculator tool — evaluates safe mathematical expressions
// No eval() — uses a whitelist-based expression parser

export type CalcResult = { ok: true; result: number; expression: string } | { ok: false; error: string };

// Safe tokeniser and evaluator — handles +, -, *, /, ^, %, (, ), constants
export function calculate(expression: string): CalcResult {
  const expr = expression
    .replace(/\s+/g, '')
    .replace(/pi/gi, String(Math.PI))
    .replace(/e(?![a-z])/gi, String(Math.E))
    .replace(/sqrt\(/gi, 'sqrt(')
    .replace(/abs\(/gi, 'abs(')
    .replace(/floor\(/gi, 'floor(')
    .replace(/ceil\(/gi, 'ceil(')
    .replace(/round\(/gi, 'round(')
    .replace(/sin\(/gi, 'sin(')
    .replace(/cos\(/gi, 'cos(')
    .replace(/tan\(/gi, 'tan(')
    .replace(/log\(/gi, 'log(')
    .replace(/ln\(/gi, 'ln(');

  // Validate: only allow digits, operators, parens, dot, named functions we mapped
  if (!/^[\d\s\+\-\*\/\^\%\(\)\.\,sqrtabsflorceilroundsincotaglno]+$/i.test(expr)) {
    return { ok: false, error: 'Expression contains invalid characters' };
  }

  try {
    const result = evaluateExpr(expr);
    if (!isFinite(result)) return { ok: false, error: 'Result is not finite' };
    return { ok: true, result, expression };
  } catch (e) {
    return { ok: false, error: 'Could not evaluate expression' };
  }
}

// Recursive descent parser
function evaluateExpr(expr: string): number {
  const tokens = tokenise(expr);
  let pos = 0;

  function peek() { return tokens[pos]; }
  function consume() { return tokens[pos++]; }

  function parseExpr(): number { return parseAddSub(); }

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseMulDiv();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseMulDiv(): number {
    let left = parsePower();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume();
      const right = parsePower();
      if (op === '*') left *= right;
      else if (op === '/') { if (right === 0) throw new Error('Division by zero'); left /= right; }
      else left %= right;
    }
    return left;
  }

  function parsePower(): number {
    let base = parseUnary();
    if (peek() === '^') { consume(); base = Math.pow(base, parsePower()); }
    return base;
  }

  function parseUnary(): number {
    if (peek() === '-') { consume(); return -parsePrimary(); }
    if (peek() === '+') { consume(); }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const t = peek();
    if (t === '(') {
      consume();
      const val = parseExpr();
      if (peek() === ')') consume();
      return val;
    }
    if (typeof t === 'string' && /^[a-z]+$/.test(t)) {
      consume();
      if (peek() === '(') {
        consume();
        const arg = parseExpr();
        if (peek() === ')') consume();
        switch (t) {
          case 'sqrt': return Math.sqrt(arg);
          case 'abs': return Math.abs(arg);
          case 'floor': return Math.floor(arg);
          case 'ceil': return Math.ceil(arg);
          case 'round': return Math.round(arg);
          case 'sin': return Math.sin(arg);
          case 'cos': return Math.cos(arg);
          case 'tan': return Math.tan(arg);
          case 'log': return Math.log10(arg);
          case 'ln': return Math.log(arg);
          default: throw new Error(`Unknown function: ${t}`);
        }
      }
      throw new Error(`Unexpected identifier: ${t}`);
    }
    if (typeof t === 'number') { consume(); return t; }
    throw new Error(`Unexpected token: ${t}`);
  }

  return parseExpr();
}

function tokenise(expr: string): (number | string)[] {
  const tokens: (number | string)[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\d|\./.test(c)) {
      let num = '';
      while (i < expr.length && /[\d\.]/.test(expr[i])) num += expr[i++];
      tokens.push(parseFloat(num));
    } else if (/[a-z]/i.test(c)) {
      let name = '';
      while (i < expr.length && /[a-z]/i.test(expr[i])) name += expr[i++];
      tokens.push(name.toLowerCase());
    } else {
      tokens.push(c);
      i++;
    }
  }
  return tokens;
}

// Detect if a message is asking for a calculation
export function detectCalcIntent(message: string): string | null {
  // Explicit /calc prefix
  const explicit = message.match(/^\/calc\s+(.+)/i);
  if (explicit) return explicit[1];

  // "calculate X" / "compute X" / "what is X (as math)"
  const calcMatch = message.match(/(?:calculate|compute|what(?:'s| is) the (?:value|result) of)\s+([0-9\+\-\*\/\^\%\(\)\.\s]+)/i);
  if (calcMatch) return calcMatch[1];

  // Pure math expression on its own line (no prose)
  const pureMath = message.match(/^([0-9\+\-\*\/\^\%\(\)\.\s]+)$/);
  if (pureMath && message.trim().length > 2) return pureMath[1];

  return null;
}
