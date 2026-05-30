require('dotenv').config();
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// Inicializa Supabase com SERVICE_ROLE_KEY (chave master para operações administrativas)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Termos de busca para vagas home office
const SEARCH_TERMS = [
    'Home Office',
    'Remoto',
    'Meio Período',
    'Auxílio Creche',
    'Trabalho Remoto',
    'Homeoffice'
];

// Termos que classificam uma vaga como premium
const PREMIUM_KEYWORDS = [
    'auxílio creche',
    'horário flexível',
    'auxílio babá',
    'carga reduzida',
    'flexível',
    'creche',
    'babá',
    'part-time',
    'meio período'
];

/**
 * Classifica se uma vaga é premium baseado na descrição
 */
function classifyAsPremium(description) {
    if (!description) return false;
    
    const lowerDescription = description.toLowerCase();
    return PREMIUM_KEYWORDS.some(keyword => 
        lowerDescription.includes(keyword)
    );
}

/**
 * Extrai informações de uma vaga de uma página
 */
async function extractJobInfo(page, url) {
    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Tenta extrair título (seletores comuns)
        const title = await page.locator('h1, .job-title, [class*="title"]').first().textContent().catch(() => 'Vaga não identificada');
        
        // Tenta extrair empresa
        const company = await page.locator('.company-name, [class*="company"], [data-company]').first().textContent().catch(() => 'Empresa não identificada');
        
        // Tenta extrair descrição
        const description = await page.locator('.job-description, [class*="description"], .description').first().textContent().catch(() => '');
        
        // Tenta extrair benefícios
        const benefits = await page.locator('.benefits, [class*="benefit"]').allTextContents().catch(() => []);
        
        // Classifica como premium
        const isPremium = classifyAsPremium(description);
        
        // Extrai tags da descrição
        const tags = [];
        SEARCH_TERMS.forEach(term => {
            if (description.toLowerCase().includes(term.toLowerCase())) {
                tags.push(term);
            }
        });
        
        return {
            titulo: title?.trim() || 'Vaga não identificada',
            empresa: company?.trim() || 'Empresa não identificada',
            link_original: url,
            detalhes: description?.trim() || '',
            is_premium: isPremium,
            tags: tags,
            beneficios: benefits.map(b => b.trim()).filter(b => b)
        };
    } catch (error) {
        console.error(`Erro ao extrair informações de ${url}:`, error.message);
        return null;
    }
}

/**
 * Salva ou atualiza uma vaga no Supabase usando upsert
 */
async function saveJobToDatabase(jobInfo) {
    try {
        const { data, error } = await supabase
            .from('vagas')
            .upsert({
                link_original: jobInfo.link_original,
                titulo: jobInfo.titulo,
                empresa: jobInfo.empresa,
                detalhes: jobInfo.detalhes,
                is_premium: jobInfo.is_premium,
                tags: jobInfo.tags,
                beneficios: jobInfo.beneficios,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'link_original'
            });
        
        if (error) {
            console.error('Erro ao salvar vaga no banco:', error);
            return false;
        }
        
        console.log(`✅ Vaga salva: ${jobInfo.titulo} (${jobInfo.is_premium ? 'PREMIUM' : 'GRATUITA'})`);
        return true;
    } catch (error) {
        console.error('Erro ao salvar vaga:', error);
        return false;
    }
}

/**
 * Busca vagas no LinkedIn (simulado - adaptar para estrutura real)
 */
async function scrapeLinkedIn(browser) {
    console.log('🔍 Buscando vagas no LinkedIn...');
    
    const page = await browser.newPage();
    
    // URLs de busca simuladas (adaptar para URLs reais)
    const searchUrls = SEARCH_TERMS.map(term => 
        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(term)}&location=Brasil&f_WT=2&f_JT=F`
    );
    
    for (const url of searchUrls.slice(0, 2)) { // Limita para 2 buscas no exemplo
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            
            // Simula extração de links de vagas (adaptar seletores reais)
            const jobLinks = await page.locator('.job-card-container a').all().catch(() => []);
            
            for (const link of jobLinks.slice(0, 5)) { // Limita para 5 vagas por busca
                try {
                    const href = await link.getAttribute('href').catch(() => null);
                    if (href) {
                        const fullUrl = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
                        const jobInfo = await extractJobInfo(page, fullUrl);
                        if (jobInfo) {
                            await saveJobToDatabase(jobInfo);
                        }
                    }
                } catch (error) {
                    console.error('Erro ao processar link de vaga:', error.message);
                }
            }
        } catch (error) {
            console.error('Erro na busca do LinkedIn:', error.message);
        }
    }
    
    await page.close();
}

/**
 * Busca vagas na Gupy (simulado)
 */
async function scrapeGupy(browser) {
    console.log('🔍 Buscando vagas na Gupy...');
    
    const page = await browser.newPage();
    
    // URLs de busca simuladas
    const searchUrls = SEARCH_TERMS.map(term => 
        `https://portal.gupy.io/job-search?q=${encodeURIComponent(term)}`
    );
    
    for (const url of searchUrls.slice(0, 2)) {
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            
            // Simula extração de links (adaptar seletores reais)
            const jobLinks = await page.locator('a[href*="/job/"]').all().catch(() => []);
            
            for (const link of jobLinks.slice(0, 5)) {
                try {
                    const href = await link.getAttribute('href').catch(() => null);
                    if (href) {
                        const fullUrl = href.startsWith('http') ? href : `https://portal.gupy.io${href}`;
                        const jobInfo = await extractJobInfo(page, fullUrl);
                        if (jobInfo) {
                            await saveJobToDatabase(jobInfo);
                        }
                    }
                } catch (error) {
                    console.error('Erro ao processar link de vaga:', error.message);
                }
            }
        } catch (error) {
            console.error('Erro na busca da Gupy:', error.message);
        }
    }
    
    await page.close();
}

/**
 * Função principal do raspador
 */
async function main() {
    console.log('🚀 Iniciando raspador de vagas WorkMOM...');
    
    // Inicia navegador
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        // Executa buscas em diferentes plataformas
        await scrapeLinkedIn(browser);
        await scrapeGupy(browser);
        
        console.log('✅ Raspagem concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro durante a raspagem:', error);
    } finally {
        await browser.close();
    }
}

// Executa o raspador
main().catch(console.error);
