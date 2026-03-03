require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// Libera o acesso para o seu site no GitHub Pages não dar erro de conexão
app.use(cors({ origin: '*' }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.post('/novo-pedido', async (req, res) => {
  const { nome, mesa, total, itens, adicionais } = req.body;
  try {
    // Salva no Banco Neon
    await pool.query(
      'INSERT INTO pedidos (cliente_nome, mesa, total_valor, itens, adicionais) VALUES ($1, $2, $3, $4, $5)',
      [nome, mesa, total, JSON.stringify(itens), JSON.stringify(adicionais)]
    );

    // Envia para o Telegram
    const msg = encodeURIComponent(`🍔 *NOVO PEDIDO*\n👤 Cliente: ${nome}\n📍 Mesa: ${mesa}\n💰 Total: ${total}`);
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${process.env.CHAT_ID}&text=${msg}&parse_mode=Markdown`);

    res.status(201).json({ status: "OK" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// O Railway exige que a porta seja dinâmica via process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVIDOR RODANDO NA PORTA ${PORT}`);
});