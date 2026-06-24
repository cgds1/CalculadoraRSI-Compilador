import net from "net";

// ── Usa el Business Object generado por el compilador ─
import BO from "../output/Calculadora.js";

const obj = new BO();
const PORT = 50052;

// ── Servidor Socket JSON ──────────────────────────────
// Protocolo: el cliente envía { objeto, metodo, params } y recibe
// { resultado } o { error }. El método se despacha dinámicamente sobre el BO.
const socketServer = net.createServer((socket) => {
    const cliente = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`[+] Cliente conectado: ${cliente}`);

    socket.on("data", (data) => {
        const raw = data.toString();
        try {
            const { metodo, params } = JSON.parse(raw);
            const resultado = obj[metodo](...params);
            console.log(`[>] ${cliente} ${metodo}(${(params ?? []).join(", ")}) = ${resultado}`);
            socket.write(JSON.stringify({ resultado }));
        } catch (err) {
            console.log(`[!] ${cliente} mensaje inválido (${raw}): ${err.message}`);
            socket.write(JSON.stringify({ error: err.message }));
        }
    });

    socket.on("end", () => console.log(`[-] Cliente desconectado: ${cliente}`));
    // Evita que un cierre abrupto del cliente (ECONNRESET) tumbe el server.
    socket.on("error", (err) => console.log(`[!] ${cliente} socket error: ${err.code}`));
});

socketServer.listen(PORT, () => {
    console.log(`[OK] Servidor Socket JSON escuchando en 0.0.0.0:${PORT}`);
    console.log(`     Esperando conexiones de clientes...`);
});
