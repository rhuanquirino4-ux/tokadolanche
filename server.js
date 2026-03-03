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
    // 1. Limpeza Automática: Apaga pedidos com mais de 12 horas
    await pool.query(
      "DELETE FROM pedidos WHERE data_pedido < NOW() - INTERVAL '12 hours'"
    );

    // 2. Salva o novo pedido no Banco Neon
    // Certifique-se de que sua coluna de data se chama 'data_pedido' ou ajuste abaixo
    await pool.query(
      'INSERT INTO pedidos (cliente_nome, mesa, total_valor, itens, adicionais) VALUES ($1, $2, $3, $4, $5)',
      [nome, mesa, total, JSON.stringify(itens), JSON.stringify(adicionais)]
    );

    // 3. Envia para o Telegram
    const msg = encodeURIComponent(
      ` *REGISTRO DE PEDIDO #${registro}*\n\n` +
      ` *Cliente:* ${nome}\n` +
      ` *Mesa:* ${mesa}\n` +
      ` *Total:* ${total}\n\n` +
    
    );

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
