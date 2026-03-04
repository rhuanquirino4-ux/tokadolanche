let passoAtual = 1;
let pedidoAtual = { mesa: "", nome: "", itens: [], adicionais: [] };

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("grid-mesas");
  if (grid) {
    grid.innerHTML = "";
    for (let i = 1; i <= 20; i++) {
      const divMesa = document.createElement("div");
      divMesa.className = "mesa";
      divMesa.innerHTML = `<h3>${i < 10 ? "0" + i : i}</h3><p>DISPONÍVEL</p>`;
      divMesa.onclick = () => selecionarMesa(i, divMesa);
      grid.appendChild(divMesa);
    }
  }
  limparPedidosAntigos();
});

function limparPedidosAntigos() {
  let lista = JSON.parse(localStorage.getItem('historicoPedidos') || "[]");
  const agora = new Date().getTime();
  const seteHorasEmMs = 7 * 60 * 60 * 1000;

  const listaFiltrada = lista.filter(p => {
    try {
      const partes = p.data.split(', ');
      const dataPartes = partes[0].split('/');
      const horaPartes = partes[1].split(':');
      const dataPedido = new Date(dataPartes[2], dataPartes[1] - 1, dataPartes[0], horaPartes[0], horaPartes[1], horaPartes[2]).getTime();
      return (agora - dataPedido) < seteHorasEmMs;
    } catch (e) { return true; }
  });

  localStorage.setItem('historicoPedidos', JSON.stringify(listaFiltrada));
}

function selecionarMesa(numero, elemento) {
  pedidoAtual.mesa = numero;
  document.querySelectorAll(".mesa").forEach((m) => m.classList.remove("selecionada"));
  elemento.classList.add("selecionada");
}

function selecionarProd(elemento, nome, preco, tipo = 'artesanal') {
  pedidoAtual.itens.push({ nome, preco, tipo });
  elemento.classList.toggle("ativo");
}

function selecionarAdic(elemento, nome, preco) {
  pedidoAtual.adicionais.push({ nome, preco });
  elemento.classList.toggle("ativo");
}

function proximo() {
  if (passoAtual === 1 && !pedidoAtual.mesa) return;
  if (passoAtual === 2 && !document.getElementById("input-nome").value) return;
  document.getElementById(`step-${passoAtual}`).classList.remove("active");
  passoAtual++;
  if (passoAtual <= 5) document.getElementById(`step-${passoAtual}`).classList.add("active");
  if (passoAtual === 5) {
    document.getElementById("btn-proximo").style.display = "none";
    document.getElementById("btn-enviar").style.display = "block";
  }
}

function voltar() {
  if (passoAtual > 1) {
    document.getElementById(`step-${passoAtual}`).classList.remove("active");
    passoAtual--;
    document.getElementById(`step-${passoAtual}`).classList.add("active");
    document.getElementById("btn-proximo").style.display = "block";
    document.getElementById("btn-enviar").style.display = "none";
  }
}

async function finalizar() {
  const btn = document.getElementById("btn-enviar");
  const nomeInput = document.getElementById("input-nome").value;
  btn.disabled = true;
  btn.innerText = "ENVIANDO...";

  const totalSoma = [...pedidoAtual.itens, ...pedidoAtual.adicionais].reduce((acc, i) => acc + i.preco, 0);
  const numeroRegistro = Math.floor(1000 + Math.random() * 9999);
  const dados = {
    nome: nomeInput,
    mesa: pedidoAtual.mesa,
    total: `R$ ${totalSoma.toFixed(2).replace(".", ",")}`,
    itens: pedidoAtual.itens,
    adicionais: pedidoAtual.adicionais,
    registro: numeroRegistro,
    data: new Date().toLocaleString('pt-BR')
  };

  try {
    const response = await fetch("https://tokadolanche-api.onrender.com/novo-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      let historico = JSON.parse(localStorage.getItem('historicoPedidos') || "[]");
      historico.push(dados);
      localStorage.setItem('historicoPedidos', JSON.stringify(historico));
      
      document.getElementById("t-nome").innerHTML = `<b>${nomeInput}</b><br>Pedido Enviado! Cozinha Notificada.`;
      document.getElementById("toast").classList.add("show");
      
      setTimeout(() => { location.reload(); }, 2500);
    } else {
      btn.disabled = false;
      btn.innerText = "ENVIAR PEDIDO";
    }
  } catch (e) {
    btn.disabled = false;
    btn.innerText = "ENVIAR PEDIDO";
  }
}

