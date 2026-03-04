require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.post('/novo-pedido', async (req, res) => {
  const { nome, mesa, total, itens, adicionais, registro } = req.body;
  
  try {
    await pool.query(
      "DELETE FROM pedidos WHERE data_pedido < NOW() - INTERVAL '12 hours'"
    );

    await pool.query(
      'INSERT INTO pedidos (cliente_nome, mesa, total_valor, itens, adicionais) VALUES ($1, $2, $3, $4, $5)',
      [nome, mesa, total, JSON.stringify(itens), JSON.stringify(adicionais)]
    );

    const artesanais = itens.filter(i => i.tipo === 'artesanal');
    const industriais = itens.filter(i => i.tipo === 'industrial');

    let corpoMensagem = `* NOVO PEDIDO: #${registro}*\n`;
    corpoMensagem += `───────────────────\n`;
    corpoMensagem += `* CLIENTE:* ${nome}\n`;
    corpoMensagem += `* MESA:* ${mesa}\n`;
    corpoMensagem += `───────────────────\n\n`;

    if (artesanais.length > 0) {
      corpoMensagem += `* COZINHA (preparado):*\n`;
      artesanais.forEach(item => {
        corpoMensagem += `• ${item.nome}\n`;
      });
      if (adicionais && adicionais.length > 0) {
        corpoMensagem += `  _Adicionais:_ ${adicionais.map(a => a.nome).join(', ')}\n`;
      }
      corpoMensagem += `\n`;
    }

    if (industriais.length > 0) {
      corpoMensagem += `* BEBIDAS / OUTROS:*\n`;
      industriais.forEach(item => {
        corpoMensagem += `• ${item.nome}\n`;
      });
      corpoMensagem += `\n`;
    }

    corpoMensagem += `───────────────────\n`;
    corpoMensagem += `* TOTAL:* ${total}`;

    const msg = encodeURIComponent(corpoMensagem);

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${process.env.CHAT_ID}&text=${msg}&parse_mode=Markdown`);

    res.status(201).json({ status: "OK", registro: registro });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVIDOR RODANDO E LIMPANDO A CADA 12H`);
});
