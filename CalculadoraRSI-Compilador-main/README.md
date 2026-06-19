# DCL Compiler — Calculadora distribuida gRPC + Socket JSON

> Compilador del lenguaje **DCL (Distributed Calculus Language)** que, a partir de un
> único archivo `.dcl`, genera automáticamente los artefactos de una calculadora
> distribuida con **gRPC** y **Socket JSON**. · Node.js · ES Modules · Sistemas
> Distribuidos · URU

---

## 1. El proyecto base

Una calculadora distribuida con **doble transporte** sobre el mismo Business Object:

- **gRPC** en `:50051` — contrato `proto/calculadora.proto`.
- **Socket JSON** en `:50052` — envelope `{ objeto, metodo, params }` → `{ resultado }`.

### Arquitectura

```
            ┌─────────────────────────────┐
  cliente   │        ServerRSI.js          │
 ────────►  │  gRPC  :50051  ──┐            │
  (proxy)   │                 ├─► Calculadora (BO)
 ────────►  │  socket:50052  ──┘   add/sub/mul/div
  (socket)  └─────────────────────────────┘
```

| Componente                 | Puerto | Protocolo | Rol                                   |
|----------------------------|--------|-----------|---------------------------------------|
| `server/ServerRSI.js`      | 50051 / 50052 | gRPC + Socket | Servidor dual; expone el BO    |
| `server/Calculadora.js`    | —      | —         | Business Object (`add/sub/mul/div`)   |
| `client/CalculadoraProxy.js` | —    | gRPC      | Proxy gRPC (`response.valor`)         |
| `client/ClienteRSI.js`     | —      | Socket    | Cliente socket genérico `send(...)`   |
| `proto/calculadora.proto`  | —      | —         | Contrato `Operacion{a,b}→Resultado{valor}` |

### Stack

- **Runtime**: Node.js 18+ — **ES Modules** (`import/export`, sin `require`)
- **gRPC**: `@grpc/grpc-js` + `@grpc/proto-loader`
- **Socket**: `node:net` (JSON sobre TCP)
- **CLI generado**: `node:readline` — sin frameworks

### Requisitos e instalación

```bash
node -v        # 18 o superior
npm install
```

### Cómo levantar el servidor y el cliente

```bash
# Terminal 1 — servidor dual (gRPC :50051 + socket :50052)
npm run server          # node server/ServerRSI.js

# Terminal 2 — cliente demo gRPC
npm run client          # node client/cliente.js
# salida esperada: 8, 6, 12, 5
```

El host del servidor se configura con la variable `SERVER_HOST` (por defecto `localhost`).

---

## 2. DCL Compiler

### ¿Qué es DCL?

DCL (Distributed Calculus Language) es un lenguaje de definición de interfaces. A partir
de un único archivo `.dcl` el compilador genera todos los artefactos de la calculadora.

```dcl
service CalculadoraService {
    host: "localhost"
    port: 50051
    protocol: both        // grpc | socket | both

    class Calculadora {
        method add(a: float, b: float): float
        method sub(a: float, b: float): float
        method mul(a: float, b: float): float
        method div(a: float, b: float): float
    }
}
```

### Sintaxis

| keyword    | descripción                                            | valores            |
|------------|--------------------------------------------------------|--------------------|
| `service`  | Define el servicio (host, port, protocol y clases)     | identificador      |
| `host`     | Dirección/hostname del servidor                        | `"string"`         |
| `port`     | Puerto de escucha                                      | int (1–65535)      |
| `protocol` | Transporte a generar                                   | `grpc`·`socket`·`both` |
| `class`    | Agrupa métodos del Business Object                     | identificador      |
| `method`   | Método con parámetros tipados y tipo de retorno        | `nombre(params): tipo` |

Tipos primitivos y su equivalente proto3:

| DCL      | proto3   |
|----------|----------|
| `float`  | `float`  |
| `int`    | `int32`  |
| `string` | `string` |
| `bool`   | `bool`   |

### Pipeline

```
archivo.dcl → lexer → parser (AST) → validator → generadores → output/
```

### Cómo compilar

```bash
npm run compile          # node compiler/compiler.js calculadora.dcl
```

Genera 5 artefactos en `output/`:

| Archivo                       | Descripción                                              |
|-------------------------------|----------------------------------------------------------|
| `CalculadoraProxyGRPC.js`     | Proxy gRPC equivalente a `client/CalculadoraProxy.js`    |
| `CalculadoraProxySocket.js`   | Proxy Socket con métodos tipados sobre el envelope JSON  |
| `ClienteCalculadora.js`       | Menú interactivo por consola (`readline`)                |
| `Calculadora.js`              | Business Object con esqueleto de métodos vacíos          |
| `calculadora.proto`           | Contrato protobuf generado desde el `.dcl`               |

### Tabla de errores

| Tipo        | Caso                                          | Resultado                  |
|-------------|-----------------------------------------------|----------------------------|
| **CRÍTICO** | Sintaxis inválida / token inesperado          | Detiene, indica línea      |
| **CRÍTICO** | Tipo de dato desconocido                       | Detiene, indica línea      |
| **CRÍTICO** | Falta `host`, `port` o `protocol`              | Detiene la compilación     |
| **CRÍTICO** | Método sin tipo de retorno                     | Detiene la compilación     |
| **WARNING** | Método declarado sin parámetros                | Compila con aviso          |
| **WARNING** | Puerto fuera del rango recomendado             | Compila con aviso          |
| **WARNING** | `host` apunta a `localhost`                    | Compila con aviso          |
| **WARNING** | Archivo de salida ya existente                 | Sobreescribe con aviso     |

---

## 3. Estructura del repositorio

```
.
├── calculadora.dcl          ← entrada del compilador
├── compiler/                ← el compilador DCL (ver docs/fases)
│   ├── compiler.js          ← CLI entry point
│   ├── lexer.js
│   ├── parser.js
│   ├── validator.js
│   └── generator/
│       ├── proto.js
│       ├── proxyGRPC.js
│       ├── proxySocket.js
│       ├── client.js
│       └── bo.js
├── output/                  ← artefactos generados (ignorado por git)
├── client/                  ← base: proxies gRPC y socket
├── server/                  ← base: servidor dual + BO
├── proto/                   ← base: contrato gRPC
└── docs/fases/              ← metodología por fases
```

> El compilador (`compiler/`) se desarrolla por fases documentadas en `docs/fases/`.
> La base (`client/`, `server/`, `proto/`) es la referencia contra la que se valida el
> output generado.

---

## Equipo

Carlos · Abraham · Rainny
