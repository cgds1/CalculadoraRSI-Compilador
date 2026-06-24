// Definición del servicio distribuido de la calculadora.
// A partir de este único archivo el compilador DCL genera todos los
// artefactos de la calculadora distribuida sobre Socket JSON.

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
