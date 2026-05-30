const fs = require('fs');
const path = require('path');

// Lê o index.html
let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Substitui placeholders pelas variáveis de ambiente
html = html.replace('__SUPABASE_URL__', process.env.SUPABASE_URL || '');
html = html.replace('__SUPABASE_ANON_KEY__', process.env.SUPABASE_ANON_KEY || '');

// Escreve o index.html modificado
fs.writeFileSync(path.join(__dirname, 'index.html'), html);

console.log('✅ Variáveis de ambiente injetadas no index.html');
