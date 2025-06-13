// ============================================================================
// SISTEMA DE VALIDAÇÃO DE CERTIFICADOS - Atividades Formativas
// ============================================================================

// Variáveis globais
let currentUser = null;
let atividades = [];
let grupos = [];
let certificados = [];

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
});

async function initializeSystem() {
    try {
        // Carregar dados de configuração
        await loadConfigData();
        
        // Carregar dados do localStorage
        loadLocalData();
        
        // Configurar eventos
        setupEventListeners();
        
        // Verificar se há usuário logado
        checkLoggedUser();
        
        console.log('Sistema inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar sistema:', error);
        showAlert('Erro ao carregar sistema. Verifique os arquivos de configuração.', 'danger');
    }
}

// ============================================================================
// CARREGAMENTO DE DADOS
// ============================================================================

async function loadConfigData() {
    try {
        // Carregar atividades
        const atividadesResponse = await fetch('./atividades_AG.json');
        atividades = await atividadesResponse.json();
        
        // Carregar grupos
        const gruposResponse = await fetch('./grupos_AG.json');
        grupos = await gruposResponse.json();
        
        // Popular select de atividades
        populateActivitySelect();
        
    } catch (error) {
        console.error('Erro ao carregar dados de configuração:', error);
        throw error;
    }
}

function loadLocalData() {
    // Carregar certificados do localStorage
    const savedCertificados = localStorage.getItem('certificados');
    if (savedCertificados) {
        certificados = JSON.parse(savedCertificados);
    }
    
    // Carregar usuário atual
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('certificados', JSON.stringify(certificados));
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// ============================================================================
// EVENTOS
// ============================================================================

function setupEventListeners() {
    // Formulário de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulário de upload
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    // Seleção de atividade
    const activitySelect = document.getElementById('activity-select');
    if (activitySelect) {
        activitySelect.addEventListener('change', updateMaxHours);
    }
}

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const userType = document.getElementById('user-type').value;
    
    if (!username || !userType) {
        showAlert('Por favor, preencha todos os campos.', 'warning');
        return;
    }
    
    // Criar objeto do usuário
    currentUser = {
        name: username,
        type: userType,
        loginTime: new Date().toISOString()
    };
    
    // Salvar no localStorage
    saveToLocalStorage();
    
    // Redirecionar para área correspondente
    if (userType === 'aluno') {
        showAlunoArea();
    } else {
        showProfessorArea();
    }
    
    showAlert(`Bem-vindo, ${username}!`, 'success');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // Esconder todas as áreas
    document.getElementById('aluno-area').classList.add('d-none');
    document.getElementById('professor-area').classList.add('d-none');
    document.getElementById('login-screen').classList.remove('d-none');
    
    // Limpar formulários
    document.getElementById('login-form').reset();
    
    showAlert('Logout realizado com sucesso!', 'info');
}

function checkLoggedUser() {
    if (currentUser) {
        if (currentUser.type === 'aluno') {
            showAlunoArea();
        } else {
            showProfessorArea();
        }
    }
}

// ============================================================================
// ÁREA DO ALUNO
// ============================================================================

function showAlunoArea() {
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('professor-area').classList.add('d-none');
    document.getElementById('aluno-area').classList.remove('d-none');
    
    // Atualizar nome do aluno
    document.getElementById('aluno-name').textContent = currentUser.name;
    
    // Atualizar displays
    updateProgressDisplay();
    updateCertificatesList();
}

