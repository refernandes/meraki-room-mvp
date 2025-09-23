const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

let roomState = { state: "Vago", peopleCount: 0 };

// CONFIGURAÇÕES - substitua depois com variáveis de ambiente
const MERAKI_API_KEY = process.env.MERAKI_API_KEY || e9a3c0102a42e7a52bc915d9c43b3092d0d8a344;
const NETWORK_ID = process.env.NETWORK_ID || "635570497412690470";
const CAMERA_SERIAL = process.env.CAMERA_SERIAL || Q2FV-6J8Q-DN75;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 10; // segundos
const LIMITE_OCUPADO = parseInt(process.env.LIMITE_OCUPADO) || 8;

// Função para consultar API Meraki MV Sense
const getPeopleCount = async () => {
  try {
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - POLL_INTERVAL; // intervalo curto para live

    const response = await axios.get(
      `https://api.meraki.com/api/v1/networks/${NETWORK_ID}/cameras/${CAMERA_SERIAL}/analytics/detections/interval`,
      {
        headers: {
          "X-Cisco-Meraki-API-Key": MERAKI_API_KEY,
        },
        params: {
          startTime,
          endTime,
          interval: POLL_INTERVAL,
          boundaries: "0", // zona padrão
        },
      }
    );

    const intervals = response.data.intervals;
    let totalPeople = 0;
    intervals.forEach((i) => {
      totalPeople += i.counts["0"] || 0;
    });

    // Atualiza estado
    roomState.peopleCount = totalPeople;
    if (totalPeople === 0) roomState.state = "Vago";
    else if (totalPeople <= LIMITE_OCUPADO) roomState.state = "Ocupado";
    else roomState.state = "Lotado";

    console.log(`[Meraki Poll] PeopleCount: ${totalPeople}, State: ${roomState.state}`);
  } catch (error) {
    console.error("Erro ao consultar Meraki API:", error.message);
  }
};

// Polling automático
setInterval(getPeopleCount, POLL_INTERVAL * 1000);

// Rota de status
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

// Porta
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
