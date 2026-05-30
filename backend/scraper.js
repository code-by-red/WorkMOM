require('dotenv').config();
const { chromium } = require('playwright-extra');
const { PuppeteerExtraPluginStealth } = require('puppeteer-extra-plugin-stealth');

// Configura stealth plugin
chromium.use(PuppeteerExtraPluginStealth());

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Função helper para fazer requisições ao Supabase REST API
async function supabaseRequest(table, method = 'GET', data = null) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
    };

    const options = {
        method,
        headers
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    return response.json();
}

// Termos que classificam uma vaga como premium
const PREMIUM_KEYWORDS = [
    'auxílio creche',
    'auxilio babá',
    'horário flexível',
    'escala reduzida',
    'part-time',
    'meio período',
    'flexível',
    'creche',
    'babá',
    'carga reduzida'
];

/**
 * Gera delay aleatório entre 2 e 5 segundos
 */
function randomDelay() {
    const delay = Math.floor(Math.random() * 3000) + 2000;
    return new Promise(resolve => setTimeout(resolve, delay));
}

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
 * Verifica se a vaga já existe no banco
 */
async function jobExists(linkOriginal) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/vagas?link_original=eq.${encodeURIComponent(linkOriginal)}&select=id`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        const data = await response.json();
        return data && data.length > 0;
    } catch (error) {
        console.error('Erro ao verificar duplicidade:', error);
        return false;
    }
}

/**
 * Salva vaga no Supabase
 */
async function saveJobToDatabase(jobInfo) {
    try {
        const response = await supabaseRequest('vagas', 'POST', {
            link_original: jobInfo.link_original,
            titulo: jobInfo.titulo,
            empresa: jobInfo.empresa,
            detalhes: jobInfo.detalhes,
            is_premium: jobInfo.is_premium,
            tags: jobInfo.tags,
            beneficios: jobInfo.beneficios,
            created_at: new Date().toISOString()
        });
        
        if (response.error) {
            console.error('Erro ao salvar vaga:', response.error);
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
 * Busca vagas na API pública da Gupy
 */
async function scrapeGupyAPI() {
    console.log('🔍 Buscando vagas na API da Gupy...');
    
    try {
        const response = await fetch('https://portal.api.gupy.io/api/v1/jobs?limit=50&workplaceTypes=remote');
        const data = await response.json();
        
        if (!data || !data.data) {
            console.log('⚠️ Nenhuma vaga encontrada na Gupy');
            return 0;
        }
        
        let savedCount = 0;
        const jobs = data.data.slice(0, 30); // Limite de 30 vagas
        
        for (const job of jobs) {
            await randomDelay();
            
            const jobInfo = {
                titulo: job.title || 'Vaga não identificada',
                empresa: job.companyName || 'Empresa não identificada',
                link_original: job.url || job.jobUrl || '',
                detalhes: job.description || '',
                is_premium: classifyAsPremium(job.description),
                tags: ['Remoto', 'Home Office'],
                beneficios: []
            };
            
            // Verifica duplicidade
            const exists = await jobExists(jobInfo.link_original);
            if (!exists && jobInfo.link_original) {
                const saved = await saveJobToDatabase(jobInfo);
                if (saved) savedCount++;
            }
        }
        
        console.log(`✅ Gupy: ${savedCount} vagas salvas`);
        return savedCount;
    } catch (error) {
        console.error('Erro ao buscar Gupy:', error.message);
        return 0;
    }
}

/**
 * Busca vagas no Google Jobs
 */
async function scrapeGoogleJobs() {
    console.log('🔍 Buscando vagas no Google Jobs...');
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Configura stealth para evitar detecção
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        const searchTerms = ['vagas home office assistente', 'atendimento meio periodo'];
        let savedCount = 0;
        
        for (const term of searchTerms) {
            await randomDelay();
            
            const url = `https://www.google.com/search?q=${encodeURIComponent(term)}&ibp=htl;jobs&uule=0`;
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Tenta extrair links de vagas (seletores genéricos)
            const jobLinks = await page.locator('a[href*="job"]').all().catch(() => []);
            
            for (const link of jobLinks.slice(0, 15)) {
                await randomDelay();
                
                try {
                    const href = await link.getAttribute('href').catch(() => null);
                    if (href && href.startsWith('http')) {
                        const jobInfo = {
                            titulo: await link.textContent().catch(() => 'Vaga não identificada'),
                            empresa: 'Google Jobs',
                            link_original: href,
                            detalhes: `Vaga encontrada para: ${term}`,
                            is_premium: classifyAsPremium(term),
                            tags: ['Remoto', 'Home Office'],
                            beneficios: []
                        };
                        
                        const exists = await jobExists(jobInfo.link_original);
                        if (!exists) {
                            const saved = await saveJobToDatabase(jobInfo);
                            if (saved) savedCount++;
                        }
                    }
                } catch (error) {
                    // Ignora erros individuais
                }
            }
        }
        
        await page.close();
        console.log(`✅ Google Jobs: ${savedCount} vagas salvas`);
        return savedCount;
    } catch (error) {
        console.error('Erro ao buscar Google Jobs:', error.message);
        await browser.close();
        return 0;
    } finally {
        await browser.close();
    }
}

