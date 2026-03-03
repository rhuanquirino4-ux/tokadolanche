// Substitua suas funções finalizar, abrirRegistro e fecharRegistro por estas:

async function finalizar() {
  const btn = document.getElementById("btn-enviar");
  const nomeInput = document.getElementById("input-nome").value;
  btn.disabled = true;
  btn.innerText = "ENVIANDO...";

  const totalSoma = [...pedidoAtual.itens, ...pedidoAtual.adicionais].reduce((acc, i) => acc + i.preco, 0);
  const numeroRegistro = Math.floor(1000 + Math.random() * 9000);

  const dados = {
    nome: nomeInput,
    mesa: pedidoAtual.mesa,
    total: `R$ ${totalSoma.toFixed(2).replace(".", ",")}`,
    itens: pedidoAtual.itens,
    adicionais: pedidoAtual.adicionais,
    registro: numeroRegistro,
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };

  try {
    const response = await fetch("https://tokadolanche-api.onrender.com/novo-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      // SALVA O PEDIDO NO NAVEGADOR ANTES DE RECARREGAR
      localStorage.setItem('meuUltimoPedido', JSON.stringify(dados));
      
      document.getElementById("t-nome").innerHTML = `<b>${nomeInput}</b><br>Pedido: #${numeroRegistro}`;
      document.getElementById("toast").classList.add("show");
      
      setTimeout(() => {
        location.reload();
      }, 3000);
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
  const dados = localStorage.getItem('meuUltimoPedido');
  
  // Limpa o conteúdo atual e reconstrói para garantir que apareça
  if (dados) {
    const p = JSON.parse(dados);
    modal.innerHTML = `
      <div class="modal-content" style="background:white; padding:20px; border-radius:15px; text-align:center; min-width:250px; border: 3px solid #ffcc00;">
        <h2 style="color:black; margin-bottom:10px;">MEU PEDIDO</h2>
        <div style="text-align:left; color:black; font-family:sans-serif;">
          <p><strong>Nº Registro:</strong> #${p.registro}</p>
          <p><strong>Cliente:</strong> ${p.nome}</p>
          <p><strong>Mesa:</strong> ${p.mesa}</p>
          <p><strong>Total:</strong> ${p.total}</p>
          <p><strong>Horário:</strong> ${p.hora}</p>
        </div>
        <button onclick="fecharRegistro()" style="margin-top:15px; width:100%; background:#000; color:#ffcc00; font-weight:bold; padding:10px; border:none; border-radius:8px; cursor:pointer;">FECHAR</button>
      </div>
    `;
  } else {
    modal.innerHTML = `
      <div class="modal-content" style="background:white; padding:20px; border-radius:15px; text-align:center; color:black;">
        <h2>SEM REGISTROS</h2>
        <p>Você ainda não fez nenhum pedido hoje.</p>
        <button onclick="fecharRegistro()" style="margin-top:15px; background:#ccc; padding:10px; border:none; border-radius:8px;">FECHAR</button>
      </div>
    `;
  }
  modal.style.display = "flex";
}

function fecharRegistro() {
  document.getElementById("modal-reg").style.display = "none";
}
