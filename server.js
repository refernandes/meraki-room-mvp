const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

let roomState = { state: "Vago", peopleCount: 0 };

// Rota para receber webhooks da Meraki
app.post("/meraki/webhook", (req, res) => {
  const data = req.body;

  // Exemplo: supomos que o payload vem como { peopleCount: X }
  const peopleCount = data.peopleCount || 0;

  if (peopleCount === 0) {
    roomState.state = "Vago";
  } else if (peopleCount <= 8) {
    roomState.state = "Ocupado";
  } else {
    roomState.state = "Lotado";
  }
  roomState.peopleCount = peopleCount;

  console.log("Webhook recebido:", roomState);

  res.status(200).send("OK");
});

// Página de status
app.get("/status", (req, res) => {
  const color =
    roomState.state === "Vago"
      ? "green"
      : roomState.state === "Ocupado"
      ? "orange"
      : "red";

  res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="5">
        <style>
          body { font-family: Arial; text-align: center; margin-top: 100px; background:${color}; color:white; }
          h1 { font-size: 80px; margin-bottom: 20px; }
          p { font-size: 40px; }
        </style>
      </head>
      <body>
        <h1>${roomState.state}</h1>
        <p>Pessoas: ${roomState.peopleCount}</p>
      </body>
    </html>
  `);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
