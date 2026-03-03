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
});

function selecionarMesa(numero, elemento) {
  pedidoAtual.mesa = numero;
  document.querySelectorAll(".mesa").forEach((m) => m.classList.remove("selecionada"));
  elemento.classList.add("selecionada");
}

function selecionarProd(elemento, nome, preco) {
  pedidoAtual.itens.push({ nome, preco });
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
      document.getElementById("t-nome").innerHTML = `<b>${nomeInput}</b><br>Pedido Enviado!`;
      document.getElementById("toast").classList.add("show");
      setTimeout(() => { location.reload(); }, 2500);
    } else {
      btn.disabled = false;
      btn.innerText = "TENTAR NOVAMENTE";
    }
  } catch (e) {
    btn.disabled = false;
    btn.innerText = "ERRO DE CONEXÃO";
  }
}

function abrirRegistro() {
  const modal = document.getElementById("modal-reg");
  const lista = JSON.parse(localStorage.getItem('historicoPedidos') || "[]");
  let itensHtml = "";

  if (lista.length === 0) {
    itensHtml = "<p style='color:#000; text-align:center;'>Nenhum pedido realizado.</p>";
  } else {
    // Adicionei line-height e margin-bottom para separar as linhas
    lista.reverse().forEach((p, idx) => {
      itensHtml += `
        <div style="background:#f4f4f4; color:#000; padding:15px; border-radius:8px; margin-bottom:15px; border-left:5px solid #ffcc00; line-height: 1.6;">
          <p style="margin: 0 0 5px 0;"><strong>Pedido #${p.registro}</strong></p>
          <p style="margin: 0 0 5px 0; font-size: 0.9em; color: #666;">Data: ${p.data}</p>
          <p style="margin: 0 0 10px 0;">Mesa: ${p.mesa} | Total: <strong>${p.total}</strong></p>
          <button onclick="imprimirExtrato(${lista.length - 1 - idx})" style="background:#ffcc00; border:none; padding:10px; border-radius:5px; font-weight:bold; width:100%; cursor:pointer; text-transform: uppercase;">IMPRIMIR EXTRATO</button>
        </div>`;
    });
  }

  modal.innerHTML = `
    <div style="background:#fff; padding:25px; border-radius:15px; width:90%; max-width:400px; max-height:85vh; overflow-y:auto; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
      <h2 style="color:#000; text-align:center; margin-bottom:20px; font-family: sans-serif;">MEUS PEDIDOS</h2>
      ${itensHtml}
      <button onclick="fecharRegistro()" style="background:#000; color:#ffcc00; width:100%; padding:12px; border:none; border-radius:8px; font-weight:bold; margin-top:10px; cursor:pointer;">FECHAR</button>
    </div>`;
  modal.style.display = "flex";
}

function imprimirExtrato(index) {
  const lista = JSON.parse(localStorage.getItem('historicoPedidos') || "[]");
  const p = lista[index];
  const win = window.open('', '', 'width=600,height=800');
  
  // No extrato, usei padding e margin para não ficar tudo grudado na borda
  win.document.write(`
    <html>
      <body style="font-family:monospace; padding:30px; line-height: 1.5; color: #333;">
        <center>
          <h1 style="margin-bottom: 5px;">TOKADOLANCHE</h1>
          <p style="margin-top: 0;">EXTRATO DO PEDIDO #${p.registro}</p>
        </center>
        <hr style="border: 1px dashed #000; margin: 20px 0;">
        <p><strong>CLIENTE:</strong> ${p.nome}</p>
        <p><strong>MESA:</strong> ${p.mesa}</p>
        <p><strong>DATA:</strong> ${p.data}</p>
        <hr style="border: 1px dashed #000; margin: 20px 0;">
        <p style="text-decoration: underline; margin-bottom: 10px;"><strong>ITENS DO PEDIDO:</strong></p>
        <div style="margin-bottom: 20px;">
          ${p.itens.map(i => `<p style="margin: 5px 0;">• ${i.nome} <span style="float:right;">R$ ${i.preco.toFixed(2).replace('.',',')}</span></p>`).join('')}
          ${p.adicionais.length > 0 ? `<p style="margin: 15px 0 5px 0;"><strong>ADICIONAIS:</strong></p>` + p.adicionais.map(a => `<p style="margin: 5px 0;">+ ${a.nome} <span style="float:right;">R$ ${a.preco.toFixed(2).replace('.',',')}</span></p>`).join('') : ''}
        </div>
        <hr style="border: 1px dashed #000; margin: 20px 0;">
        <center><h2 style="margin-top: 10px;">TOTAL: ${p.total}</h2></center>
        <p style="text-align: center; font-size: 0.8em; margin-top: 30px;">Obrigado pela preferência!</p>
        <script>window.print(); window.close();<\/script>
      </body>
    </html>`);
  win.document.close();
}

function fecharRegistro() {
  document.getElementById("modal-reg").style.display = "none";
}