function abrirRegistro() {
  limparPedidosAntigos();
  const modal = document.getElementById("modal-reg");
  const lista = JSON.parse(localStorage.getItem('historicoPedidos') || "[]");
  let itensHtml = "";

  if (lista.length === 0) {
    itensHtml = "<p style='color:#000; text-align:center;'>Nenhum pedido recente.</p>";
  } else {
    [...lista].reverse().forEach((p, idx) => {
      const originalIndex = lista.length - 1 - idx;
      itensHtml += `
        <div style="background:#f4f4f4; color:#000; padding:15px; border-radius:8px; margin-bottom:15px; border-left:5px solid #ffcc00;">
          <p><strong>Pedido #${p.registro}</strong></p>
          <p style="font-size: 0.8em; color: #666;">${p.data}</p>
          <p>Mesa: ${p.mesa} | Total: <strong>${p.total}</strong></p>
          <button onclick="imprimirExtrato(${originalIndex})" style="background:#ffcc00; border:none; padding:10px; border-radius:5px; font-weight:bold; width:100%; cursor:pointer; margin-top:10px;">IMPRIMIR</button>
        </div>`;
    });
  }

  modal.innerHTML = `
    <div style="background:#fff; padding:25px; border-radius:15px; width:90%; max-width:400px; max-height:85vh; overflow-y:auto;">
      <h2 style="color:#000; text-align:center; margin-bottom:20px;">PEDIDOS (7H)</h2>
      ${itensHtml}
      <button onclick="fecharRegistro()" style="background:#000; color:#ffcc00; width:100%; padding:12px; border:none; border-radius:8px; font-weight:bold; margin-top:10px; cursor:pointer;">FECHAR</button>
    </div>`;
  modal.style.display = "flex";
}

function imprimirExtrato(index) {
  const lista = JSON.parse(localStorage.getItem('historicoPedidos') || "[]");
  const p = lista[index];
  const itensArtesanais = p.itens.filter(i => i.tipo === 'artesanal');
  const win = window.open('', '', 'width=600,height=800');
  
  win.document.write(`
    <html>
      <body style="font-family:monospace; padding:20px;">
        <center><h1>TOKADOLANCHE</h1><p>EXTRATO #${p.registro}</p></center>
        <hr style="border: 1px dashed #000;">
        <p>CLIENTE: ${p.nome} | MESA: ${p.mesa}</p>
        <div style="border: 1px solid #000; padding: 10px; margin: 10px 0;">
          <p><strong>👨‍🍳 COZINHA:</strong></p>
          ${itensArtesanais.length > 0 ? itensArtesanais.map(i => `<p>• ${i.nome}</p>`).join('') : '<p>Somente Industrial</p>'}
          ${p.adicionais.length > 0 ? `<p>+ ${p.adicionais.map(a => a.nome).join(', ')}</p>` : ''}
        </div>
        <hr style="border: 1px dashed #000;">
        <p><strong>DETALHE COMPLETO:</strong></p>
        ${p.itens.map(i => `<p>${i.nome} <span style="float:right;">R$ ${i.preco.toFixed(2)}</span></p>`).join('')}
        ${p.adicionais.map(a => `<p>+ ${a.nome} <span style="float:right;">R$ ${a.preco.toFixed(2)}</span></p>`).join('')}
        <hr style="border: 1px dashed #000;">
        <center><h2>TOTAL: ${p.total}</h2></center>
        <script>window.print(); window.close();<\/script>
      </body>
    </html>`);
  win.document.close();
}

function fecharRegistro() {
  document.getElementById("modal-reg").style.display = "none";
}
