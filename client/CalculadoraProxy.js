const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const packageDefinition = protoLoader.loadSync("../proto/calculadora.proto");
const proto = grpc.loadPackageDefinition(packageDefinition).calculadora;

class CalculadoraProxy {
    constructor() {
        this.client = new proto.Calculadora(
            "IP_SERVIDOR:50051",
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

module.exports = CalculadoraProxy;