/**
 * Busca vagas no Portal Remotar
 */
async function scrapeRemotar() {
    console.log('🔍 Buscando vagas no Portal Remotar...');
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Configura stealth
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await randomDelay();
        
        await page.goto('https://remotar.com.br/vagas', { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
        });
        
        // Extrai vagas (seletores específicos do Remotar)
        const jobCards = await page.locator('.job-card, [class*="job"]').all().catch(() => []);
        
        let savedCount = 0;
        
        for (const card of jobCards.slice(0, 30)) {
            await randomDelay();
            
            try {
                const title = await card.locator('h2, h3, [class*="title"]').first().textContent().catch(() => 'Vaga não identificada');
                const company = await card.locator('[class*="company"], [class*="empresa"]').first().textContent().catch(() => 'Empresa não identificada');
                const description = await card.locator('[class*="description"], [class*="desc"]').first().textContent().catch(() => '');
                const link = await card.locator('a').first().getAttribute('href').catch(() => null);
                
                if (link) {
                    const fullUrl = link.startsWith('http') ? link : `https://remotar.com.br${link}`;
                    
                    const jobInfo = {
                        titulo: title?.trim() || 'Vaga não identificada',
                        empresa: company?.trim() || 'Empresa não identificada',
                        link_original: fullUrl,
                        detalhes: description?.trim() || '',
                        is_premium: classifyAsPremium(description),
                        tags: ['Remoto', 'Home Office'],
                        beneficios: []
                    };
                    
                    const exists = await jobExists(jobInfo.link_original);
                    if (!exists) {
                        const saved = await saveJobToDatabase(jobInfo);
                        if (saved) savedCount++;
                    }
                }
            } catch (error) {
                // Ignora erros individuais
            }
        }
        
        await page.close();
        console.log(`✅ Remotar: ${savedCount} vagas salvas`);
        return savedCount;
    } catch (error) {
        console.error('Erro ao buscar Remotar:', error.message);
        await browser.close();
        return 0;
    } finally {
        await browser.close();
    }
}

/**
 * Função principal do raspador
 */
async function main() {
    console.log('🚀 Iniciando raspador de vagas WorkMOM...');
    
    let totalSaved = 0;
    
    // Executa raspagem de cada fonte
    totalSaved += await scrapeGupyAPI();
    totalSaved += await scrapeGoogleJobs();
    totalSaved += await scrapeRemotar();
    
    console.log(`✅ Raspagem concluída! Total de vagas salvas: ${totalSaved}`);
}

/**
 * Executa raspagem contínua com intervalo de 12 horas
 */
async function runContinuous() {
    console.log('🔄 Iniciando modo contínuo (intervalo de 12 horas)...');
    
    // Executa imediatamente
    await main();
    
    // Configura intervalo de 12 horas
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    setInterval(main, TWELVE_HOURS);
}

// Verifica se deve rodar em modo contínuo
if (process.env.CONTINUOUS_MODE === 'true') {
    runContinuous().catch(console.error);
} else {
    main().catch(console.error);
}
