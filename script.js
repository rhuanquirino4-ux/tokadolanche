let passoAtual = 1;

let pedidoAtual = {
mesa:"",
nome:"",
itens:[],
adicionais:[]
};

const TITULOS={
1:"Mesas",
2:"Identificação",
3:"Lanches",
4:"Adicionais",
5:"Porções",
6:"Bebidas",
7:"Sobremesas",
8:"Registro"
};

document.addEventListener("DOMContentLoaded",()=>{

sincronizarMesas();
renderizarMesas();
carregarEstadoEstoque();
atualizarTotal();

});

function sincronizarMesas(){

const registros=
JSON.parse(localStorage.getItem("toka_registros")||"[]");

const mesasAtivas=
registros.map(r=>Number(r.mesa));

localStorage.setItem("mesasOcupadasToka",JSON.stringify(mesasAtivas));

}

function renderizarMesas(){

const grid=document.getElementById("grid-mesas");

if(!grid) return;

grid.innerHTML="";

const ocupadas=
JSON.parse(localStorage.getItem("mesasOcupadasToka")||"[]")
.map(Number);

for(let i=1;i<=20;i++){

const div=document.createElement("div");

const ocupada=ocupadas.includes(i);

div.className=ocupada?"mesa ocupada":"mesa";

div.innerHTML=
`<h3>${i<10?"0"+i:i}</h3>
<small>${ocupada?"OCUPADA":"LIVRE"}</small>`;

div.onclick=()=>{

if(ocupada){
alert("Mesa ocupada!");
return;
}

pedidoAtual.mesa=i;

document
.querySelectorAll(".mesa")
.forEach(m=>m.classList.remove("selecionada"));

div.classList.add("selecionada");

};

grid.appendChild(div);

}

}

function selecionarProd(el,nome){

if(el.classList.contains("esgotado")) return;

const precoTexto=
el.querySelector("span").innerText;

const preco=
parseFloat(precoTexto.replace("R$ ","").replace(",","."))

const idx=
pedidoAtual.itens.findIndex(i=>i.nome===nome);

if(idx>-1){

pedidoAtual.itens.splice(idx,1);
el.classList.remove("ativo");

}else{

pedidoAtual.itens.push({nome,preco});
el.classList.add("ativo");

}

atualizarTotal();

}

function selecionarAdic(el,nome,preco){

const idx=
pedidoAtual.adicionais.findIndex(a=>a.nome===nome);

if(idx>-1){

pedidoAtual.adicionais.splice(idx,1);
el.classList.remove("ativo");

}else{

pedidoAtual.adicionais.push({
nome,
preco:parseFloat(preco)
});

el.classList.add("ativo");

}

atualizarTotal();

}

function atualizarTotal(){

const total=
[...pedidoAtual.itens,...pedidoAtual.adicionais]
.reduce((acc,i)=>acc+i.preco,0);

const label=
document.getElementById("total-preview");

if(label){

label.innerText=
`TOTAL: R$ ${total.toFixed(2).replace(".",",")}`;

}

}

function proximo(){

if(passoAtual===1 && !pedidoAtual.mesa)
return alert("Selecione uma mesa!");

if(passoAtual===2){

const nome=
document.getElementById("input-nome").value;

if(!nome)
return alert("Digite o nome!");

pedidoAtual.nome=nome;

}

document
.getElementById(`step-${passoAtual}`)
.classList.remove("active");

passoAtual++;

document
.getElementById(`step-${passoAtual}`)
.classList.add("active");

document.getElementById("titulo-passo").innerText=
`Toka Do Lanche - ${TITULOS[passoAtual]}`;

const btnProx=
document.getElementById("btn-proximo");

const btnEnv=
document.getElementById("btn-enviar");

if(passoAtual===7){

btnProx.style.display="none";
btnEnv.style.display="block";

}

}

function voltar(){

if(passoAtual===1) return;

const atual=
document.getElementById(`step-${passoAtual}`)
|| document.getElementById("registro-aba");

if(atual) atual.classList.remove("active");

if(passoAtual===8){

document.querySelector(".controles").style.display="block";

passoAtual=1;

document
.getElementById("step-1")
.classList.add("active");

document.getElementById("btn-proximo").style.display="block";
document.getElementById("btn-enviar").style.display="none";

}else{

passoAtual--;

document
.getElementById(`step-${passoAtual}`)
.classList.add("active");

}

document.getElementById("titulo-passo").innerText=
`Toka Do Lanche - ${TITULOS[passoAtual]}`;

}

async function finalizar(){

if(pedidoAtual.itens.length===0)
return alert("Selecione itens!");

const btn=
document.getElementById("btn-enviar");

btn.disabled=true;
btn.innerHTML="ENVIANDO...";

const total=
[...pedidoAtual.itens,...pedidoAtual.adicionais]
.reduce((acc,i)=>acc+i.preco,0);

const dataHora=
new Date().toLocaleString();

let msg=
`<b>REGISTRO DE PEDIDO - TOKA DO LANCHE</b>\n`;

msg+=`------------------------------\n`;
msg+=`<b>DATA/HORA:</b> ${dataHora}\n`;
msg+=`<b>MESA:</b> ${pedidoAtual.mesa}\n`;
msg+=`<b>CLIENTE:</b> ${pedidoAtual.nome}\n`;
msg+=`------------------------------\n`;
msg+=`<b>ITENS:</b>\n`;

pedidoAtual.itens
.forEach(i=>msg+=`- ${i.nome}\n`);

if(pedidoAtual.adicionais.length>0){

msg+=`\n<b>ADICIONAIS:</b>\n`;

pedidoAtual.adicionais
.forEach(a=>msg+=`- ${a.nome}\n`);

}

msg+=`------------------------------\n`;
msg+=`<b>TOTAL: R$ ${total.toFixed(2).replace(".",",")}</b>\n`;
msg+=`------------------------------`;

try{

const resp=await fetch(
`https://api.telegram.org/bot8408876469:AAEDSV5TPqx71g7qBGignLQP2dseKapksGQ/sendMessage`,
{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
chat_id:"7850649461",
text:msg,
parse_mode:"HTML"
})
}
);

