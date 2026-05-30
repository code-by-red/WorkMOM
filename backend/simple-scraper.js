require('dotenv').config();
const Parser = require('rss-parser');

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

// RSS Feeds de sites de vagas brasileiros
const RSS_FEEDS = [
    {
        name: 'InfoJobs',
        url: 'https://www.infojobs.com.br/rss/vagas-home-office',
        keywords: ['home office', 'remoto', 'teletrabalho']
    },
    {
        name: 'Catho',
        url: 'https://www.catho.com.br/vagas/rss?tipo=home-office',
        keywords: ['home office', 'remoto']
    },
    {
        name: 'Vagas.com',
        url: 'https://www.vagas.com.br/rss/vagas-home-office',
        keywords: ['home office', 'remoto']
    }
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
 * Extrai informações de um item RSS
 */
function extractJobInfo(item, source) {
    const description = item.contentSnippet || item.content || item.description || '';
    
    // Classifica como premium
    const isPremium = classifyAsPremium(description);
    
    // Extrai tags da descrição
    const tags = [];
    RSS_FEEDS[0].keywords.forEach(keyword => {
        if (description.toLowerCase().includes(keyword.toLowerCase())) {
            tags.push(keyword);
        }
    });
    
    return {
        titulo: item.title || 'Vaga não identificada',
        empresa: source.name,
        link_original: item.link || item.guid,
        detalhes: description?.trim() || '',
        is_premium: isPremium,
        tags: tags,
        beneficios: []
    };
}

/**
 * Salva ou atualiza uma vaga no Supabase
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
            console.error('Erro ao salvar vaga no banco:', response.error);
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
 * Busca vagas de um RSS feed
 */
async function scrapeRSSFeed(feed) {
    console.log(`🔍 Buscando vagas em ${feed.name}...`);
    
    try {
        const parser = new Parser();
        const feedData = await parser.parseURL(feed.url);
        
        let savedCount = 0;
        
        for (const item of feedData.items.slice(0, 20)) { // Limita a 20 vagas por feed
            try {
                const jobInfo = extractJobInfo(item, feed);
                if (jobInfo) {
                    const saved = await saveJobToDatabase(jobInfo);
                    if (saved) savedCount++;
                }
            } catch (error) {
                console.error('Erro ao processar item:', error.message);
            }
        }
        
        console.log(`✅ ${feed.name}: ${savedCount} vagas salvas`);
        return savedCount;
    } catch (error) {
        console.error(`Erro ao buscar ${feed.name}:`, error.message);
        return 0;
    }
}

/**
 * Função principal do raspador simples
 */
async function main() {
    console.log('🚀 Iniciando raspador simples de vagas WorkMOM...');
    
    let totalSaved = 0;
    
    // Busca vagas de cada RSS feed
    for (const feed of RSS_FEEDS) {
        const saved = await scrapeRSSFeed(feed);
        totalSaved += saved;
    }
    
    console.log(`✅ Raspagem concluída! Total de vagas salvas: ${totalSaved}`);
}

// Executa o raspador
main().catch(console.error);
