require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.post('/novo-pedido', async (req, res) => {
  const { nome, mesa, total, itens, adicionais, registro } = req.body;
  
  try {
    pool.query(
      'INSERT INTO pedidos (cliente_nome, mesa, total_valor, itens, adicionais) VALUES ($1, $2, $3, $4, $5)',
      [nome, mesa, total, JSON.stringify(itens), JSON.stringify(adicionais)]
    ).catch(e => console.error(e.message));

    pool.query("DELETE FROM pedidos WHERE data_pedido < NOW() - INTERVAL '7 hours'").catch(() => {});

    const artesanais = itens.filter(i => i.tipo === 'artesanal');
    const industriais = itens.filter(i => i.tipo === 'industrial');

    let msg = `*PEDIDO: #${registro}*\n───────────────────\n`;
    msg += `*CLIENTE:* ${nome}\n*MESA:* ${mesa}\n───────────────────\n\n`;

    if (artesanais.length > 0) {
      msg += `*COZINHA:*\n${artesanais.map(i => `• ${i.nome}`).join('\n')}\n`;
      if (adicionais && adicionais.length > 0) {
        msg += `_Adicionais:_ ${adicionais.map(a => a.nome).join(', ')}\n`;
      }
      msg += `\n`;
    }

    if (industriais.length > 0) {
      msg += `*BEBIDAS:*\n${industriais.map(i => `• ${i.nome}`).join('\n')}\n\n`;
    }

    msg += `───────────────────\n*TOTAL:* ${total}`;

    const responseTelegram = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.CHAT_ID,
        text: msg,
        parse_mode: 'Markdown'
      })
    });

    if (!responseTelegram.ok) {
        throw new Error('Telegram Error');
    }

    return res.status(201).json({ status: "OK" });

  } catch (err) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {});
