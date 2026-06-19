// Lexer del lenguaje DCL.
// Convierte el texto crudo de un archivo .dcl en una lista plana de tokens.
// No entiende la estructura del lenguaje (eso es del parser); solo reconoce
// piezas léxicas y les asigna su número de línea para reportar errores.

const KEYWORDS = new Set(["service", "host", "port", "protocol", "class", "method"]);
const TYPES = new Set(["float", "int", "string", "bool"]);
const SYMBOLS = new Set(["{", "}", "(", ")", ":", ","]);

// Los valores de protocol (grpc | socket | both) se emiten como identifier;
// es el parser/validator quien los interpreta en su contexto.

function isIdentifierStart(ch) {
    return /[A-Za-z_]/.test(ch);
}

function isIdentifierPart(ch) {
    return /[A-Za-z0-9_]/.test(ch);
}

function isDigit(ch) {
    return ch >= "0" && ch <= "9";
}

export function tokenize(source) {
    const tokens = [];
    let i = 0;
    let line = 1;
    const len = source.length;

    while (i < len) {
        const ch = source[i];

        // Saltos de línea: contar y avanzar.
        if (ch === "\n") {
            line++;
            i++;
            continue;
        }

        // Resto de espacios en blanco (espacio, tab, retorno de carro).
        if (ch === " " || ch === "\t" || ch === "\r") {
            i++;
            continue;
        }

        // Comentarios de línea: // ... hasta el fin de línea.
        if (ch === "/" && source[i + 1] === "/") {
            while (i < len && source[i] !== "\n") i++;
            continue;
        }

        // Símbolos de un carácter.
        if (SYMBOLS.has(ch)) {
            tokens.push({ type: "symbol", value: ch, line });
            i++;
            continue;
        }

        // Literales de cadena entre comillas dobles.
        if (ch === '"') {
            const startLine = line;
            i++; // consumir comilla de apertura
            let value = "";
            while (i < len && source[i] !== '"') {
                if (source[i] === "\n") line++;
                value += source[i];
                i++;
            }
            if (i >= len) {
                throw new Error(`[Lexer] Cadena sin cerrar iniciada en línea ${startLine}`);
            }
            i++; // consumir comilla de cierre
            tokens.push({ type: "string", value, line: startLine });
            continue;
        }

        // Literales numéricos (enteros o decimales).
        if (isDigit(ch)) {
            const startLine = line;
            let raw = "";
            while (i < len && (isDigit(source[i]) || source[i] === ".")) {
                raw += source[i];
                i++;
            }
            tokens.push({ type: "number", value: Number(raw), line: startLine });
            continue;
        }

        // Identificadores, keywords y tipos.
        if (isIdentifierStart(ch)) {
            const startLine = line;
            let word = "";
            while (i < len && isIdentifierPart(source[i])) {
                word += source[i];
                i++;
            }
            let type = "identifier";
            if (KEYWORDS.has(word)) type = "keyword";
            else if (TYPES.has(word)) type = "type";
            tokens.push({ type, value: word, line: startLine });
            continue;
        }

        // Cualquier otro carácter es un error léxico.
        throw new Error(`[Lexer] Carácter inesperado '${ch}' en línea ${line}`);
    }

    tokens.push({ type: "eof", value: null, line });
    return tokens;
}

export default tokenize;
