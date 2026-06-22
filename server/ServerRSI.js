import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import net from "net";
import { fileURLToPath } from "url";

// ── Point to compiler output ─────────────────────────
import BO from "../output/Calculadora.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.join(__dirname, "../output/calculadora.proto");

// ── Load proto & resolve service dynamically ─────────
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const pkg  = grpc.loadPackageDefinition(packageDefinition);

// Find the first package that has a service (no hardcoded package name)
const pkgName = Object.keys(pkg).find(k =>
  Object.values(pkg[k]).some(v => v?.service)
);
const proto = pkg[pkgName];

// Find the service class inside that package
const serviceName = Object.keys(proto).find(k => proto[k]?.service);

// ── Instantiate BO & build handler map dynamically ───
const obj = new BO();

function handler(methodName) {
  return (call, callback) => {
    const params = Object.values(call.request);
    const resultado = obj[methodName](...params);
    callback(null, { valor: resultado });
  };
}

// Reflect on BO methods — no hardcoded method names
const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(obj))
  .filter(m => m !== "constructor");

const serviceImpl = Object.fromEntries(
  methodNames.map(m => [m, handler(m)])
);

// ── gRPC server ───────────────────────────────────────
const grpcServer = new grpc.Server();
grpcServer.addService(proto[serviceName].service, serviceImpl);

grpcServer.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) throw err;
    console.log(`gRPC escuchando en puerto ${port}`);
  }
);

// ── Socket JSON server ────────────────────────────────
const socketServer = net.createServer((socket) => {
  console.log("Cliente socket conectado");

  socket.on("data", (data) => {
    try {
      const { metodo, params } = JSON.parse(data.toString());
      const resultado = obj[metodo](...params);
      socket.write(JSON.stringify({ resultado }));
    } catch (err) {
      socket.write(JSON.stringify({ error: err.message }));
    }
  });

  socket.on("end", () => console.log("Cliente socket desconectado"));
});

socketServer.listen(50052, () => {
  console.log("Socket JSON escuchando en puerto 50052");
});