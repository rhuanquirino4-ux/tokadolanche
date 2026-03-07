require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const printerConfig = {
  enabled: (process.env.PRINTER_ENABLED || process.env.THERMAL_PRINTER_ENABLED || 'false').toLowerCase() === 'true',
  name: process.env.PRINTER_NAME || process.env.THERMAL_PRINTER_NAME || '',
  mode: (process.env.PRINTER_MODE || 'windows').toLowerCase(),
  charsPerLine: Number(process.env.PRINTER_CHARS_PER_LINE || process.env.THERMAL_CHARS_PER_LINE || 42)
};

let filaCozinha = [];

const repeat = (char, size) => Array(size).fill(char).join('');
const line = (size) => repeat('-', size);
const money = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;

function padRight(text, size) {
  const safe = (text || '').toString();
  if (safe.length >= size) return safe.slice(0, size);
  return safe + repeat(' ', size - safe.length);
}

function splitLongLine(text, maxLen) {
  const words = (text || '').split(' ');
  const out = [];
  let current = '';

  for (const word of words) {
    const tryLine = current ? `${current} ${word}` : word;

    if (tryLine.length <= maxLen) {
      current = tryLine;
    } else {
      if (current) out.push(current);

      if (word.length <= maxLen) {
        current = word;
      } else {
        let remaining = word;
        while (remaining.length > maxLen) {
          out.push(remaining.slice(0, maxLen));
          remaining = remaining.slice(maxLen);
        }
        current = remaining;
      }
    }
  }

  if (current) out.push(current);
  return out.length ? out : [''];
}

function buildTicket(pedido) {
  const max = printerConfig.charsPerLine;
  const lines = [];

  lines.push('TOKA DO LANCHE');
  lines.push(line(max));
  lines.push(`Pedido: ${pedido.id}`);
  lines.push(`Mesa: ${pedido.mesa}`);
  lines.push(`Cliente: ${pedido.nome}`);
  lines.push(`Data: ${new Date().toLocaleString('pt-BR')}`);
  lines.push(line(max));
  lines.push('ITENS ARTESANAIS');

  if (!pedido.itens || pedido.itens.length === 0) {
    lines.push('(sem itens)');
  } else {
    pedido.itens.forEach((item) => {
      const label = `${item.nome} (${money(item.preco)})`;
      splitLongLine(label, max - 2).forEach((chunk, index) => {
        lines.push(index === 0 ? `- ${chunk}` : `  ${chunk}`);
      });
    });
  }

  if (pedido.adicionais && pedido.adicionais.length > 0) {
    lines.push(line(max));
    lines.push('ADICIONAIS');

    pedido.adicionais.forEach((item) => {
      const label = `${item.nome} (${money(item.preco)})`;
      splitLongLine(label, max - 2).forEach((chunk, index) => {
        lines.push(index === 0 ? `+ ${chunk}` : `  ${chunk}`);
      });
    });
  }

  lines.push(line(max));
  lines.push(padRight('TOTAL', max - money(pedido.total).length) + money(pedido.total));
  lines.push(line(max));
  lines.push('');
  lines.push('');

  return lines;
}

async function printTicketWindows(pedido) {
  const tmpFile = path.join(os.tmpdir(), `pedido-${pedido.id}-${Date.now()}.txt`);
  const ticketText = buildTicket(pedido).join('\r\n');

  await fs.writeFile(tmpFile, ticketText, 'utf8');

  const escapedPath = tmpFile.replace(/'/g, "''");
  const escapedPrinter = printerConfig.name.replace(/'/g, "''");

  try {
    await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-Command', `Get-Content -LiteralPath '${escapedPath}' | Out-Printer -Name '${escapedPrinter}'`],
      { windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024 }
    );
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }

  return { printed: true };
}

async function printTicket(pedido) {
  if (!printerConfig.enabled) {
    return { printed: false, reason: 'desativado no .env' };
  }

  if (!printerConfig.name) {
    return { printed: false, reason: 'PRINTER_NAME vazio' };
  }

  if (printerConfig.mode !== 'windows') {
    return { printed: false, reason: `modo ${printerConfig.mode} nao suportado nesta configuracao` };
  }

  try {
    return await printTicketWindows(pedido);
  } catch (error) {
    return { printed: false, reason: error.message };
  }
}

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      cliente_nome TEXT,
      mesa INTEGER,
      total_valor TEXT,
      itens JSONB,
      adicionais JSONB,
      status TEXT DEFAULT 'pendente',
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

initDB().catch((error) => {
  console.error('[db] erro ao inicializar tabela pedidos:', error.message);
});

app.post('/novo-pedido', async (req, res) => {
  const { nome, mesa, total, itens, adicionais } = req.body;

  if (!nome || !mesa || !Array.isArray(itens)) {
    return res.status(400).json({ error: 'Dados incompletos do pedido.' });
  }

  const registroID = Date.now();
  const pedido = {
    id: registroID,
    nome,
    mesa: Number(mesa),
    total: Number(total || 0),
    itens,
    adicionais: Array.isArray(adicionais) ? adicionais : []
  };

  try {
    await pool.query(
      'INSERT INTO pedidos (cliente_nome, mesa, total_valor, itens, adicionais) VALUES ($1, $2, $3, $4, $5)',
      [pedido.nome, pedido.mesa, pedido.total.toString(), JSON.stringify(pedido.itens), JSON.stringify(pedido.adicionais)]
    );

    const itensCozinha = pedido.itens.filter((item) => item.tipo === 'artesanal' || !item.tipo);

    filaCozinha.push({
      id: pedido.id,
      mesa: pedido.mesa,
      cliente: pedido.nome,
      itens: itensCozinha,
      adicionais: pedido.adicionais
    });

    let impressao;
    if (itensCozinha.length > 0) {
      impressao = await printTicket({ ...pedido, itens: itensCozinha });
    } else {
      impressao = { printed: false, reason: 'sem itens artesanais para impressao' };
    }

    return res.status(200).json({ success: true, id: pedido.id, impressao });
  } catch (error) {
    console.error('[pedido] erro ao registrar pedido:', error.message);
    return res.status(500).json({ error: 'Erro ao registrar pedido.' });
  }
});

app.get('/pedidos-cozinha', (req, res) => res.json(filaCozinha));

app.post('/finalizar-preparo', (req, res) => {
  filaCozinha = filaCozinha.filter((p) => p.id !== req.body.id);
  res.json({ success: true });
});

app.get('/status-impressora', async (req, res) => {
  const status = await printTicket({
    id: 'TESTE',
    mesa: '-',
    nome: 'Teste de conexao',
    total: 0,
    itens: [{ nome: 'Teste artesanal', preco: 0 }],
    adicionais: []
  });

  if (status.printed) {
    return res.json({ ok: true, message: 'Impressora conectada e teste impresso.' });
  }

  return res.status(400).json({ ok: false, message: `Nao imprimiu: ${status.reason}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Site: http://localhost:${PORT}`);
  console.log(`[impressao] ativada=${printerConfig.enabled} modo=${printerConfig.mode} nome="${printerConfig.name || 'N/A'}"`);
});
