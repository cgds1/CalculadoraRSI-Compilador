import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageDefinition = protoLoader.loadSync(path.join(__dirname, "../proto/calculadora.proto"));
const proto = grpc.loadPackageDefinition(packageDefinition).calculadora;

export default class CalculadoraProxy {
    constructor() {
        const host = process.env.SERVER_HOST || "localhost";
        this.client = new proto.Calculadora(
            `${host}:50051`,
            grpc.credentials.createInsecure()
        );
    }

    add(...args) {
        return new Promise((resolve, reject) => {
            this.client.add({ a: args[0], b: args[1] }, (err, response) => {
                if (err) reject(err);
                else resolve(response.valor);
            });
        });
    }

    sub(...args) {
        return new Promise((resolve, reject) => {
            this.client.sub({ a: args[0], b: args[1] }, (err, response) => {
                if (err) reject(err);
                else resolve(response.valor);
            });
        });
    }

    mul(...args) {
        return new Promise((resolve, reject) => {
            this.client.mul({ a: args[0], b: args[1] }, (err, response) => {
                if (err) reject(err);
                else resolve(response.valor);
            });
        });
    }

    div(...args) {
        return new Promise((resolve, reject) => {
            this.client.div({ a: args[0], b: args[1] }, (err, response) => {
                if (err) reject(err);
                else resolve(response.valor);
            });
        });
    }
}
