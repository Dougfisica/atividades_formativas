// ============================================================================
// SISTEMA DE VALIDAÇÃO DE CERTIFICADOS - Versão 100% GRATUITA
// Firebase Auth + Firestore + Base64 (sem Firebase Storage)
// ============================================================================

// Importações Firebase (apenas Auth e Firestore)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    setDoc, 
    getDoc,
    query, 
    where, 
    orderBy, 
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================================================
// CONFIGURAÇÃO FIREBASE (SUBSTITUA pelos seus valores)
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBkyMYpvmjBvhVUde-sjAXbUEfSZY6GrFw",
  authDomain: "afagricola-3680e.firebaseapp.com",
  projectId: "afagricola-3680e",
  storageBucket: "afagricola-3680e.firebasestorage.app",
  messagingSenderId: "396313868819",
  appId: "1:396313868819:web:aad66219db855ea3d45de6",
  measurementId: "G-VW2PS0YZJM"
};

// Inicializar Firebase (apenas Auth e Firestore)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let currentUser = null;
let currentUserData = null;
let atividades = [];
let grupos = [];
let certificados = [];
let unsubscribeCertificados = null;

// Limites para arquivos (Base64)
const MAX_FILE_SIZE = 800000; // 800KB
const SUPPORTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadConfigData();
    
    // Monitorar estado de autenticação
    onAuthStateChanged(auth, async (user) => {
        document.getElementById('loading-screen').classList.add('d-none');
        
        if (user) {
            currentUser = user;
            await loadUserData(user.uid);
            initializeUserArea();
        } else {
            currentUser = null;
            currentUserData = null;
            showLogin();
        }
    });
});

// ============================================================================
// CARREGAMENTO DE DADOS
// ============================================================================

