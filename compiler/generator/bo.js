/**
 * compiler/generator/bo.js
 * Generates the Business Object (ESM class) from the DCL AST.
 */

export function generateBO(ast) {
  const cls = ast.classes[0];

  const methods = cls.methods.map(m => {
    const params = m.params.map(p => p.name).join(', ');
    return [
      `  ${m.name}(${params}) {`,
      `    // TODO: implement ${m.name}`,
      `    throw new Error('${m.name} not implemented');`,
      `  }`,
    ].join('\n');
  }).join('\n\n');

  return [
    `export default class ${cls.name} {`,
    methods,
    `}`,
    '',
  ].join('\n');
}