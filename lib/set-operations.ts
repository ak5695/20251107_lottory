export type Operation = "intersection" | "union" | "aMinusB" | "bMinusA" | "xor";

export function parseNumbers(text: string): string[] {
  const tokens = text.trim() ? text.trim().split(/[\s,，;；]+/) : [];
  const invalid = tokens.filter((token) => !/^\d{4}$/.test(token));
  if (invalid.length) throw new Error(`发现 ${invalid.length} 项格式错误（如“${invalid[0].slice(0, 20)}”），请输入完整四位号码。`);
  return [...new Set(tokens)];
}

export function operate(a: string[], b: string[], operation: Operation): string[] {
  const left = new Set(a);
  const right = new Set(b);
  switch (operation) {
    case "intersection": return [...left].filter((n) => right.has(n));
    case "union": return [...new Set([...left, ...right])];
    case "aMinusB": return [...left].filter((n) => !right.has(n));
    case "bMinusA": return [...right].filter((n) => !left.has(n));
    case "xor": return [...left].filter((n) => !right.has(n)).concat([...right].filter((n) => !left.has(n)));
  }
}
