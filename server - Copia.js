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
    
    await pool.query(
      'INSERT INTO pedidos (cliente_nome, mesa, total_valor, itens, adicionais) VALUES ($1, $2, $3, $4, $5)',
      [nome, mesa, total.toString(), JSON.stringify(itens), JSON.stringify(adicionais)]
    );

    let msg = `* NOVO PEDIDO: #${registro}*\n`;
    msg += `───────────────────\n`;
    msg += `*MESA:* ${mesa}  |  *CLIENTE:* ${nome}\n`;
    msg += `───────────────────\n\n`;

    const lanches = itens.filter(i => i.tipo !== 'industrial');
    const outros = itens.filter(i => i.tipo === 'industrial');

    if (lanches.length > 0) {
      msg += `* COZINHA:*\n`;
      lanches.forEach(i => msg += `• ${i.nome}\n`);
      if (adicionais && adicionais.length > 0) {
        msg += `  _Adic:_ ${adicionais.map(a => a.nome).join(', ')}\n`;
      }
      msg += `\n`;
    }

    if (outros.length > 0) {
      msg += `* BEBIDAS/OUTROS:*\n`;
      outros.forEach(i => msg += `• ${i.nome}\n`);
      msg += `\n`;
    }

    msg += `───────────────────\n`;
    
    msg += `*VALOR TOTAL: R$ ${Number(total).toFixed(2).replace('.', ',')}*`;

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.CHAT_ID,
        text: msg,
        parse_mode: 'Markdown'
      })
    });

    return res.status(201).json({ status: "OK" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});