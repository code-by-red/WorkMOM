-- Tabela de vagas de emprego
CREATE TABLE IF NOT EXISTS public.vagas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    empresa TEXT NOT NULL,
    link_original TEXT UNIQUE NOT NULL,
    detalhes TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    beneficios TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vagas_created_at ON public.vagas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vagas_is_premium ON public.vagas(is_premium);
CREATE INDEX IF NOT EXISTS idx_vagas_tags ON public.vagas USING GIN(tags);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);

-- Trigger para cadastro automático de usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, is_premium)
    VALUES (NEW.id, NEW.email, FALSE)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função quando um novo usuário é criado no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Política de segurança para vagas (leitura pública)
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vagas são visíveis para todos"
    ON public.vagas FOR SELECT
    USING (true);

-- Política de segurança para usuários (apenas próprio usuário)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprio perfil"
    ON public.usuarios FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
    ON public.usuarios FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Função para atualizar status premium (usada pelo webhook)
CREATE OR REPLACE FUNCTION public.upgrade_to_premium(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.usuarios
    SET is_premium = TRUE,
        updated_at = NOW()
    WHERE email = user_email;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
