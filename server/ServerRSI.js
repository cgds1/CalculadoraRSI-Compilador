import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import net from "net";
import { fileURLToPath } from "url";
import Calculadora from "./Calculadora.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── gRPC ───────────────────────────────────────────
const packageDefinition = protoLoader.loadSync(path.join(__dirname, "../proto/calculadora.proto"));
const proto = grpc.loadPackageDefinition(packageDefinition).calculadora;

const obj = new Calculadora();

function handler(methodName) {
    return (call, callback) => {
        const { a, b } = call.request;
        const resultado = obj[methodName](a, b);
        callback(null, { valor: resultado });
    };
}

const grpcServer = new grpc.Server();

grpcServer.addService(proto.Calculadora.service, {
    add: handler("add"),
    sub: handler("sub"),
    mul: handler("mul"),
    div: handler("div"),
});

grpcServer.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) throw err;
        console.log(`gRPC escuchando en puerto ${port}`);
    }
);

// ─── Socket JSON ─────────────────────────────────────
const socketServer = net.createServer((socket) => {
    console.log("Cliente socket conectado");

    socket.on("data", (data) => {
        try {
            const { objeto, metodo, params } = JSON.parse(data.toString());
            const resultado = obj[metodo](...params);
            socket.write(JSON.stringify({ resultado }));
        } catch (err) {
            socket.write(JSON.stringify({ error: err.message }));
        }
    });

    socket.on("end", () => {
        console.log("Cliente socket desconectado");
    });
});

socketServer.listen(50052, () => {
    console.log("Socket JSON escuchando en puerto 50052");
});
