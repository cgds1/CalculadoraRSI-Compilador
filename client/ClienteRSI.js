const net = require("net");

class ClienteRSI {
    send(objeto, metodo, params) {
        return new Promise((resolve, reject) => {
            const socket = net.createConnection({ host: "IP_SERVIDOR", port: 50052 }, () => {
                const mensaje = JSON.stringify({ objeto, metodo, params });
                socket.write(mensaje);
            });

            socket.on("data", (data) => {
                const { resultado, error } = JSON.parse(data.toString());
                if (error) reject(error);
                else resolve(resultado);
                socket.end();
            });

            socket.on("error", (err) => {
                reject(err);
            });
        });
    }
}

module.exports = ClienteRSI;