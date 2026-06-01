
const RSI = require('../rsi/rsi'); 

const comunicador = new RSI('127.0.0.1', 8080);

const jsonSuma = `{"operacion": "suma", "datos": [${process.argv[2]}, ${process.argv[3]}]}`;

const jsonResta = `{"operacion": "resta", "datos": [${process.argv[2]}, ${process.argv[3]}]}`;

const jsonMultiplicacion = `{"operacion": "multiplicacion", "datos": [${process.argv[2]}, ${process.argv[3]}]}`;

const jsonDivision = `{"operacion": "division", "datos": [${process.argv[2]}, ${process.argv[3]}]}`;