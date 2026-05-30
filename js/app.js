// Importa Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Configuração do Supabase (injetada via variáveis de ambiente)
const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

// Inicializa cliente Supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let isPremium = false;
let allJobs = [];

/**
 * Inicializa a aplicação
 */
async function initApp() {
    try {
        // Verifica sessão atual
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            await loadUserProfile();
        }
        
        console.log('✅ Supabase inicializado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
    }
    
    // Carrega vagas
    await loadJobs();
    
    // Mostra tela inicial
    showScreen('landing');
}

/**
 * Carrega perfil do usuário
 */
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('is_premium')
            .eq('id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        isPremium = data?.is_premium || false;
        updateUserInfoBar();
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        isPremium = false;
    }
}

/**
 * Atualiza barra de informações do usuário
 */
function updateUserInfoBar() {
    const userEmail = document.getElementById('userEmail');
    const userStatus = document.getElementById('userStatus');
    
    if (currentUser) {
        userEmail.textContent = currentUser.email;
        
        if (isPremium) {
            userStatus.textContent = '👑 Premium';
            userStatus.className = 'ml-2 px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
        } else {
            userStatus.textContent = 'Gratuito';
            userStatus.className = 'ml-2 px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-green-400 to-green-600 text-white';
        }
    }
}

/**
 * Alterna entre telas
 */
function showScreen(screenName) {
    // Esconde todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Mostra a tela desejada
    const targetScreen = document.getElementById(`${screenName}Screen`);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('fade-in');
    }
    
    // Fecha menu mobile se estiver aberto
    document.getElementById('mobileMenu').classList.add('hidden');
    
    // Se for dashboard, carrega vagas
    if (screenName === 'dashboard') {
        loadJobsForDashboard();
    }
}

/**
 * Toggle menu mobile
 */
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('hidden');
}

/**
 * Carrega vagas do banco
 */
async function loadJobs() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    try {
        const { data, error } = await supabaseClient
            .from('vagas')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allJobs = data || [];
        
        loadingState.classList.add('hidden');
        
        if (allJobs.length === 0) {
            emptyState.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Erro ao carregar vagas:', error);
        allJobs = [];
        loadingState.classList.add('hidden');
    }
}

/**
 * Carrega vagas para o dashboard (com lógica de autenticação)
 */
async function loadJobsForDashboard() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    try {
        if (currentUser) {
            // Usuário autenticado - carrega vagas reais do banco
            const { data, error } = await supabaseClient
                .from('vagas')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            allJobs = data || [];
        } else {
            // Usuário não autenticado - carrega vagas do banco (mostra todas)
            const { data, error } = await supabaseClient
                .from('vagas')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            allJobs = data || [];
        }
        
        loadingState.classList.add('hidden');
        
        if (allJobs.length === 0) {
            emptyState.classList.remove('hidden');
        }
        
        // Renderiza vagas iniciais (sem filtro)
        renderInitialJobs();
    } catch (error) {
        console.error('Erro ao carregar vagas:', error);
        allJobs = [];
        loadingState.classList.add('hidden');
        renderInitialJobs();
    }
}

/**
 * Renderiza vagas iniciais (para usuários não autenticados)
 */
function renderInitialJobs() {
    const jobsList = document.getElementById('jobsList');
    jobsList.innerHTML = '';
    
    // Mostra apenas 3 vagas de exemplo para gerar desejo
    const sampleJobs = allJobs.slice(0, 3);
    
    sampleJobs.forEach(job => {
        const isLocked = job.is_premium && !isPremium;
        const jobCard = createJobCard(job, isLocked);
        jobsList.appendChild(jobCard);
    });
    
    // Adiciona mensagem de incentivo para usuários não autenticados
    if (!currentUser) {
        const incentiveDiv = document.createElement('div');
        incentiveDiv.className = 'text-center py-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl mt-6';
        incentiveDiv.innerHTML = `
            <p class="text-gray-600 mb-4">🔍 <strong>Crie sua conta gratuita</strong> para buscar vagas personalizadas e acessar todas as oportunidades!</p>
            <button onclick="showRequiredSignupModal()" class="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition">
                Criar Conta Grátis
            </button>
        `;
        jobsList.appendChild(incentiveDiv);
    }
}

/**
 * Verifica se usuário está autenticado antes de permitir ações
 */
function requireAuth(callback) {
    if (!currentUser) {
        showRequiredSignupModal();
        return false;
    }
    return true;
}

/**
 * Mostra modal de cadastro obrigatório
 */
