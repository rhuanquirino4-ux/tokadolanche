let passoAtual = 1;
let pedidoAtual = { mesa: "", nome: "", itens: [], adicionais: [] };
let ultimoRegistro = null; // Guarda o último pedido feito nesta sessão

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
  const numeroRegistro = Math.floor(1000 + Math.random() * 9000);

  const dados = {
    nome: nomeInput,
    mesa: pedidoAtual.mesa,
    total: `R$ ${totalSoma.toFixed(2).replace(".", ",")}`,
    itens: pedidoAtual.itens,
    adicionais: pedidoAtual.adicionais,
    registro: numeroRegistro
  };

  try {
    const response = await fetch("https://tokadolanche-api.onrender.com/novo-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      // Salva no localStorage para o registro não sumir se a página recarregar
      localStorage.setItem('ultimoPedido', JSON.stringify(dados));
      
      document.getElementById("t-nome").innerHTML = `<b>${nomeInput}</b><br>Pedido: #${numeroRegistro}`;
      document.getElementById("toast").classList.add("show");
      
      setTimeout(() => {
        location.reload();
      }, 4000);
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
  const dadosSalvos = localStorage.getItem('ultimoPedido');
  
  if (dadosSalvos) {
    const p = JSON.parse(dadosSalvos);
    modal.innerHTML = `
      <div class="modal-content">
        <h2>MEU REGISTRO</h2>
        <hr>
        <p><b>Status:</b> ✅ Enviado</p>
        <p><b>Pedido:</b> #${p.registro}</p>
        <p><b>Cliente:</b> ${p.nome}</p>
        <p><b>Mesa:</b> ${p.mesa}</p>
        <p><b>Total:</b> ${p.total}</p>
        <button onclick="fecharRegistro()" style="margin-top:20px; background: #ffcc00; border:none; padding:10px; border-radius:5px; cursor:pointer;">FECHAR</button>
      </div>
    `;
  } else {
    modal.innerHTML = `
      <div class="modal-content">
        <h2>SEM REGISTROS</h2>
        <p>Você ainda não fez nenhum pedido.</p>
        <button onclick="fecharRegistro()" style="margin-top:20px; background: #ccc; border:none; padding:10px; border-radius:5px; cursor:pointer;">FECHAR</button>
      </div>
    `;
  }
  modal.style.display = "flex";
}

function fecharRegistro() {
  document.getElementById("modal-reg").style.display = "none";
}    
