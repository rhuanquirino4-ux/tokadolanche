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
      // SALVA NO HISTÓRICO LOCAL
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
  
  let html = `
    <div class="modal-content" style="background:#fff; color:#000; padding:20px; border-radius:10px; width:90%; max-width:400px; max-height:80vh; overflow-y:auto;">
      <h2 style="text-align:center; border-bottom:2px solid #ffcc00; padding-bottom:10px;">HISTÓRICO DE PEDIDOS</h2>
      <div id="lista-pedidos" style="margin-top:15px;">
  `;

  if (lista.length === 0) {
    html += `<p style="text-align:center;">Nenhum pedido encontrado.</p>`;
  } else {
    lista.reverse().forEach((p, index) => {
      html += `
        <div style="border:1px solid #ddd; padding:10px; border-radius:5px; margin-bottom:10px; background:#f9f9f9;">
          <p><strong>#${p.registro}</strong> - ${p.data}</p>
          <p>Mesa: ${p.mesa} | Total: ${p.total}</p>
          <button onclick="imprimirExtrato(${lista.length - 1 - index})" style="background:#ffcc00; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; font-weight:bold; width:100%;">IMPRIMIR EXTRATO</button>
        </div>
      `;
    });
  }

  html += `
      </div>
      <button onclick="fecharRegistro()" style="margin-top:15px; width:100%; background:#000; color:#ffcc00; padding:10px; border:none; border-radius:5px; font-weight:bold;">VOLTAR AO MENU</button>
    </div>
  `;
  
  modal.innerHTML = html;
  modal.style.display = "flex";
}

function imprimirExtrato(index) {
  const lista = JSON.parse(localStorage.getItem('historicoPedidos') || "[]");
  const p = lista[index];
  
  const janela = window.open('', '', 'width=600,height=600');
  janela.document.write(`
    <html>
      <body style="font-family:monospace; padding:20px;">
        <center>
          <h1>TOKADOLANCHE</h1>
          <p>--------------------------------</p>
          <p><strong>EXTRATO DO PEDIDO #${p.registro}</strong></p>
          <p>${p.data}</p>
          <p>--------------------------------</p>
        </center>
        <p><strong>CLIENTE:</strong> ${p.nome}</p>
        <p><strong>MESA:</strong> ${p.mesa}</p>
        <p>--------------------------------</p>
        <p><strong>ITENS:</strong></p>
        ${p.itens.map(i => `<p>${i.nome} - R$ ${i.preco.toFixed(2)}</p>`).join('')}
        ${p.adicionais.length > 0 ? `<p><strong>ADICIONAIS:</strong></p>` + p.adicionais.map(a => `<p>${a.nome} - R$ ${a.preco.toFixed(2)}</p>`).join('') : ''}
        <p>--------------------------------</p>
        <center><h2>TOTAL: ${p.total}</h2></center>
        <script>window.print(); window.close();</script>
      </body>
    </html>
  `);
  janela.document.close();
}

function fecharRegistro() {
  document.getElementById("modal-reg").style.display = "none";
}
