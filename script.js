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
  if (passoAtual === 1 && !pedidoAtual.mesa) return alert("Selecione uma mesa!");
  if (passoAtual === 2 && !document.getElementById("input-nome").value) return alert("Digite o nome!");

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
  const dados = {
    nome: nomeInput,
    mesa: pedidoAtual.mesa,
    total: `R$ ${totalSoma.toFixed(2).replace(".", ",")}`,
    itens: pedidoAtual.itens,
    adicionais: pedidoAtual.adicionais,
  };

  try {
    const response = await fetch("https://tokadolanche-api.onrender.com/novo-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      document.getElementById("t-nome").innerText = nomeInput;
      document.getElementById("toast").classList.add("show");
      setTimeout(() => location.reload(), 2000);
    } else {
      alert("Erro no servidor do Render.");
      btn.disabled = false;
      btn.innerText = "ENVIAR PEDIDO";
    }
  } catch (e) {
    alert("Erro de conexão! O servidor no Render está ligando? Tente novamente em alguns segundos.");
    btn.disabled = false;
    btn.innerText = "ENVIAR PEDIDO";
  }
}

function abrirRegistro() {
  document.getElementById("modal-reg").style.display = "flex";
}

function fecharRegistro() {
  document.getElementById("modal-reg").style.display = "none";
}