function populateActivitySelect() {
    const select = document.getElementById('activity-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione uma atividade...</option>';
    
    atividades.forEach((atividade, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `[Grupo ${atividade.grupo}] ${atividade.nome_atividade}`;
        select.appendChild(option);
    });
}

function updateMaxHours() {
    const select = document.getElementById('activity-select');
    const maxHoursDisplay = document.getElementById('max-hours-display');
    const hoursInput = document.getElementById('requested-hours');
    
    if (select.value) {
        const atividade = atividades[select.value];
        const horasJaValidadas = getValidatedHoursByActivity(currentUser.name, atividade.nome_atividade);
        const horasDisponiveis = atividade.max_horas - horasJaValidadas;
        
        maxHoursDisplay.innerHTML = `${horasDisponiveis}h disponíveis (${horasJaValidadas}/${atividade.max_horas}h usadas)`;
        hoursInput.max = horasDisponiveis;
        hoursInput.value = '';
        
        if (horasDisponiveis <= 0) {
            hoursInput.disabled = true;
            maxHoursDisplay.innerHTML = `<span class="text-danger">Limite da atividade atingido (${atividade.max_horas}h)</span>`;
        } else {
            hoursInput.disabled = false;
        }
    } else {
        maxHoursDisplay.textContent = '-';
        hoursInput.max = '';
        hoursInput.value = '';
        hoursInput.disabled = false;
    }
}

function handleUpload(e) {
    e.preventDefault();
    
    const file = document.getElementById('certificate-file').files[0];
    const description = document.getElementById('certificate-description').value.trim();
    const activityIndex = document.getElementById('activity-select').value;
    const requestedHours = parseInt(document.getElementById('requested-hours').value);
    
    // Validações
    if (!file || !description || !activityIndex || !requestedHours) {
        showAlert('Por favor, preencha todos os campos.', 'warning');
        return;
    }
    
    const atividade = atividades[activityIndex];
    
    // Validar limite da atividade específica
    const horasValidadasAtividade = getValidatedHoursByActivity(currentUser.name, atividade.nome_atividade);
    
    if (horasValidadasAtividade + requestedHours > atividade.max_horas) {
        showAlert(`As horas solicitadas excederiam o limite da atividade "${atividade.nome_atividade}" (${atividade.max_horas}h). Você já tem ${horasValidadasAtividade}h validadas nesta atividade.`, 'danger');
        return;
    }
    
    // Validar limite do grupo
    const grupo = grupos.find(g => g.nome_grupo === atividade.grupo);
    const horasValidadasGrupo = getValidatedHoursByGroup(currentUser.name, atividade.grupo);
    
    if (horasValidadasGrupo + requestedHours > grupo.max_horas) {
        showAlert(`As horas solicitadas excederiam o limite do grupo ${atividade.grupo} (${grupo.max_horas}h). Você já tem ${horasValidadasGrupo}h validadas neste grupo.`, 'danger');
        return;
    }
    
    // Simular leitura do arquivo
    const reader = new FileReader();
    reader.onload = function(e) {
        const certificado = {
            id: generateId(),
            aluno: currentUser.name,
            descricao: description,
            atividade: atividade.nome_atividade,
            grupo: atividade.grupo,
            horasSolicitadas: requestedHours,
            horasValidadas: 0,
            status: 'Pendente',
            comentario: '',
            dataEnvio: new Date().toISOString(),
            arquivo: {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result
            }
        };
        
        certificados.push(certificado);
        saveToLocalStorage();
        
        // Limpar formulário
        document.getElementById('upload-form').reset();
        updateMaxHours();
        
        // Atualizar displays
        updateCertificatesList();
        updateProgressDisplay();
        
        showAlert('Certificado enviado com sucesso!', 'success');
    };
    
    reader.readAsDataURL(file);
}

function updateProgressDisplay() {
    const container = document.getElementById('progress-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Atualizar total geral de horas
    updateTotalHours();
    
    grupos.forEach((grupo, index) => {
        const horasValidadas = getValidatedHoursByGroup(currentUser.name, grupo.nome_grupo);
        const percentage = Math.min((horasValidadas / grupo.max_horas) * 100, 100);
        const atividadesProgresso = getActivityProgress(currentUser.name, grupo.nome_grupo);
        
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        // Criar lista de atividades
        let atividadesHtml = '';
        atividadesProgresso.forEach(atividade => {
            const progressClass = atividade.percentage === 100 ? 'bg-success' : 'bg-info';
            atividadesHtml += `
                <div class="mb-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <small class="text-muted">${atividade.nome.substring(0, 60)}${atividade.nome.length > 60 ? '...' : ''}</small>
                        <small class="fw-bold">${atividade.horasValidadas}/${atividade.maxHoras}h</small>
                    </div>
                    <div class="progress" style="height: 5px;">
                        <div class="progress-bar ${progressClass}" style="width: ${atividade.percentage}%"></div>
                    </div>
                </div>
            `;
        });
        
        col.innerHTML = `
            <div class="progress-group">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">Grupo ${grupo.nome_grupo}: ${grupo.descricao}</h6>
                    <button class="btn btn-outline-secondary btn-sm" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#collapse-${index}">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="progress mb-2">
                    <div class="progress-bar bg-primary" style="width: ${percentage}%">
                        ${horasValidadas}/${grupo.max_horas}h
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <small class="text-muted">${percentage.toFixed(1)}% completo</small>
                    <small class="text-muted">${atividadesProgresso.length} atividades</small>
                </div>
                
                <!-- Detalhes das atividades (colapsável) -->
                <div class="collapse" id="collapse-${index}">
                    <div class="card card-body bg-light">
                        <h6 class="mb-3"><i class="fas fa-list"></i> Progresso por Atividade:</h6>
                        ${atividadesHtml || '<p class="text-muted mb-0">Nenhuma atividade validada ainda.</p>'}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(col);
    });
}

function updateCertificatesList() {
    const container = document.getElementById('certificates-list');
    if (!container) return;
    
    const alunosCertificados = certificados.filter(cert => cert.aluno === currentUser.name);
    
    if (alunosCertificados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-certificate"></i>
                <h5>Nenhum certificado enviado</h5>
                <p>Envie seu primeiro certificado usando o formulário acima.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    alunosCertificados.reverse().forEach(cert => {
        const certDiv = document.createElement('div');
        certDiv.className = 'certificate-item fade-in';
        
        certDiv.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h6><i class="fas fa-certificate"></i> ${cert.descricao}</h6>
                    <p class="mb-1"><strong>Atividade:</strong> ${cert.atividade}</p>
                    <p class="mb-1"><strong>Grupo:</strong> ${cert.grupo}</p>
                    <p class="mb-1"><strong>Data de Envio:</strong> ${formatDate(cert.dataEnvio)}</p>
                    <p class="mb-1"><strong>Horas Solicitadas:</strong> ${cert.horasSolicitadas}h</p>
                    ${cert.status !== 'Pendente' ? `<p class="mb-1"><strong>Horas Validadas:</strong> ${cert.horasValidadas}h</p>` : ''}
                    ${cert.comentario ? `<p class="mb-1"><strong>Comentário:</strong> ${cert.comentario}</p>` : ''}
                </div>
                <div class="col-md-4 text-end">
                    <div class="mb-3">
                        <span class="status-badge status-${cert.status.toLowerCase()}">${cert.status}</span>
                    </div>
                    <div class="certificate-actions">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewCertificate('${cert.id}')">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        ${cert.status === 'Pendente' ? `
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteCertificate('${cert.id}')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(certDiv);
    });
}

// ============================================================================
// ÁREA DO PROFESSOR
// ============================================================================

function showProfessorArea() {
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('aluno-area').classList.add('d-none');
    document.getElementById('professor-area').classList.remove('d-none');
    
    // Atualizar nome do professor
    document.getElementById('professor-name').textContent = currentUser.name;
    
    // Atualizar lista de certificados pendentes
    updatePendingCertificates();
}

function updatePendingCertificates() {
    const container = document.getElementById('pending-certificates');
    if (!container) return;
    
    const pendingCerts = certificados.filter(cert => cert.status === 'Pendente');
    
    if (pendingCerts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <h5>Nenhum certificado pendente</h5>
                <p>Todos os certificados foram avaliados.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    pendingCerts.forEach(cert => {
        const certDiv = document.createElement('div');
        certDiv.className = 'certificate-item fade-in';
        
        certDiv.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-user-graduate"></i> ${cert.aluno}</h6>
                    <p class="mb-1"><strong>Descrição:</strong> ${cert.descricao}</p>
                    <p class="mb-1"><strong>Atividade:</strong> ${cert.atividade}</p>
                    <p class="mb-1"><strong>Grupo:</strong> ${cert.grupo}</p>
                    <p class="mb-1"><strong>Data de Envio:</strong> ${formatDate(cert.dataEnvio)}</p>
                    <p class="mb-1"><strong>Horas Solicitadas:</strong> ${cert.horasSolicitadas}h</p>
                    <button class="btn btn-outline-info btn-sm mt-2" onclick="viewCertificate('${cert.id}')">
                        <i class="fas fa-eye"></i> Ver Certificado
                    </button>
                </div>
                <div class="col-md-6">
                    <div class="validation-form">
                        <div class="mb-3">
                            <label class="form-label">Comentário (opcional)</label>
                            <textarea class="form-control" id="comment-${cert.id}" rows="2" 
                                      placeholder="Adicione um comentário sobre a validação..."></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Horas a Validar</label>
                            <input type="number" class="form-control" id="hours-${cert.id}" 
                                   min="0" max="${cert.horasSolicitadas}" value="${cert.horasSolicitadas}">
                            <small class="form-text text-muted">Máximo: ${cert.horasSolicitadas}h solicitadas</small>
                        </div>
                        <div class="certificate-actions">
                            <button class="btn btn-success" onclick="approveCertificate('${cert.id}')">
                                <i class="fas fa-check"></i> Aprovar
                            </button>
                            <button class="btn btn-danger" onclick="rejectCertificate('${cert.id}')">
                                <i class="fas fa-times"></i> Rejeitar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(certDiv);
    });
}

function approveCertificate(certId) {
    const cert = certificados.find(c => c.id === certId);
    if (!cert) return;
    
    const hoursInput = document.getElementById(`hours-${certId}`);
    const commentInput = document.getElementById(`comment-${certId}`);
    
    const horasValidadas = parseInt(hoursInput.value) || 0;
    const comentario = commentInput.value.trim();
    
    if (horasValidadas < 0 || horasValidadas > cert.horasSolicitadas) {
        showAlert('Horas inválidas. Deve ser entre 0 e as horas solicitadas.', 'danger');
        return;
    }
    
    // Verificar limite da atividade específica
    const atividadeObj = atividades.find(a => a.nome_atividade === cert.atividade);
    const horasJaValidadasAtividade = getValidatedHoursByActivity(cert.aluno, cert.atividade);
    
    if (horasJaValidadasAtividade + horasValidadas > atividadeObj.max_horas) {
        showAlert(`As horas validadas excederiam o limite da atividade "${cert.atividade}" (${atividadeObj.max_horas}h). O aluno já tem ${horasJaValidadasAtividade}h validadas nesta atividade.`, 'danger');
        return;
    }
    
    // Verificar limite do grupo
    const grupo = grupos.find(g => g.nome_grupo === cert.grupo);
    const horasJaValidadas = getValidatedHoursByGroup(cert.aluno, cert.grupo);
    
    if (horasJaValidadas + horasValidadas > grupo.max_horas) {
        showAlert(`As horas validadas excederiam o limite do grupo ${cert.grupo} (${grupo.max_horas}h). O aluno já tem ${horasJaValidadas}h validadas neste grupo.`, 'danger');
        return;
    }
    
    cert.status = 'Aprovado';
    cert.horasValidadas = horasValidadas;
    cert.comentario = comentario;
    cert.dataValidacao = new Date().toISOString();
    cert.validadoPor = currentUser.name;
    
    saveToLocalStorage();
    updatePendingCertificates();
    
    showAlert(`Certificado de ${cert.aluno} aprovado com ${horasValidadas}h validadas.`, 'success');
}

function rejectCertificate(certId) {
    const cert = certificados.find(c => c.id === certId);
    if (!cert) return;
    
    const commentInput = document.getElementById(`comment-${certId}`);
    const comentario = commentInput.value.trim();
    
    if (!comentario) {
        showAlert('Por favor, adicione um comentário explicando a rejeição.', 'warning');
        return;
    }
    
    cert.status = 'Rejeitado';
    cert.horasValidadas = 0;
    cert.comentario = comentario;
    cert.dataValidacao = new Date().toISOString();
    cert.validadoPor = currentUser.name;
    
    saveToLocalStorage();
    updatePendingCertificates();
    
    showAlert(`Certificado de ${cert.aluno} rejeitado.`, 'info');
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
}

function getValidatedHoursByGroup(aluno, grupo) {
    return certificados
        .filter(cert => cert.aluno === aluno && cert.grupo === grupo && cert.status === 'Aprovado')
        .reduce((total, cert) => total + cert.horasValidadas, 0);
}

function getValidatedHoursByActivity(aluno, atividade) {
    return certificados
        .filter(cert => cert.aluno === aluno && cert.atividade === atividade && cert.status === 'Aprovado')
        .reduce((total, cert) => total + cert.horasValidadas, 0);
}

function getActivityProgress(aluno, grupo) {
    const atividadesDoGrupo = atividades.filter(ativ => ativ.grupo === grupo);
    return atividadesDoGrupo.map(atividade => {
        const horasValidadas = getValidatedHoursByActivity(aluno, atividade.nome_atividade);
        return {
            nome: atividade.nome_atividade,
            horasValidadas: horasValidadas,
            maxHoras: atividade.max_horas,
            percentage: Math.min((horasValidadas / atividade.max_horas) * 100, 100)
        };
    });
}

function viewCertificate(certId) {
    const cert = certificados.find(c => c.id === certId);
    if (!cert) return;
    
    const viewer = document.getElementById('certificate-viewer');
    const modal = new bootstrap.Modal(document.getElementById('viewCertificateModal'));
    
    if (cert.arquivo.type.startsWith('image/')) {
        viewer.innerHTML = `
            <img src="${cert.arquivo.data}" alt="Certificado" class="img-fluid">
            <div class="mt-3">
                <strong>Arquivo:</strong> ${cert.arquivo.name} (${(cert.arquivo.size / 1024).toFixed(1)} KB)
            </div>
        `;
    } else if (cert.arquivo.type === 'application/pdf') {
        viewer.innerHTML = `
            <iframe src="${cert.arquivo.data}"></iframe>
            <div class="mt-3">
                <strong>Arquivo:</strong> ${cert.arquivo.name} (${(cert.arquivo.size / 1024).toFixed(1)} KB)
                <br>
                <a href="${cert.arquivo.data}" download="${cert.arquivo.name}" class="btn btn-primary btn-sm mt-2">
                    <i class="fas fa-download"></i> Baixar PDF
                </a>
            </div>
        `;
    } else {
        viewer.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-file fa-3x text-muted mb-3"></i>
                <h5>Arquivo: ${cert.arquivo.name}</h5>
                <p>Tipo: ${cert.arquivo.type}</p>
                <p>Tamanho: ${(cert.arquivo.size / 1024).toFixed(1)} KB</p>
                <a href="${cert.arquivo.data}" download="${cert.arquivo.name}" class="btn btn-primary">
                    <i class="fas fa-download"></i> Baixar Arquivo
                </a>
            </div>
        `;
    }
    
    modal.show();
}

function deleteCertificate(certId) {
    if (!confirm('Tem certeza que deseja excluir este certificado?')) return;
    
    const index = certificados.findIndex(c => c.id === certId);
    if (index > -1) {
        certificados.splice(index, 1);
        saveToLocalStorage();
        updateCertificatesList();
        updateProgressDisplay();
        showAlert('Certificado excluído com sucesso.', 'info');
    }
}

function showAlert(message, type = 'info') {
    // Remover alertas existentes
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Criar novo alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (alert && alert.parentNode) {
            alert.remove();
        }
    }, 5000);
} 