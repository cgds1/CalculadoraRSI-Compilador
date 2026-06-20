/**
 * compiler/compiler.js
 * CLI orquestador del pipeline DCL
 *
 * Uso:
 *   node compiler/compiler.js [archivo.dcl]
 *   npm run compile
 *   npm run compile mi_servicio.dcl
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { tokenize } from './lexer.js';
import { parse }    from './parser.js';
import { validate } from './validator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Logging
const log   = (msg) => console.log(`[DCL] ${msg}`);
const warn  = (msg) => console.warn(`[WARN] ${msg}`);
const error = (msg) => console.error(`[ERROR] ${msg}`);

async function tryImport(relPath) {
  const abs = path.join(__dirname, relPath);
  if (!fs.existsSync(abs)) return null;
  try {
    return await import(abs);
  } catch (e) {
    warn(`No se pudo cargar el generador "${relPath}": ${e.message}`);
    return null;
  }
}

function writeArtifact(outputDir, filename, content) {
  const dest = path.join(outputDir, filename);
  process.stdout.write(`[DCL] Generando ${filename}... `);
  fs.writeFileSync(dest, content, 'utf8');
  console.log('✓');
}

async function main() {
  const inputArg  = process.argv[2] ?? 'calculadora.dcl';
  const inputPath = path.resolve(process.cwd(), inputArg);

  if (!fs.existsSync(inputPath)) {
    error(`Archivo no encontrado: ${inputPath}`);
    process.exit(1);
  }

  log(`Leyendo ${path.basename(inputPath)}...`);
  const source = fs.readFileSync(inputPath, 'utf8');

  // Lexer
  let tokens;
  try {
    tokens = tokenize(source);
  } catch (e) {
    error(`Error léxico: ${e.message}`);
    process.exit(1);
  }
  log(`Tokens generados: ${tokens.filter(t => t.type !== 'eof').length}`);

  // Parser
  let ast;
  try {
    ast = parse(tokens);
  } catch (e) {
    error(`Error de sintaxis: ${e.message}`);
    process.exit(1);
  }
  log('AST construido correctamente');

  // Validator
  const { errors, warnings } = validate(ast);

  for (const w of warnings) {
    const linePart = w.line != null ? ` (línea ${w.line})` : '';
    warn(`${w.message}${linePart}`);
  }

  if (errors.length > 0) {
    for (const e of errors) {
      const linePart = e.line != null ? ` (línea ${e.line})` : '';
      error(`${e.message}${linePart}`);
    }
    process.exit(1);
  }

  // Crear output/
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    log('Directorio output/ creado');
  }

  const protocol   = ast.protocol;
  const svcName    = ast.name.replace('Service', '').toLowerCase(); // e.g. 'calculadora'
  const className  = ast.classes[0].name;                           // e.g. 'Calculadora'

  // Generadores del compilador. Cada entrada: [módulo, export, archivo de salida].
  const GEN = {
    proto:       ['./generator/proto.js',       'generateProto',       `${svcName}.proto`],
    bo:          ['./generator/bo.js',          'generateBO',          `${className}.js`],
    proxyGRPC:   ['./generator/proxyGRPC.js',   'generateProxyGRPC',   `${className}ProxyGRPC.js`],
    proxySocket: ['./generator/proxySocket.js', 'generateProxySocket', `${className}ProxySocket.js`],
    client:      ['./generator/client.js',      'generateClient',      `Cliente${className}.js`],
  };

  let selectedGenerators;
  if (protocol === 'grpc') {
    selectedGenerators = [GEN.proto, GEN.bo, GEN.proxyGRPC, GEN.client];
  } else if (protocol === 'socket') {
    selectedGenerators = [GEN.bo, GEN.proxySocket, GEN.client];
  } else {
    // 'both' — los 5 artefactos
    selectedGenerators = [GEN.proto, GEN.bo, GEN.proxyGRPC, GEN.proxySocket, GEN.client];
  }

  let generatorsRun = 0;
  for (const [modPath, exportName, outFile] of selectedGenerators) {
    const mod = await tryImport(modPath);
    if (!mod) {
      warn(`Generador aún no implementado: ${modPath} (se omite)`);
      continue;
    }
    if (typeof mod[exportName] !== 'function') {
      warn(`El módulo "${modPath}" no exporta "${exportName}" (se omite)`);
      continue;
    }
    const content = mod[exportName](ast);
    writeArtifact(outputDir, outFile, content);
    generatorsRun++;
  }

  if (generatorsRun === 0) {
    warn('Ningún generador disponible todavía — output/ quedó vacío');
  }

  log('Compilación exitosa → /output');
}

main().catch((e) => {
  error(`Error inesperado: ${e.message}`);
  process.exit(1);
});