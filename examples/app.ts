import { createConsoleLog, createSoaRecord, Server } from "../src";

const server = new Server({
  port: 9999,
  log: createConsoleLog(),
});

server.on("query", (query) => {
  const domain = query.name;
  const record = createSoaRecord({ host: domain, serial: 12345, ttl: 300 });
  query.addAnswer(domain, record, 300);
  server.send(query);
});

server
  .start()
  .then((server) =>
    console.log(`Server listening on ${server.address}:${server.port}...`)
  )
  .catch(console.error);