if(resp.ok){

let hist=
JSON.parse(localStorage.getItem("toka_registros")||"[]");

hist.push({
...pedidoAtual,
id:Date.now(),
data:dataHora,
total
});

localStorage.setItem("toka_registros",JSON.stringify(hist));

alert("Pedido Enviado!");

location.reload();

}else{

alert("Erro no Telegram.");

}

}catch{

alert("Erro de conexão.");

}

btn.disabled=false;
btn.innerHTML="FINALIZAR PEDIDO";

}

function abrirRegistro(){

passoAtual=8;

document
.querySelectorAll(".step")
.forEach(s=>s.classList.remove("active"));

document
.getElementById("registro-aba")
.classList.add("active");

document.getElementById("titulo-passo").innerText=
"Toka Do Lanche - REGISTRO";

document.querySelector(".controles").style.display="none";

const lista=
document.getElementById("lista-registros");

const hist=
JSON.parse(localStorage.getItem("toka_registros")||"[]");

lista.innerHTML=
hist.slice().reverse().map(reg=>`

<div class="registro-card">

<h4>Mesa ${reg.mesa} - ${reg.nome}</h4>

<p>${reg.data}</p>

<p><strong>Total: R$ ${reg.total.toFixed(2).replace(".",",")}</strong></p>

<button class="btn-imprimir"
onclick="imprimirExtrato(${reg.id})">
IMPRIMIR EXTRATO
</button>

<button class="btn-imprimir"
onclick="liberarMesa(${reg.id},${reg.mesa})">
LIBERAR MESA
</button>

</div>

`).join("");

}

function liberarMesa(id,mesa){

let hist=
JSON.parse(localStorage.getItem("toka_registros")||"[]");

hist=hist.filter(r=>r.id!==id);

localStorage.setItem("toka_registros",JSON.stringify(hist));

alert("Mesa "+mesa+" liberada");

location.reload();

}

function toggleStatus(event,btn){

if(event){
event.stopPropagation();
event.preventDefault();
}

const card=
btn.closest(".card-produto") ||
btn.closest(".card-bebida");

if(!card) return;

const nome=
card.querySelector("h3,p").innerText;

const precoSpan=
card.querySelector("span");

let dados=
JSON.parse(localStorage.getItem("estoqueToka")||"{}");

const editar=
confirm("OK para mudar preço ou cancelar para esgotar");

if(editar){

let novo=prompt("Novo preço:");

if(novo){

const precoFormatado=
`R$ ${parseFloat(novo).toFixed(2).replace(".",",")}`;

precoSpan.innerText=precoFormatado;

card.classList.remove("esgotado");

dados[nome]={
preco:precoFormatado,
esgotado:false
};

}

}else{

const esgotado=
card.classList.toggle("esgotado");

if(!dados[nome]) dados[nome]={};

dados[nome].esgotado=esgotado;

}

localStorage.setItem("estoqueToka",JSON.stringify(dados));

}

function carregarEstadoEstoque(){

const dados=
JSON.parse(localStorage.getItem("estoqueToka")||"{}");

document
.querySelectorAll(".card-produto,.card-bebida")
.forEach(card=>{

const nome=
card.querySelector("h3,p").innerText;

if(dados[nome]){

if(dados[nome].esgotado)
card.classList.add("esgotado");

if(dados[nome].preco)
card.querySelector("span").innerText=dados[nome].preco;

}

});

}

function imprimirExtrato(id){

const registros=
JSON.parse(localStorage.getItem("toka_registros")||"[]");

const pedido=
registros.find(r=>r.id===id);

if(!pedido){
alert("Pedido não encontrado");
return;
}

let html=
`<html>
<head>
<title>Extrato</title>
<style>
body{font-family:monospace;padding:20px}
h2{text-align:center}
</style>
</head>
<body>

<h2>TOKA DO LANCHE</h2>
<hr>

<p>Mesa: ${pedido.mesa}</p>
<p>Cliente: ${pedido.nome}</p>
<p>Data: ${pedido.data}</p>

<hr>
<b>Itens</b>
<ul>`;

pedido.itens.forEach(i=>{
html+=`<li>${i.nome}</li>`;
});

if(pedido.adicionais && pedido.adicionais.length){

html+=`</ul><b>Adicionais</b><ul>`;

pedido.adicionais.forEach(a=>{
html+=`<li>${a.nome}</li>`;
});

}

html+=`
</ul>

<hr>

<b>Total: R$ ${pedido.total.toFixed(2).replace(".",",")}</b>

</body>
</html>`;

const win=
window.open("","_blank","width=350,height=600");

win.document.write(html);

win.document.close();

setTimeout(()=>{
win.print();
},500);

}
