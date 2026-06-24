# DCL Compiler — Calculadora distribuida sobre Socket JSON

> Compilador del lenguaje **DCL (Distributed Calculus Language)** que, a partir de un
> único archivo `.dcl`, genera automáticamente los artefactos de una calculadora
> distribuida que se comunica por **Socket JSON (TCP)**. · Node.js · ES Modules ·
> Sistemas Distribuidos · URU

---

## 1. Qué hace

A partir de un solo archivo `calculadora.dcl`, el compilador genera el código de la
calculadora distribuida: el Business Object, el proxy de cliente y un cliente
interactivo. La comunicación cliente ↔ servidor es por **socket TCP con mensajes JSON**.

```
   Cliente (proxy generado)            Servidor
 ───────────────────────────  TCP  ──────────────────────────
   { objeto, metodo, params }  ───►   net.createServer :50052
                                       obj[metodo](...params)
   { resultado }               ◄───   responde JSON
```

## 2. Arquitectura

| Pieza | Origen | Rol |
|-------|--------|-----|
| `calculadora.dcl` | fuente | Única definición del servicio (host, puerto, clase, métodos) |
| `compiler/` | código | El compilador DCL (lexer → parser → validator → generadores) |
| `output/` | **generado** | `Calculadora.js` (BO), `CalculadoraProxySocket.js`, `ClienteCalculadora.js` |
| `server/ServerRSI.js` | código | Servidor Socket JSON que carga el BO generado y despacha los métodos |
| `run-client.js` | código | Lanza el cliente generado de `output/` |

> El servidor escucha en `0.0.0.0:50052`, así que es accesible desde otras máquinas de
> la LAN. El proxy resuelve el host por `process.env.SERVER_HOST` (default `localhost`).

## 3. Stack

- **Runtime**: Node.js 18+ — **ES Modules** (`import/export`, sin `require`)
- **Transporte**: `node:net` (JSON sobre TCP) — sin gRPC ni frameworks
- **Cliente interactivo**: `node:readline`

## 4. El lenguaje DCL

```dcl
service CalculadoraService {
    host: "localhost"
    port: 50052
    protocol: socket

    class Calculadora {
        method add(a: float, b: float): float => a + b
        method sub(a: float, b: float): float => a - b
        method mul(a: float, b: float): float => a * b
        method div(a: float, b: float): float => a / b
    }
}
```

| keyword    | descripción                                            | valores        |
|------------|--------------------------------------------------------|----------------|
| `service`  | Define el servicio (host, port, protocol y clases)     | identificador  |
| `host`     | Dirección/hostname del servidor                        | `"string"`     |
| `port`     | Puerto de escucha del socket                           | int (1–65535)  |
| `protocol` | Transporte                                             | `socket`       |
| `class`    | Agrupa métodos del Business Object                     | identificador  |
| `method`   | Método con parámetros tipados, tipo de retorno y, opcionalmente, su cuerpo `=> expresión` | `nombre(params): tipo => expr` |

Tipos primitivos: `float`, `int`, `string`, `bool`.

**Cuerpo del método (`=> expresión`)**: si un método define su expresión, el compilador
genera el `return` correspondiente en el BO. Si se omite, genera un esqueleto con `throw`
para implementarlo a mano.

## 5. Pipeline

```
calculadora.dcl → lexer → parser (AST) → validator → generadores → output/
```

## 6. Cómo correr

```bash
npm install

# 1) Compilar: genera output/ desde el .dcl
npm run compile

# 2) Servidor (déjalo corriendo) — escucha :50052 y loguea cada conexión/operación
npm run server

# 3) Cliente (otra terminal o máquina): usa el cliente generado
npm run client
#   en otra máquina de la LAN:
#   Linux/Mac:  SERVER_HOST=<IP_DEL_SERVER> npm run client
#   Windows:    $env:SERVER_HOST="<IP_DEL_SERVER>"; npm run client
```

Artefactos generados en `output/`:

| Archivo | Descripción |
|---------|-------------|
| `Calculadora.js` | Business Object con los métodos (returns generados desde el `.dcl`) |
| `CalculadoraProxySocket.js` | Proxy de cliente: abre socket, envía el envelope JSON, resuelve el resultado |
| `ClienteCalculadora.js` | Menú interactivo por consola (`readline`) |

## 7. Manejo de errores del compilador

| Tipo | Caso | Resultado |
|------|------|-----------|
| **CRÍTICO** | Sintaxis inválida / token inesperado | Detiene, indica línea |
| **CRÍTICO** | Tipo desconocido (param o retorno) | Detiene, indica línea |
| **CRÍTICO** | Falta `host`, `port` o `protocol` | Detiene la compilación |
| **CRÍTICO** | `protocol` distinto de `socket` | Detiene la compilación |
| **CRÍTICO** | Método sin tipo de retorno | Detiene la compilación |
| **WARNING** | Método sin parámetros | Compila con aviso |
| **WARNING** | Puerto fuera de rango / `host: localhost` | Compila con aviso |

## 8. Estructura del repositorio

```
.
├── calculadora.dcl          ← entrada del compilador
├── compiler/
│   ├── compiler.js          ← CLI orquestador
│   ├── lexer.js
│   ├── parser.js
│   ├── validator.js
│   └── generator/
│       ├── bo.js
│       ├── proxySocket.js
│       └── client.js
├── server/ServerRSI.js      ← servidor Socket JSON (carga el BO generado)
├── run-client.js            ← lanza el cliente generado
├── output/                  ← artefactos generados (ignorado por git)
└── package.json
```

---

## Equipo

Carlos · Abraham · Rainny
