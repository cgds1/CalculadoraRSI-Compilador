// Parser del lenguaje DCL.
// Consume la lista de tokens del lexer y construye el AST (árbol sintáctico)
// que representará la estructura del .dcl. Solo valida estructura, no semántica:
// los tipos desconocidos o un método sin tipo de retorno los detecta el validator.
//
// Gramática:
//   service <id> { host: <string> port: <number> protocol: <id> <class>* }
//   class   <id> { <method>* }
//   method  <id> ( <param> (, <param>)* ) [ : <type> ]
//   param = <id> : <type>

export function parse(tokens) {
    let pos = 0;

    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function expect(type, value) {
        const t = tokens[pos];
        if (t.type !== type || (value !== undefined && t.value !== value)) {
            const esperado = value !== undefined ? `${type} '${value}'` : type;
            throw new Error(
                `[Parser] Se esperaba ${esperado} pero se encontró ${t.type} '${t.value}' en línea ${t.line}`
            );
        }
        return tokens[pos++];
    }

    const isSymbol = (value) => peek().type === "symbol" && peek().value === value;
    const isKeyword = (value) => peek().type === "keyword" && peek().value === value;

    // Acepta un nombre de tipo: token 'type' (float/int/string/bool) o un
    // 'identifier' (p.ej. un tipo desconocido que el validator rechazará).
    function parseTypeName() {
        const t = peek();
        if (t.type === "type" || t.type === "identifier") {
            next();
            return t.value;
        }
        throw new Error(
            `[Parser] Se esperaba un tipo pero se encontró ${t.type} '${t.value}' en línea ${t.line}`
        );
    }

    function parseParam() {
        const name = expect("identifier").value;
        expect("symbol", ":");
        const type = parseTypeName();
        return { name, type };
    }

    function parseMethod() {
        const lineToken = peek();
        expect("keyword", "method");
        const name = expect("identifier").value;
        expect("symbol", "(");

        const params = [];
        if (!isSymbol(")")) {
            params.push(parseParam());
            while (isSymbol(",")) {
                next();
                params.push(parseParam());
            }
        }
        expect("symbol", ")");

        // El tipo de retorno es opcional a nivel sintáctico; el validator marca
        // como error crítico el método que lo omita.
        let returnType = null;
        if (isSymbol(":")) {
            next();
            returnType = parseTypeName();
        }

        return { type: "Method", name, params, returnType, line: lineToken.line };
    }

    function parseClass() {
        expect("keyword", "class");
        const name = expect("identifier").value;
        expect("symbol", "{");

        const methods = [];
        while (!isSymbol("}")) {
            if (peek().type === "eof") {
                throw new Error(`[Parser] Se esperaba '}' pero se llegó al final del archivo`);
            }
            methods.push(parseMethod());
        }
        expect("symbol", "}");

        return { type: "Class", name, methods };
    }

    function parseService() {
        const lineToken = peek();
        expect("keyword", "service");
        const name = expect("identifier").value;
        expect("symbol", "{");

        let host = null;
        let port = null;
        let protocol = null;
        const classes = [];

        while (!isSymbol("}")) {
            if (peek().type === "eof") {
                throw new Error(`[Parser] Se esperaba '}' pero se llegó al final del archivo`);
            }

            if (isKeyword("host")) {
                next();
                expect("symbol", ":");
                host = expect("string").value;
            } else if (isKeyword("port")) {
                next();
                expect("symbol", ":");
                port = expect("number").value;
            } else if (isKeyword("protocol")) {
                next();
                expect("symbol", ":");
                // El valor del protocolo llega como identifier (grpc/socket/both).
                protocol = parseTypeName();
            } else if (isKeyword("class")) {
                classes.push(parseClass());
            } else {
                const t = peek();
                throw new Error(
                    `[Parser] Token inesperado ${t.type} '${t.value}' en línea ${t.line}`
                );
            }
        }
        expect("symbol", "}");

        return { type: "Service", name, host, port, protocol, classes, line: lineToken.line };
    }

    const ast = parseService();

    if (peek().type !== "eof") {
        const t = peek();
        throw new Error(
            `[Parser] Tokens sobrantes tras el service: ${t.type} '${t.value}' en línea ${t.line}`
        );
    }

    return ast;
}

export default parse;
