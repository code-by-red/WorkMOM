# Configurar Task Scheduler para Automatizar Raspador

## Passo a Passo:

### 1. Abrir Task Scheduler
- Pressione `Win + R`
- Digite `taskschd.msc`
- Pressione Enter

### 2. Criar Tarefa Básica
- No painel direito, clique em **"Criar Tarefa Básica"**
- Nome: `WorkMOM Raspador de Vagas`
- Descrição: `Busca automática de vagas home office para o WorkMOM`
- Clique em **"Próximo"**

### 3. Gatilho (Trigger)
- Selecione **"Diariamente"**
- Defina a hora (recomendado: 6:00 da manhã)
- Clique em **"Próximo"**

### 4. Ação
- Selecione **"Iniciar um programa"**
- Programa/Script: `C:\Users\gl451\OneDrive\Desktop\omWorking\run-scraper.bat`
- Iniciar em (opcional): `C:\Users\gl451\OneDrive\Desktop\omWorking\backend`
- Clique em **"Próximo"**

### 5. Concluir
- Revise as configurações
- Marque **"Abrir a janela Propriedades para esta tarefa ao clicar em Concluir"**
- Clique em **"Concluir"**

### 6. Configurações Avançadas (Opcional)
- Na aba **"Condições"**:
  - Marque **"Iniciar o computador se estiver desligado"**
  - Marque **"Acordar o computador para executar esta tarefa"**
  
- Na aba **"Configurações"**:
  - Se a tarefa falhar, reiniciar a cada: 1 minuto
  - Tentar reiniciar até: 3 vezes

### 7. Testar Manualmente
- Clique com botão direito na tarefa
- Selecione **"Executar"**
- Verifique se o raspador funcionou

## Frequência Recomendada:
- **Diariamente** às 6:00 da manhã (para ter vagas atualizadas durante o dia)
- Ou **A cada 6 horas** (para vagas muito recentes)

## Solução Alternativa: GitHub Actions
Se preferir automação na nuvem, posso criar um workflow do GitHub Actions para executar o raspador automaticamente.
