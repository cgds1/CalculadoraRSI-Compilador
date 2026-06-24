/**
 * compiler/generator/proxySocket.js
 * Generates the Socket JSON proxy ESM class from the DCL AST.
 * Puerto del socket tomado directamente del .dcl (coincide con ServerRSI.js).
 */

export function generateProxySocket(ast) {
  const cls = ast.classes[0];
  const socketPort = ast.port;

  const methods = cls.methods.map(m => {
    const params = m.params.map(p => p.name).join(', ');
    const paramsArray = m.params.length > 0
      ? `[${m.params.map(p => p.name).join(', ')}]`
      : '[]';

    return [
      `  ${m.name}(${params}) {`,
      `    return new Promise((resolve, reject) => {`,
      `      const host = process.env.SERVER_HOST || 'localhost';`,
      `      const socket = net.createConnection({ host, port: ${socketPort} }, () => {`,
      `        const msg = JSON.stringify({`,
      `          objeto: '${cls.name}',`,
      `          metodo: '${m.name}',`,
      `          params: ${paramsArray},`,
      `        });`,
      `        socket.write(msg);`,
      `      });`,
      ``,
      `      socket.on('data', (data) => {`,
      `        const { resultado, error } = JSON.parse(data.toString());`,
      `        if (error) reject(error);`,
      `        else resolve(resultado);`,
      `        socket.end();`,
      `      });`,
      ``,
      `      socket.on('error', (err) => reject(err));`,
      `    });`,
      `  }`,
    ].join('\n');
  }).join('\n\n');

  return [
    `import net from 'net';`,
    ``,
    `export default class ${cls.name}ProxySocket {`,
    methods,
    `}`,
    ``,
  ].join('\n');
}