function showRequiredSignupModal() {
    const modal = document.getElementById('requiredSignupModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Fecha modal de cadastro obrigatório
 */
function closeRequiredSignupModal() {
    const modal = document.getElementById('requiredSignupModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * Alias para fechar modal (compatibilidade com HTML)
 */
function closeRequiredModal() {
    closeRequiredSignupModal();
}

/**
 * Manipula cadastro do modal obrigatório
 */
async function handleRequiredSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('requiredSignupEmail').value;
    const password = document.getElementById('requiredSignupPassword').value;
    const passwordConfirm = document.getElementById('requiredSignupPasswordConfirm').value;
    
    if (password !== passwordConfirm) {
        showToast('As senhas não coincidem', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        await loadUserProfile();
        updateUserInfoBar();
        
        showToast('Cadastro realizado! Bem-vinda ao WorkMOM!', 'success');
        closeRequiredSignupModal();
        
        // Recarrega vagas do banco e executa busca
        await loadJobsForDashboard();
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showToast('Erro ao criar conta. Tente novamente.', 'error');
    }
}

/**
 * Filtra vagas baseado no status do usuário e filtros selecionados
 */
function filterJobs() {
    // Verifica autenticação antes de permitir busca
    if (!requireAuth()) return;
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterType = document.getElementById('filterPremium').value;
    const jobsList = document.getElementById('jobsList');
    
    // Calcula limite de 48 horas para usuários gratuitos
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    // Filtra vagas
    let filteredJobs = allJobs.filter(job => {
        // Filtro de busca
        const matchesSearch = !searchTerm || 
            job.titulo.toLowerCase().includes(searchTerm) ||
            job.empresa.toLowerCase().includes(searchTerm) ||
            job.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        // Filtro de tipo (premium/free)
        let matchesType = true;
        if (filterType === 'premium') matchesType = job.is_premium;
        if (filterType === 'free') matchesType = !job.is_premium;
        
        // Paywall: usuários gratuitos só veem vagas com mais de 48h
        let canView = true;
        if (!isPremium) {
            const jobDate = new Date(job.created_at);
            canView = jobDate < fortyEightHoursAgo;
        }
        
        return matchesSearch && matchesType && canView;
    });
    
    // Renderiza vagas
    renderJobs(filteredJobs);
}

/**
 * Renderiza lista de vagas
 */
function renderJobs(jobs) {
    const jobsList = document.getElementById('jobsList');
    jobsList.innerHTML = '';
    
    if (jobs.length === 0) {
        jobsList.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-600 text-xl">Nenhuma vaga encontrada com os filtros atuais</p>
            </div>
        `;
        return;
    }
    
    jobs.forEach(job => {
        const isLocked = job.is_premium && !isPremium;
        const jobCard = createJobCard(job, isLocked);
        jobsList.appendChild(jobCard);
    });
}

/**
 * Cria card de vaga
 */
function createJobCard(job, isLocked) {
    const card = document.createElement('div');
    card.className = `job-card bg-white rounded-xl shadow-lg p-6 ${job.is_premium ? 'premium' : 'free'}`;
    
    const createdAt = new Date(job.created_at).toLocaleDateString('pt-BR');
    const tagsHtml = job.tags.map(tag => 
        `<span class="job-tag inline-block bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm mr-2 mb-2">${tag}</span>`
    ).join('');
    
    const benefitsHtml = job.beneficios.length > 0 ? `
        <div class="mt-4">
            <p class="text-sm text-gray-600 mb-2"><i class="fas fa-gift text-pink-600 mr-2"></i>Benefícios:</p>
            <div class="flex flex-wrap gap-2">
                ${job.beneficios.map(benefit => 
                    `<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">${benefit}</span>`
                ).join('')}
            </div>
        </div>
    ` : '';
    
    if (isLocked) {
        // Vaga bloqueada (paywall)
        card.innerHTML = `
            <div class="paywall-overlay">
                <div class="blur-effect">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800 mb-2">?????????</h3>
                            <p class="text-gray-600">Empresa Confidencial</p>
                        </div>
                        <span class="status-badge premium px-3 py-1 rounded-full text-white text-sm font-semibold">
                            <i class="fas fa-crown mr-1"></i>Premium
                        </span>
                    </div>
                    <div class="mb-4">
                        <p class="text-gray-500 line-clamp-3">Esta vaga contém informações exclusivas para assinantes premium...</p>
                    </div>
                    <div class="mb-4">
                        ${tagsHtml}
                    </div>
                    <p class="text-sm text-gray-400">Publicada em: ${createdAt}</p>
                </div>
                <div class="paywall-lock">
                    <i class="fas fa-lock text-4xl text-pink-600 mb-4"></i>
                    <h4 class="text-lg font-bold text-gray-800 mb-2">Vaga Premium</h4>
                    <p class="text-gray-600 mb-4">Desbloqueie todas as vagas recentes</p>
                    <button onclick="openPremiumCheckout()" class="btn-premium w-full px-6 py-3 rounded-lg">
                        Assinar Premium por R$ 14,90
                    </button>
                </div>
            </div>
        `;
    } else {
        // Vaga desbloqueada
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${job.titulo}</h3>
                    <p class="text-gray-600"><i class="fas fa-building mr-2"></i>${job.empresa}</p>
                </div>
                <span class="status-badge ${job.is_premium ? 'premium' : 'free'} px-3 py-1 rounded-full text-white text-sm font-semibold">
                    ${job.is_premium ? '<i class="fas fa-crown mr-1"></i>Premium' : 'Gratuita'}
                </span>
            </div>
            
            <p class="text-gray-600 mb-4 line-clamp-3">${job.detalhes}</p>
            
            <div class="mb-4">
                ${tagsHtml}
            </div>
            
            ${benefitsHtml}
            
            <div class="flex justify-between items-center mt-6">
                <p class="text-sm text-gray-400"><i class="fas fa-calendar mr-1"></i>${createdAt}</p>
                <button onclick="handleJobClick('${job.link_original}')" 
                   class="btn-primary bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition">
                    <i class="fas fa-external-link-alt mr-2"></i>Candidatar-se
                </button>
            </div>
        `;
    }
    
    return card;
}

/**
 * Intercepta clique em botão de vaga
 */
function handleJobClick(url) {
    if (!requireAuth()) return;
    window.open(url, '_blank');
}

/**
 * Abre checkout da Kiwify
 */
function openPremiumCheckout() {
    const checkoutUrl = 'https://pay.kiwify.com.br/BFdGdnt';
    window.open(checkoutUrl, '_blank');
}

/**
 * Manipula login
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        await loadUserProfile();
        
        showToast('Login realizado com sucesso!', 'success');
        showScreen('dashboard');
    } catch (error) {
        console.error('Erro no login:', error);
        showToast('Erro ao fazer login. Verifique suas credenciais.', 'error');
    }
}

/**
 * Manipula registro
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    if (password !== passwordConfirm) {
        showToast('As senhas não coincidem', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        showToast('Cadastro realizado! Verifique seu e-mail para confirmar.', 'success');
        showScreen('login');
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showToast('Erro ao criar conta. Tente novamente.', 'error');
    }
}

/**
 * Manipula logout
 */
async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        
        currentUser = null;
        isPremium = false;
        showToast('Logout realizado com sucesso', 'success');
        showScreen('landing');
    } catch (error) {
        console.error('Erro no logout:', error);
        showToast('Erro ao fazer logout', 'error');
    }
}

/**
 * Mostra toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast fixed top-4 right-4 px-6 py-4 rounded-lg shadow-xl z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Expõe funções para o window object (para eventos onclick)
window.showScreen = showScreen;
window.toggleMobileMenu = toggleMobileMenu;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.filterJobs = filterJobs;
window.openPremiumCheckout = openPremiumCheckout;
window.showRequiredSignupModal = showRequiredSignupModal;
window.closeRequiredModal = closeRequiredModal;
window.closeRequiredSignupModal = closeRequiredSignupModal;
window.handleRequiredSignup = handleRequiredSignup;
window.handleJobClick = handleJobClick;

// Inicializa aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupAuthInterceptors();
});

/**
 * Configura interceptores para ações que requerem autenticação
 */
function setupAuthInterceptors() {
    // Intercepta input de busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            if (!currentUser) {
                searchInput.blur();
                showRequiredSignupModal();
            }
        });
        
        searchInput.addEventListener('input', (e) => {
            if (!currentUser) {
                e.preventDefault();
                e.stopPropagation();
                showRequiredSignupModal();
                searchInput.value = '';
            }
        });
    }
    
    // Intercepta select de filtro
    const filterSelect = document.getElementById('filterPremium');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            if (!currentUser) {
                e.preventDefault();
                e.stopPropagation();
                showRequiredSignupModal();
                filterSelect.value = 'all';
            }
        });
    }
}
