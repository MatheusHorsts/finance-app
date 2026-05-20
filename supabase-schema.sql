-- ============================================
-- FINANCE MANAGER - Schema do Banco de Dados
-- Execute no Supabase SQL Editor
-- ============================================

-- Contas bancárias
CREATE TABLE contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'carteira', 'outro')),
  saldo NUMERIC(12,2) DEFAULT 0,
  cor TEXT DEFAULT '#10b981',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categorias de transação
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  cor TEXT DEFAULT '#6366f1',
  icone TEXT DEFAULT 'circle'
);

-- Transações
CREATE TABLE transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conta_id UUID REFERENCES contas(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'transferencia')),
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contas a pagar
CREATE TABLE contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  recorrente BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cartões de crédito
CREATE TABLE cartoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  bandeira TEXT DEFAULT 'visa',
  limite NUMERIC(12,2) NOT NULL,
  limite_usado NUMERIC(12,2) DEFAULT 0,
  vencimento_fatura INTEGER NOT NULL CHECK (vencimento_fatura BETWEEN 1 AND 31),
  fechamento_fatura INTEGER NOT NULL CHECK (fechamento_fatura BETWEEN 1 AND 31),
  cor TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gastos no cartão
CREATE TABLE gastos_cartao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cartao_id UUID REFERENCES cartoes(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  parcelas INTEGER DEFAULT 1,
  parcela_atual INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Investimentos
CREATE TABLE investimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('renda_fixa', 'renda_variavel', 'fundo', 'criptomoeda', 'outro')),
  valor_investido NUMERIC(12,2) NOT NULL,
  valor_atual NUMERIC(12,2) NOT NULL,
  data_inicio DATE NOT NULL,
  instituicao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dívidas
CREATE TABLE dividas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  credor TEXT NOT NULL,
  valor_original NUMERIC(12,2) NOT NULL,
  saldo_devedor NUMERIC(12,2) NOT NULL,
  taxa_juros NUMERIC(5,2) DEFAULT 0,
  parcelas_total INTEGER,
  parcelas_pagas INTEGER DEFAULT 0,
  vencimento DATE,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'quitada', 'negociando')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS (Row Level Security) - MUITO IMPORTANTE
-- ============================================
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividas ENABLE ROW LEVEL SECURITY;

-- Policies: cada usuário vê e edita apenas seus próprios dados
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['contas','categorias','transacoes','contas_pagar','cartoes','gastos_cartao','investimentos','dividas']
  LOOP
    EXECUTE format('CREATE POLICY "user_%s" ON %I FOR ALL USING (auth.uid() = user_id)', tbl, tbl);
  END LOOP;
END;
$$;