async function loadConfigData() {
    try {
        // Carregar atividades do Firestore
        const atividadesSnapshot = await getDocs(collection(db, 'atividades'));
        if (atividadesSnapshot.empty) {
            // Se não existir, criar a partir do JSON local
            await initializeConfigData();
        } else {
            atividades = atividadesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        
        // Carregar grupos do Firestore
        const gruposSnapshot = await getDocs(collection(db, 'grupos'));
        if (gruposSnapshot.empty) {
            await initializeConfigData();
        } else {
            grupos = gruposSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        
        populateActivitySelect();
    } catch (error) {
        console.error('Erro ao carregar dados de configuração:', error);
        await loadLocalConfigData();
    }
}

async function initializeConfigData() {
    try {
        const atividadesResponse = await fetch('./atividades_AG.json');
        const atividadesLocal = await atividadesResponse.json();
        
        const gruposResponse = await fetch('./grupos_AG.json');
        const gruposLocal = await gruposResponse.json();
        
        // Salvar no Firestore
        for (const atividade of atividadesLocal) {
            await addDoc(collection(db, 'atividades'), atividade);
        }
        
        for (const grupo of gruposLocal) {
            await addDoc(collection(db, 'grupos'), grupo);
        }
        
        atividades = atividadesLocal;
        grupos = gruposLocal;
        
        console.log('Dados de configuração inicializados no Firestore');
    } catch (error) {
        console.error('Erro ao inicializar dados de configuração:', error);
    }
}

async function loadLocalConfigData() {
    try {
        const atividadesResponse = await fetch('./atividades_AG.json');
        atividades = await atividadesResponse.json();
        
        const gruposResponse = await fetch('./grupos_AG.json');
        grupos = await gruposResponse.json();
        
        populateActivitySelect();
    } catch (error) {
        console.error('Erro ao carregar dados locais:', error);
    }
}

async function loadUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            currentUserData = userDoc.data();
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// ============================================================================
// FUNÇÕES DE ARQUIVO BASE64
// ============================================================================

function compressImage(file, maxSizeKB, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Calcular dimensões mantendo proporção
            let { width, height } = img;
            const maxDimension = 1200; // pixels
            
            if (width > height && width > maxDimension) {
                height = (height * maxDimension) / width;
                width = maxDimension;
            } else if (height > maxDimension) {
                width = (width * maxDimension) / height;
                height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Desenhar imagem comprimida
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converter para blob
            canvas.toBlob((blob) => {
                if (blob.size <= maxSizeKB * 1024) {
                    resolve(blob);
                } else if (quality > 0.1) {
                    // Tentar com qualidade menor
                    compressImage(file, maxSizeKB, quality - 0.1).then(resolve);
                } else {
                    resolve(blob); // Retornar mesmo se ainda grande
                }
            }, file.type, quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function processFile(file) {
    // Validar tipo
    if (!SUPPORTED_TYPES.includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Use PDF, JPG ou PNG.');
    }
    
    let processedFile = file;
    
    // Se for imagem e muito grande, comprimir
    if (file.type.startsWith('image/') && file.size > MAX_FILE_SIZE) {
        console.log('Comprimindo imagem...');
        processedFile = await compressImage(file, MAX_FILE_SIZE / 1024);
        
        if (processedFile.size > MAX_FILE_SIZE) {
            throw new Error(`Arquivo muito grande (${(processedFile.size/1024).toFixed(0)}KB). Máximo: ${MAX_FILE_SIZE/1024}KB. Tente uma imagem com menor resolução.`);
        }
    } else if (file.size > MAX_FILE_SIZE) {
        throw new Error(`Arquivo muito grande (${(file.size/1024).toFixed(0)}KB). Máximo: ${MAX_FILE_SIZE/1024}KB.`);
    }
    
    // Converter para Base64
    const base64 = await fileToBase64(processedFile);
    
    return {
        name: file.name,
        type: file.type,
        size: processedFile.size,
        data: base64
    };
}

// ============================================================================
// AUTENTICAÇÃO (igual ao anterior)
// ============================================================================

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    const activitySelect = document.getElementById('activity-select');
    if (activitySelect) {
        activitySelect.addEventListener('change', updateMaxHours);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert('Login realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro no login:', error);
        showAlert(getErrorMessage(error.code), 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const userType = document.getElementById('register-user-type').value;
    
    if (!name || !email || !password || !userType) {
        showAlert('Por favor, preencha todos os campos.', 'warning');
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            type: userType,
            createdAt: new Date().toISOString()
        });
        
        showAlert('Conta criada com sucesso!', 'success');
        showLogin();
    } catch (error) {
        console.error('Erro no registro:', error);
        showAlert(getErrorMessage(error.code), 'danger');
    }
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Este e-mail já está em uso.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/operation-not-allowed': 'Operação não permitida.',
        'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
        'auth/user-disabled': 'Esta conta foi desabilitada.',
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.'
    };
    
    return errorMessages[errorCode] || 'Erro desconhecido. Tente novamente.';
}

async function logout() {
    try {
        if (unsubscribeCertificados) {
            unsubscribeCertificados();
        }
        
        await signOut(auth);
        showAlert('Logout realizado com sucesso!', 'info');
    } catch (error) {
        console.error('Erro no logout:', error);
        showAlert('Erro ao fazer logout.', 'danger');
    }
}

// ============================================================================
// UPLOAD DE CERTIFICADOS (MODIFICADO PARA BASE64)
// ============================================================================

async function handleUpload(e) {
    e.preventDefault();
    
    const file = document.getElementById('certificate-file').files[0];
    const description = document.getElementById('certificate-description').value.trim();
    const activityIndex = document.getElementById('activity-select').value;
    const requestedHours = parseInt(document.getElementById('requested-hours').value);
    
    if (!file || !description || !activityIndex || !requestedHours) {
        showAlert('Por favor, preencha todos os campos.', 'warning');
        return;
    }
    
    const atividade = atividades[activityIndex];
    
    // Validar limites
    const horasValidadasAtividade = getValidatedHoursByActivity(currentUser.uid, atividade.nome_atividade);
    if (horasValidadasAtividade + requestedHours > atividade.max_horas) {
        showAlert(`As horas solicitadas excederiam o limite da atividade "${atividade.nome_atividade}" (${atividade.max_horas}h). Você já tem ${horasValidadasAtividade}h validadas nesta atividade.`, 'danger');
        return;
    }
    
    const grupo = grupos.find(g => g.nome_grupo === atividade.grupo);
    const horasValidadasGrupo = getValidatedHoursByGroup(currentUser.uid, atividade.grupo);
    if (horasValidadasGrupo + requestedHours > grupo.max_horas) {
        showAlert(`As horas solicitadas excederiam o limite do grupo ${atividade.grupo} (${grupo.max_horas}h). Você já tem ${horasValidadasGrupo}h validadas neste grupo.`, 'danger');
        return;
    }
    
    try {
        // Mostrar spinner
        const spinner = document.querySelector('.upload-spinner');
        spinner.classList.remove('d-none');
        
        // Processar arquivo (compressão + Base64)
        const fileData = await processFile(file);
        
        // Criar documento do certificado
        const certificadoData = {
            userId: currentUser.uid,
            userName: currentUserData.name,
            userEmail: currentUser.email,
            descricao: description,
            atividade: atividade.nome_atividade,
            grupo: atividade.grupo,
            horasSolicitadas: requestedHours,
            horasValidadas: 0,
            status: 'Pendente',
            comentario: '',
            dataEnvio: new Date().toISOString(),
            arquivo: fileData // Base64 aqui
        };
        
        await addDoc(collection(db, 'certificados'), certificadoData);
        
        // Limpar formulário
        document.getElementById('upload-form').reset();
        updateMaxHours();
        
        showAlert(`Certificado enviado com sucesso! (${(fileData.size/1024).toFixed(0)}KB)`, 'success');
    } catch (error) {
        console.error('Erro ao enviar certificado:', error);
        showAlert(error.message || 'Erro ao enviar certificado. Tente novamente.', 'danger');
    } finally {
        const spinner = document.querySelector('.upload-spinner');
        spinner.classList.add('d-none');
    }
}

// ============================================================================
// VISUALIZAÇÃO DE CERTIFICADOS (MODIFICADO PARA BASE64)
// ============================================================================

async function viewCertificateFirebase(certId) {
    const cert = certificados.find(c => c.id === certId);
    if (!cert) return;
    
    const viewer = document.getElementById('certificate-viewer');
    const modal = new bootstrap.Modal(document.getElementById('viewCertificateModal'));
    
    viewer.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
        </div>
    `;
    
    if (cert.arquivo.type.startsWith('image/')) {
        viewer.innerHTML = `
            <img src="${cert.arquivo.data}" alt="Certificado" class="img-fluid">
            <div class="mt-3">
                <strong>Arquivo:</strong> ${cert.arquivo.name} (${(cert.arquivo.size / 1024).toFixed(1)} KB)
            </div>
        `;
    } else if (cert.arquivo.type === 'application/pdf') {
        viewer.innerHTML = `
            <embed src="${cert.arquivo.data}" type="application/pdf" width="100%" height="600px">
            <div class="mt-3">
                <strong>Arquivo:</strong> ${cert.arquivo.name} (${(cert.arquivo.size / 1024).toFixed(1)} KB)
                <br>
                <a href="${cert.arquivo.data}" target="_blank" class="btn btn-primary btn-sm mt-2">
                    <i class="fas fa-external-link-alt"></i> Abrir em Nova Aba
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
                <a href="${cert.arquivo.data}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i> Abrir Arquivo
                </a>
            </div>
        `;
    }
    
    modal.show();
}

// ============================================================================
// RESTO DAS FUNÇÕES (iguais ao script anterior)
// ============================================================================

// Navegação entre telas
function showLogin() {
    hideAllScreens();
    document.getElementById('login-screen').classList.remove('d-none');
}

function showRegister() {
    hideAllScreens();
    document.getElementById('register-screen').classList.remove('d-none');
}

function hideAllScreens() {
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('register-screen').classList.add('d-none');
    document.getElementById('aluno-area').classList.add('d-none');
    document.getElementById('professor-area').classList.add('d-none');
}

function initializeUserArea() {
    if (!currentUser || !currentUserData) return;
    
    if (currentUserData.type === 'aluno') {
        showAlunoArea();
    } else if (currentUserData.type === 'professor') {
        showProfessorArea();
    }
    
    startListeningToCertificados();
}

function startListeningToCertificados() {
    if (unsubscribeCertificados) {
        unsubscribeCertificados();
    }
    
    const certificadosRef = collection(db, 'certificados');
    unsubscribeCertificados = onSnapshot(certificadosRef, (snapshot) => {
        certificados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (currentUserData.type === 'aluno') {
            updateProgressDisplay();
            updateCertificatesList();
        } else if (currentUserData.type === 'professor') {
            updatePendingCertificates();
        }
    });
}

function showAlunoArea() {
    hideAllScreens();
    document.getElementById('aluno-area').classList.remove('d-none');
    document.getElementById('aluno-name').textContent = currentUserData.name;
    
    updateProgressDisplay();
    updateCertificatesList();
}

function populateActivitySelect() {
    const select = document.getElementById('activity-select');
    if (!select || !atividades.length) return;
    
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
    
    if (!currentUser || !select.value) {
        maxHoursDisplay.textContent = '-';
        hoursInput.max = '';
        hoursInput.value = '';
        hoursInput.disabled = false;
        return;
    }
    
    const atividade = atividades[select.value];
    const horasJaValidadas = getValidatedHoursByActivity(currentUser.uid, atividade.nome_atividade);
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
}

function showProfessorArea() {
    hideAllScreens();
    document.getElementById('professor-area').classList.remove('d-none');
    document.getElementById('professor-name').textContent = currentUserData.name;
    
    updatePendingCertificates();
}

async function approveCertificate(certId) {
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
    
    const atividadeObj = atividades.find(a => a.nome_atividade === cert.atividade);
    const horasJaValidadasAtividade = getValidatedHoursByActivity(cert.userId, cert.atividade);
    
    if (horasJaValidadasAtividade + horasValidadas > atividadeObj.max_horas) {
        showAlert(`As horas validadas excederiam o limite da atividade "${cert.atividade}" (${atividadeObj.max_horas}h). O aluno já tem ${horasJaValidadasAtividade}h validadas nesta atividade.`, 'danger');
        return;
    }
    
    const grupo = grupos.find(g => g.nome_grupo === cert.grupo);
    const horasJaValidadas = getValidatedHoursByGroup(cert.userId, cert.grupo);
    
    if (horasJaValidadas + horasValidadas > grupo.max_horas) {
        showAlert(`As horas validadas excederiam o limite do grupo ${cert.grupo} (${grupo.max_horas}h). O aluno já tem ${horasJaValidadas}h validadas neste grupo.`, 'danger');
        return;
    }
    
    try {
        await updateDoc(doc(db, 'certificados', certId), {
            status: 'Aprovado',
            horasValidadas: horasValidadas,
            comentario: comentario,
            dataValidacao: new Date().toISOString(),
            validadoPor: currentUserData.name
        });
        
        showAlert(`Certificado de ${cert.userName} aprovado com ${horasValidadas}h validadas.`, 'success');
    } catch (error) {
        console.error('Erro ao aprovar certificado:', error);
        showAlert('Erro ao aprovar certificado.', 'danger');
    }
}

async function rejectCertificate(certId) {
    const cert = certificados.find(c => c.id === certId);
    if (!cert) return;
    
    const commentInput = document.getElementById(`comment-${certId}`);
    const comentario = commentInput.value.trim();
    
    if (!comentario) {
        showAlert('Por favor, adicione um comentário explicando a rejeição.', 'warning');
        return;
    }
    
    try {
        await updateDoc(doc(db, 'certificados', certId), {
            status: 'Rejeitado',
            horasValidadas: 0,
            comentario: comentario,
            dataValidacao: new Date().toISOString(),
            validadoPor: currentUserData.name
        });
        
        showAlert(`Certificado de ${cert.userName} rejeitado.`, 'info');
    } catch (error) {
        console.error('Erro ao rejeitar certificado:', error);
        showAlert('Erro ao rejeitar certificado.', 'danger');
    }
}

async function deleteCertificateFirebase(certId) {
    if (!confirm('Tem certeza que deseja excluir este certificado?')) return;
    
    try {
        await deleteDoc(doc(db, 'certificados', certId));
        showAlert('Certificado excluído com sucesso.', 'info');
    } catch (error) {
        console.error('Erro ao excluir certificado:', error);
        showAlert('Erro ao excluir certificado.', 'danger');
    }
}

// Funções auxiliares (mantidas do script original)
function getValidatedHoursByGroup(userId, grupo) {
    return certificados
        .filter(cert => cert.userId === userId && cert.grupo === grupo && cert.status === 'Aprovado')
        .reduce((total, cert) => total + cert.horasValidadas, 0);
}

function getValidatedHoursByActivity(userId, atividade) {
    return certificados
        .filter(cert => cert.userId === userId && cert.atividade === atividade && cert.status === 'Aprovado')
        .reduce((total, cert) => total + cert.horasValidadas, 0);
}

function getActivityProgress(userId, grupo) {
    const atividadesDoGrupo = atividades.filter(ativ => ativ.grupo === grupo);
    return atividadesDoGrupo.map(atividade => {
        const horasValidadas = getValidatedHoursByActivity(userId, atividade.nome_atividade);
        return {
            nome: atividade.nome_atividade,
            horasValidadas: horasValidadas,
            maxHoras: atividade.max_horas,
            percentage: Math.min((horasValidadas / atividade.max_horas) * 100, 100)
        };
    });
}

function updateTotalHours() {
    const totalElement = document.getElementById('total-hours');
    if (!totalElement || !currentUser || currentUserData.type !== 'aluno') return;
    
    const totalHoras = certificados
        .filter(cert => cert.userId === currentUser.uid && cert.status === 'Aprovado')
        .reduce((total, cert) => total + cert.horasValidadas, 0);
    
    totalElement.textContent = `${totalHoras}h`;
}

function updateProgressDisplay() {
    const container = document.getElementById('progress-container');
    if (!container || !currentUser) return;
    
    container.innerHTML = '';
    updateTotalHours();
    
    grupos.forEach((grupo, index) => {
        const horasValidadas = getValidatedHoursByGroup(currentUser.uid, grupo.nome_grupo);
        const percentage = Math.min((horasValidadas / grupo.max_horas) * 100, 100);
        const atividadesProgresso = getActivityProgress(currentUser.uid, grupo.nome_grupo);
        
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
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
    if (!container || !currentUser) return;
    
    const alunosCertificados = certificados.filter(cert => cert.userId === currentUser.uid);
    
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
                    <p class="mb-1"><strong>Tamanho:</strong> ${(cert.arquivo.size/1024).toFixed(0)}KB</p>
                    ${cert.status !== 'Pendente' ? `<p class="mb-1"><strong>Horas Validadas:</strong> ${cert.horasValidadas}h</p>` : ''}
                    ${cert.comentario ? `<p class="mb-1"><strong>Comentário:</strong> ${cert.comentario}</p>` : ''}
                </div>
                <div class="col-md-4 text-end">
                    <div class="mb-3">
                        <span class="status-badge status-${cert.status.toLowerCase()}">${cert.status}</span>
                    </div>
                    <div class="certificate-actions">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewCertificateFirebase('${cert.id}')">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        ${cert.status === 'Pendente' ? `
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteCertificateFirebase('${cert.id}')">
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
                    <h6><i class="fas fa-user-graduate"></i> ${cert.userName}</h6>
                    <p class="mb-1"><strong>Descrição:</strong> ${cert.descricao}</p>
                    <p class="mb-1"><strong>Atividade:</strong> ${cert.atividade}</p>
                    <p class="mb-1"><strong>Grupo:</strong> ${cert.grupo}</p>
                    <p class="mb-1"><strong>Data de Envio:</strong> ${formatDate(cert.dataEnvio)}</p>
                    <p class="mb-1"><strong>Horas Solicitadas:</strong> ${cert.horasSolicitadas}h</p>
                    <p class="mb-1"><strong>Tamanho:</strong> ${(cert.arquivo.size/1024).toFixed(0)}KB</p>
                    <button class="btn btn-outline-info btn-sm mt-2" onclick="viewCertificateFirebase('${cert.id}')">
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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
}

function showAlert(message, type = 'info') {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert && alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Expor funções globalmente
window.showLogin = showLogin;
window.showRegister = showRegister;
window.logout = logout;
window.approveCertificate = approveCertificate;
window.rejectCertificate = rejectCertificate;
window.viewCertificateFirebase = viewCertificateFirebase;
window.deleteCertificateFirebase = deleteCertificateFirebase;

console.log('Firebase script gratuito carregado'); 