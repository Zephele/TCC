// --- PRODUTOS ---
function openProdutoModal(id){
  editingId = id;
  document.getElementById('produtoErr').textContent = '';
  const bg = document.getElementById('produtoModalBg');
  if (id === null) {
		document.getElementById('produtoModalTitle').textContent = 'Registar produto';
		['f_nome', 'f_custo', 'f_preco', 'f_estoque', 'f_validade'].forEach(fid => document.getElementById(fid).value = '');
  } else {
		const p = produtos.find(x => x.id_produto === id || x.id === id);
		document.getElementById('produtoModalTitle').textContent = 'Alterar produto';
		document.getElementById('f_nome').value = p.nome;
		document.getElementById('f_custo').value = p.custo;
		document.getElementById('f_preco').value = p.preco_atual;
		document.getElementById('f_estoque').value = p.estoque;
		document.getElementById('f_validade').value = p.data_validade ? p.data_validade.split('T')[0] : '';
  }
  bg.classList.add('shown');
}
function closeProdutoModal(){ document.getElementById('produtoModalBg').classList.remove('shown'); }

async function saveProduto(){
  const dados = {
		nome: document.getElementById('f_nome').value.trim(),
		custo: parseFloat(document.getElementById('f_custo').value),
		preco_atual: parseFloat(document.getElementById('f_preco').value),
		estoque: parseInt(document.getElementById('f_estoque').value || 0),
		data_validade: document.getElementById('f_validade').value || null,
  };
  if (!dados.nome || isNaN(dados.custo) || isNaN(dados.preco_atual)) return document.getElementById('produtoErr').textContent = 'Preencha nome, custo e preço.';
  try {
		if (editingId === null) await api('/produtos/', { method: 'POST', body: JSON.stringify(dados) });
		else await api('/produtos/' + editingId, { method: 'PUT', body: JSON.stringify(dados) });
		closeProdutoModal();
		await refreshProdutos();
		render();
  } catch(e) { document.getElementById('produtoErr').textContent = e.message; }
}

async function deleteProduto(id){
  if (!confirm('Excluir este produto?')) return;
  try { await api('/produtos/' + id, { method: 'DELETE' }); await refreshProdutos(); render(); }
  catch(e){ alert(e.message); }
}

// --- VENDAS ---
function openVendaModal(){
  const select = document.getElementById('v_produto');
  select.innerHTML = produtos.filter(p => p.estoque > 0).map(p => `<option value="${p.id || p.id_produto}">${p.nome} (Estoque: ${p.estoque})</option>`).join('');
  if (select.options.length === 0) select.innerHTML = '<option value="">Nenhum produto em estoque</option>';
  document.getElementById('v_qtd').value = 1;
  document.getElementById('vendaModalBg').classList.add('shown');
}
function closeVendaModal(){ document.getElementById('vendaModalBg').classList.remove('shown'); }
function abrirVendaRapida(idProduto) {
  openVendaModal();
  setTimeout(() => { document.getElementById('v_produto').value = idProduto; }, 100);
}

async function registrarVenda() {
  const dadosVenda = { id_produto: parseInt(document.getElementById('v_produto').value), quantidade: parseInt(document.getElementById('v_qtd').value) };
  if (!dadosVenda.id_produto || isNaN(dadosVenda.quantidade) || dadosVenda.quantidade <= 0) return alert('Inválido.');
  try {
		await api('/vendas', { method: 'POST', body: JSON.stringify(dadosVenda) });
		closeVendaModal(); await refreshProdutos(); render(); alert('Venda registada!');
  } catch(e) { alert('Erro: ' + e.message); }
}

// --- CONCORRÊNCIA (NOVO) ---
function abrirModalConcorrencia(idProduto) {
  document.getElementById('c_produto_id').value = idProduto;
  document.getElementById('c_valor').value = '';
  document.getElementById('concorrenciaModalBg').classList.add('shown');
}
function closeConcorrenciaModal() { document.getElementById('concorrenciaModalBg').classList.remove('shown'); }

async function salvarConcorrencia() {
  const dados = { id_produto: parseInt(document.getElementById('c_produto_id').value), valor: parseFloat(document.getElementById('c_valor').value) };
  if (!dados.id_produto || isNaN(dados.valor) || dados.valor <= 0) return alert('Insira um valor válido.');
  try {
		await api('/concorrentes', { method: 'POST', body: JSON.stringify(dados) });
		closeConcorrenciaModal();
		alert('Preço registado! Se este valor for menor que o seu, o motor de regras irá considerá-lo na próxima análise.');
  } catch(e) { alert('Erro: ' + e.message); }
}

