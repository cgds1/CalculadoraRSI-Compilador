/**
 * compiler/generator/proto.js
 * Generates a proto3 file from the DCL AST.
 */

const TYPE_MAP = {
  float:  'float',
  int:    'int32',
  string: 'string',
  bool:   'bool',
};

function toProtoType(dclType) {
  return TYPE_MAP[dclType] ?? dclType;
}

export function generateProto(ast) {
  const cls = ast.classes[0];

  // Build shared Operacion message from first method's params
  const firstMethod = cls.methods[0];
  const operacionFields = firstMethod.params
    .map((p, i) => `    ${toProtoType(p.type)} ${p.name} = ${i + 1};`)
    .join('\n');

  // Resultado uses the return type of the first method
  const resultType = toProtoType(firstMethod.returnType ?? 'float');

  // One rpc per method, all share Operacion / Resultado
  const rpcs = cls.methods
    .map(m => `    rpc ${m.name} (Operacion) returns (Resultado);`)
    .join('\n');

  return [
    'syntax = "proto3";',
    '',
    `package ${ast.name.replace('Service', '').toLowerCase()};`,
    '',
    `service ${cls.name} {`,
    rpcs,
    '}',
    '',
    'message Operacion {',
    operacionFields,
    '}',
    '',
    'message Resultado {',
    `    ${resultType} valor = 1;`,
    '}',
    '',
  ].join('\n');
}