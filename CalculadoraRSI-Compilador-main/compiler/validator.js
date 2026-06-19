/**
 * compiler/validator.js
 * Fase 03 — Semantic validator for DCL AST
 *
 * Usage: import { validate } from './validator.js';
 *        const { errors, warnings } = validate(ast);
 */

const VALID_PROTOCOLS = new Set(['grpc', 'socket', 'both']);
const VALID_TYPES     = new Set(['float', 'int', 'string', 'bool']);
const PORT_MIN = 1;
const PORT_MAX = 65535;

function err(message, line = null) {
  return line != null ? { message, line } : { message };
}

function warn(message, line = null) {
  return line != null ? { message, line } : { message };
}

export function validate(ast) {
  const errors   = [];
  const warnings = [];

  if (!ast || typeof ast !== 'object') {
    errors.push(err('AST is null or not an object'));
    return { errors, warnings };
  }

  // Service-level checks
  if (!ast.host) {
    errors.push(err('Missing required service field: host'));
  }

  if (ast.port == null) {
    errors.push(err('Missing required service field: port'));
  } else {
    const port = Number(ast.port);
    if (!Number.isInteger(port) || port < PORT_MIN || port > PORT_MAX) {
      warnings.push(warn(
        `Port ${ast.port} is outside the recommended range (${PORT_MIN}–${PORT_MAX})`
      ));
    }
  }

  if (!ast.protocol) {
    errors.push(err('Missing required service field: protocol'));
  } else if (!VALID_PROTOCOLS.has(ast.protocol)) {
    errors.push(err(
      `Invalid protocol "${ast.protocol}". Allowed values: grpc, socket, both`
    ));
  }

  if (ast.host && ast.host.toLowerCase() === 'localhost') {
    warnings.push(warn(
      'host is set to "localhost" — remember to update this for production deployments'
    ));
  }

  // Class / method checks
  const classes = Array.isArray(ast.classes) ? ast.classes : [];

  for (const cls of classes) {
    const methods = Array.isArray(cls.methods) ? cls.methods : [];

    for (const method of methods) {
      const loc = method.line ?? null;

      if (method.returnType == null) {
        errors.push(err(
          `Method "${cls.name}.${method.name}" is missing a return type`,
          loc
        ));
      } else if (!VALID_TYPES.has(method.returnType)) {
        errors.push(err(
          `Method "${cls.name}.${method.name}" has unknown return type "${method.returnType}". ` +
          `Supported types: float, int, string, bool`,
          loc
        ));
      }

      const params = Array.isArray(method.params) ? method.params : [];
      for (const param of params) {
        if (!VALID_TYPES.has(param.type)) {
          errors.push(err(
            `Parameter "${param.name}" of "${cls.name}.${method.name}" has unknown type ` +
            `"${param.type}". Supported types: float, int, string, bool`,
            loc
          ));
        }
      }

      if (params.length === 0) {
        warnings.push(warn(
          `Method "${cls.name}.${method.name}" has no parameters`,
          loc
        ));
      }
    }
  }

  return { errors, warnings };
}