/**
 * compiler/generator/client.js
 * Generates an interactive console client from the DCL AST.
 * Uses gRPC proxy by default; socket proxy when protocol === 'socket'.
 */

export function generateClient(ast) {
  const cls = ast.classes[0];
  const protocol = ast.protocol;

  const useSocket = protocol === 'socket';
  const proxyFile = useSocket
    ? `./${cls.name}ProxySocket.js`
    : `./${cls.name}ProxyGRPC.js`;
  const proxyClass = useSocket
    ? `${cls.name}ProxySocket`
    : `${cls.name}ProxyGRPC`;

  // Menu display lines
  const menuLines = cls.methods
    .map((m, i) => `    console.log('  ${i + 1}. ${m.name}');`)
    .join('\n');

  // Switch cases — prompt each param, call method, print result
  const cases = cls.methods.map((m, i) => {
    const prompts = m.params
      .map(p => `      const ${p.name} = parseFloat(await question('  ${p.name}: '));`)
      .join('\n');
    const args = m.params.map(p => p.name).join(', ');

    return [
      `    case ${i + 1}: {`,
      prompts,
      `      const result = await proxy.${m.name}(${args});`,
      `      console.log('Resultado:', result);`,
      `      break;`,
      `    }`,
    ].join('\n');
  }).join('\n');

  return [
    `import readline from 'node:readline';`,
    `import ${proxyClass} from '${proxyFile}';`,
    ``,
    `const rl = readline.createInterface({ input: process.stdin, output: process.stdout });`,
    `const question = (q) => new Promise((res) => rl.question(q, res));`,
    ``,
    `async function main() {`,
    `  const proxy = new ${proxyClass}();`,
    `  let running = true;`,
    ``,
    `  while (running) {`,
    `    console.log('\\n=== ${cls.name} ===');`,
    menuLines,
    `    console.log('  0. Salir');`,
    ``,
    `    const opt = parseInt(await question('Opción: '), 10);`,
    ``,
    `    switch (opt) {`,
    cases,
    `      case 0:`,
    `        running = false;`,
    `        break;`,
    `      default:`,
    `        console.log('Opción inválida');`,
    `    }`,
    `  }`,
    ``,
    `  rl.close();`,
    `}`,
    ``,
    `main().catch(console.error);`,
    ``,
  ].join('\n');
}