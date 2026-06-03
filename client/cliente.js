const CalculadoraProxy = require("./CalculadoraProxy");

async function main() {
    let cli = new CalculadoraProxy();

    let r = await cli.add(3, 5);
    console.log(r);

    let r2 = await cli.sub(10, 4);
    console.log(r2);

    let r3 = await cli.mul(3, 4);
    console.log(r3);

    let r4 = await cli.div(10, 2);
    console.log(r4);
}

main();