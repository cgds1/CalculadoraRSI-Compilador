/**
 * compiler/generator/proxyGRPC.js
 * Generates the gRPC proxy ESM class from the DCL AST.
 */

export function generateProxyGRPC(ast) {
  const cls = ast.classes[0];
  const port = ast.port;
  const serviceName = ast.name.replace('Service', '').toLowerCase();
  const protoFile = `${serviceName}.proto`;

  const methods = cls.methods.map(m => {
    const params = m.params.map(p => p.name).join(', ');
    const payload = m.params.length > 0
      ? `{ ${m.params.map(p => p.name).join(', ')} }`
      : '{}';

    return [
      `  ${m.name}(${params}) {`,
      `    return new Promise((resolve, reject) => {`,
      `      this.client.${m.name}(${payload}, (err, response) => {`,
      `        if (err) reject(err);`,
      `        else resolve(response.valor);`,
      `      });`,
      `    });`,
      `  }`,
    ].join('\n');
  }).join('\n\n');

  return [
    `import grpc from '@grpc/grpc-js';`,
    `import protoLoader from '@grpc/proto-loader';`,
    `import path from 'path';`,
    `import { fileURLToPath } from 'url';`,
    ``,
    `const __dirname = path.dirname(fileURLToPath(import.meta.url));`,
    ``,
    `const packageDefinition = protoLoader.loadSync(`,
    `  path.join(__dirname, '${protoFile}')`,
    `);`,
    `const proto = grpc.loadPackageDefinition(packageDefinition)`,
    `  .${serviceName};`,
    ``,
    `export default class ${cls.name}ProxyGRPC {`,
    `  constructor() {`,
    `    const host = process.env.SERVER_HOST || 'localhost';`,
    `    this.client = new proto.${cls.name}(`,
    `      \`\${host}:${port}\`,`,
    `      grpc.credentials.createInsecure()`,
    `    );`,
    `  }`,
    ``,
    methods,
    `}`,
    ``,
  ].join('\n');
}