// --- SUGESTÕES ---
async function pedirSugestaoDesconto(idProduto) {
  try {
		await api('/sugestoes', { method: 'POST', body: JSON.stringify({ id_produto: idProduto }) });
		alert('Análise concluída! Vá até a aba "Gestão" para aprovar o novo preço.');
  } catch (e) { alert('Erro: ' + e.message); }
}
async function decidirSugestao(idSugestao, decisaoStr) {
  try {
		await api('/sugestoes/' + idSugestao, { method: 'PATCH', body: JSON.stringify({ decisao: decisaoStr }) });
		await refreshProdutos(); render();
  } catch(e) { alert('Erro: ' + e.message); }
}

// --- GESTÃO DE EQUIPA ---
let editingUserId = null;

function openUsuarioModal(id) {
  editingUserId = id;
  document.getElementById('usuarioErr').textContent = '';
  const bg = document.getElementById('usuarioModalBg');
  
  if (id === null) {
    document.getElementById('usuarioModalTitle').textContent = 'Adicionar Membro';
    document.getElementById('u_name').value = '';
    document.getElementById('u_username').value = '';
    document.getElementById('u_password').value = '';
    document.getElementById('u_senha_hint').textContent = '(Obrigatório)';
    document.getElementById('u_cargo').value = '3';
    document.getElementById('u_status').value = 'true';
  } else {
    const u = usuarios.find(x => x.ID === id);
    document.getElementById('usuarioModalTitle').textContent = 'Alterar Membro';
    document.getElementById('u_name').value = u.Name;
    document.getElementById('u_username').value = u.Username;
    document.getElementById('u_password').value = '';
    document.getElementById('u_senha_hint').textContent = '(Deixe em branco para manter a senha atual)';
    document.getElementById('u_cargo').value = u.Cargo_ID || '3';
    document.getElementById('u_status').value = u.Is_Active ? 'true' : 'false';
  }
  bg.classList.add('shown');
}

function closeUsuarioModal() { document.getElementById('usuarioModalBg').classList.remove('shown'); }

async function saveUsuario() {
  const dados = {
    Name: document.getElementById('u_name').value.trim(),
    Username: document.getElementById('u_username').value.trim(),
    Cargo_ID: parseInt(document.getElementById('u_cargo').value),
    Is_Active: document.getElementById('u_status').value === 'true'
  };
  
  const pwd = document.getElementById('u_password').value.trim();
  if (pwd) dados.Password = pwd;

  if (!dados.Name || !dados.Username) return document.getElementById('usuarioErr').textContent = 'Nome e Login são obrigatórios.';
  if (editingUserId === null && !dados.Password) return document.getElementById('usuarioErr').textContent = 'A senha é obrigatória para novos membros.';

  try {
    if (editingUserId === null) {
      await api('/usuarios/', { method: 'POST', body: JSON.stringify(dados) });
    } else {
      await api('/usuarios/' + editingUserId, { method: 'PUT', body: JSON.stringify(dados) });
    }
    
    closeUsuarioModal();
    await refreshUsuarios();
    render();
  } catch(e) {
    document.getElementById('usuarioErr').textContent = e.message;
  }
}

async function deleteUsuario(id) {
  if (!confirm('Excluir este membro da equipa? Esta ação não pode ser desfeita.')) return;
  try {
    await api('/usuarios/' + id, { method: 'DELETE' });
    await refreshUsuarios();
    render();
  }
  catch(e) { alert(e.message); }
}

// --- FEEDBACK DE CLIENTES ---
function abrirModalFeedback(idProduto) {
  document.getElementById('f_fb_produto_id').value = idProduto;
  document.getElementById('f_fb_cliente').value = '';
  document.getElementById('f_fb_comentario').value = '';
  document.getElementById('feedbackErr').textContent = '';
  document.getElementById('feedbackModalBg').classList.add('shown');
}

function closeFeedbackModal() {
  document.getElementById('feedbackModalBg').classList.remove('shown');
}

async function salvarFeedback() {
  const dados = {
    id_produto: parseInt(document.getElementById('f_fb_produto_id').value),
    cliente: document.getElementById('f_fb_cliente').value.trim(),
    comentario: document.getElementById('f_fb_comentario').value.trim()
  };
  
  if (!dados.comentario) {
    return document.getElementById('feedbackErr').textContent = 'O comentário é obrigatório.';
  }

  try {
    // Comunica com a rota POST /api/feedbacks que já existe no seu backend
    await api('/feedbacks', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
    
    closeFeedbackModal();
    alert('Feedback registado com sucesso! O motor de IA vai considerar esta opinião na próxima vez que pedir uma análise de desconto.');
  } catch(e) {
    document.getElementById('feedbackErr').textContent = 'Erro: ' + e.message;
  }
}