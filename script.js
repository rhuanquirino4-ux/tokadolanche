let passoAtual = 1;
let pedido = {
    mesa: null,
    nome: "",
    itens: [],
    adicionais: []
};

const TITULOS = {
    1: "Mesas", 2: "Identificação", 3: "Lanches", 
    4: "Adicionais", 5: "Porções", 6: "Bebidas", 7: "Sobremesas", 8: "Registro"
};

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("grid-mesas");
    if (grid) {
        for (let i = 1; i <= 20; i++) {
            let m = document.createElement("div");
            m.className = "mesa";
            m.innerHTML = `<h3>${i}</h3><small>LIVRE</small>`;
            m.onclick = () => {
                pedido.mesa = i;
                document.querySelectorAll(".mesa").forEach(el => el.classList.remove("selecionada"));
                m.classList.add("selecionada");
            };
            grid.appendChild(m);
        }
    }
    atualizarTotal();
});

function selecionarProd(el, nome) {
    if (el.classList.contains("esgotado")) return;
    
    const precoTexto = el.querySelector("span").innerText;
    const preco = parseFloat(precoTexto.replace("R$ ", "").replace(",", "."));

    const idx = pedido.itens.findIndex(i => i.nome === nome);
    if (idx > -1) {
        pedido.itens.splice(idx, 1);
        el.classList.remove("ativo");
    } else {
        pedido.itens.push({ nome, preco });
        el.classList.add("ativo");
    }
    atualizarTotal();
}

function selecionarAdic(el, nome, preco) {
    const idx = pedido.adicionais.findIndex(a => a.nome === nome);
    if (idx > -1) {
        pedido.adicionais.splice(idx, 1);
        el.classList.remove("ativo");
    } else {
        pedido.adicionais.push({ nome, preco });
        el.classList.add("ativo");
    }
    atualizarTotal();
}

function atualizarTotal() {
    const totalItens = pedido.itens.reduce((sum, i) => sum + i.preco, 0);
    const totalAdic = pedido.adicionais.reduce((sum, a) => sum + a.preco, 0);
    const total = totalItens + totalAdic;
    document.getElementById("total-preview").innerText = `TOTAL: R$ ${total.toFixed(2).replace(".", ",")}`;
}

function toggleStatus(ev, btn) {
    ev.stopPropagation();
    const card = btn.closest(".card-produto") || btn.closest(".card-bebida");
    
    let opt = confirm("OK para MUDAR PREÇO ou CANCELAR para ESGOTAR.");
    
    if (opt) {
        let novoPreco = prompt("Novo Preço (ex: 25.00):");
        if (novoPreco) {
            card.querySelector("span").innerText = `R$ ${parseFloat(novoPreco).toFixed(2).replace(".", ",")}`;
        }
    } else {
        const estaEsgotado = card.classList.toggle("esgotado");
        btn.innerHTML = estaEsgotado ? '<i class="fa-solid fa-ban"></i>' : '<i class="fa-solid fa-pencil"></i>';
    }
}

function proximo() {
    if (passoAtual === 1 && !pedido.mesa) return alert("Selecione uma mesa!");
    if (passoAtual === 2) {
        const nomeInput = document.getElementById("input-nome").value;
        if (!nomeInput) return alert("Nome do cliente obrigatório!");
        pedido.nome = nomeInput;
    }

    document.getElementById(`step-${passoAtual}`).classList.remove("active");
    passoAtual++;

    if (passoAtual <= 7) {
        document.getElementById(`step-${passoAtual}`).classList.add("active");
        document.getElementById("titulo-passo").innerText = `Toka Do Lanche - ${TITULOS[passoAtual]}`;
    }

    if (passoAtual === 7) {
        document.getElementById("btn-proximo").style.display = "none";
        document.getElementById("btn-enviar").style.display = "block";
    }
}

function voltar() {
    if (passoAtual === 8) {
        document.getElementById("registro-aba").classList.remove("active");
        passoAtual = 1;
        document.getElementById("step-1").classList.add("active");
        document.querySelector(".controles").style.display = "flex";
        return;
    }

    if (passoAtual > 1) {
        document.getElementById(`step-${passoAtual}`).classList.remove("active");
        if (passoAtual === 7) {
            document.getElementById("btn-proximo").style.display = "block";
            document.getElementById("btn-enviar").style.display = "none";
        }
        passoAtual--;
        document.getElementById(`step-${passoAtual}`).classList.add("active");
        document.getElementById("titulo-passo").innerText = `Toka Do Lanche - ${TITULOS[passoAtual]}`;
    }
}

function finalizar() {
    if (pedido.itens.length === 0) return alert("Adicione itens ao pedido!");

    const total = parseFloat(document.getElementById("total-preview").innerText.split("R$ ")[1].replace(",", "."));
    const novoRegistro = {
        id: Date.now(),
        data: new Date().toLocaleString(),
        mesa: pedido.mesa,
        cliente: pedido.nome,
        itens: [...pedido.itens, ...pedido.adicionais],
        total: total
    };

    let historico = JSON.parse(localStorage.getItem("toka_registros") || "[]");
    historico.push(novoRegistro);
    localStorage.setItem("toka_registros", JSON.stringify(historico));

    alert("Pedido Finalizado e Gravado!");
    location.reload();
}

function abrirRegistro() {
    document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
    document.getElementById("registro-aba").classList.add("active");
    document.getElementById("titulo-passo").innerText = "Toka Do Lanche - REGISTRO";
    document.querySelector(".controles").style.display = "none";
    passoAtual = 8;

    const lista = document.getElementById("lista-registros");
    const historico = JSON.parse(localStorage.getItem("toka_registros") || "[]");
    
    lista.innerHTML = historico.reverse().map(reg => `
        <div class="registro-card">
            <h4>Mesa ${reg.mesa} - ${reg.cliente}</h4>
            <p>${reg.data}</p>
            <p><strong>Itens:</strong> ${reg.itens.map(i => i.nome).join(", ")}</p>
            <p><strong>Total: R$ ${reg.total.toFixed(2)}</strong></p>
            <button class="btn-imprimir" onclick="imprimirCupom(${reg.id})">IMPRIMIR CUPOM</button>
        </div>
    `).join("");
}

function imprimirCupom(id) {
    const historico = JSON.parse(localStorage.getItem("toka_registros") || "[]");
    const reg = historico.find(r => r.id === id);
    
    const janela = window.open("", "", "width=300,height=600");
    janela.document.write(`
        <div style="font-family: monospace; width: 250px;">
            <center><strong>TOKA DO LANCHE</strong><br>Cupom Não Fiscal<br>--------------------------</center>
            Mesa: ${reg.mesa}<br>Cliente: ${reg.cliente}<br>Data: ${reg.data}<br>
            --------------------------<br>
            ${reg.itens.map(i => `${i.nome.padEnd(18)} R$ ${i.preco.toFixed(2)}`).join("<br>")}
            <br>--------------------------<br>
            <strong>TOTAL: R$ ${reg.total.toFixed(2)}</strong>
            <br>--------------------------<br>
            <center>Obrigado pela preferência!</center>
        </div>
    `);
    janela.print();
    janela.close();
}
