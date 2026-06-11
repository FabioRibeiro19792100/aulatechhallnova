# Prompt Quality Lab

Painel de análise e visualização da qualidade de prompts para laboratórios de uso de IA em contexto educacional. Desenhado para sessões onde participantes completam missões de chat e coding via API OpenAI. Permite ao facilitador e ao gestor de L&D identificar o perfil de cada participante em três dimensões independentes e entregar devolutivas estruturadas com diagnóstico, achados e próximos passos concretos.

---

## Arquitetura da página

A página é um único arquivo HTML autocontido, sem dependências externas além das fontes Google (Space Grotesk e Inter). Divide-se em três zonas:

**Header** — identificação da sessão e badge de status.

**Main** — dois painéis lado a lado em proporção 58/42. O painel esquerdo exibe o mapa de perfis (quadrante). O painel direito exibe o diagnóstico individual do participante selecionado, organizado em quatro abas.

**Footer** — data de geração da análise, nome da sessão e botão de encerramento.

---

## Mapa de perfis

Quadrante com dois eixos independentes.

### Eixo Y — Qualidade do prompt

Vertical, de baixo para cima. Vai de "Prompts vagos" (base) a "Prompts claros" (topo). Mede o quanto a pessoa consegue formular instruções precisas, com contexto, papel, tarefa e formato definidos.

### Eixo X — Eficiência de recursos

Horizontal. O centro representa o equilíbrio ideal (Calibrado). O eixo vai de Subfornecido (esquerda, contexto insuficiente) a Superfornecido (direita, tokens excessivos). Não é uma progressão — os dois extremos são desvios em direções opostas, e ambos degradam a qualidade do resultado.

### Quadrantes

| Posição | Nome | Qualidade | Eficiência | Característica |
|---|---|---|---|---|
| Superior direito | Avançado | Alta | Calibrada | Referência da turma |
| Superior esquerdo | Econômico Impreciso | Baixa | Subfornecida | Economiza no recurso errado |
| Inferior direito | Eloquente Desperdiçador | Alta | Superfornecida | Sabe o que quer, desperdiça recursos |
| Inferior esquerdo | Iniciante | Baixa | Superfornecida | Ponto de partida do desenvolvimento |

Os participantes são representados como pontos clicáveis. O ponto selecionado fica em azul. Clicar num ponto carrega o diagnóstico daquele participante no painel direito.

---

## Painel de diagnóstico

### Topo fixo

Nome do participante e perfil de quadrante. Permanece visível independentemente da aba ativa.

### Quatro abas

**Visão Geral**
Abre com três estatísticas individuais do participante: número de prompts na sessão, custo total e média de iterações por tarefa. Em seguida, a tríade completa das três dimensões. Depois, o diagnóstico consolidado do perfil e três próximos passos numerados, concretos e acionáveis para a próxima sessão.

**Clareza**
Abre com a linha da dimensão de clareza — os três estágios em sequência, com o atual destacado. Em seguida, análise textual do padrão identificado, achados categorizados por severidade e uma dica prática com exemplo de estrutura de prompt.

**Eficiência**
Abre com a linha da dimensão de eficiência. Desvios (Subfornecido ou Superfornecido) aparecem em âmbar. O estágio Calibrado aparece em azul quando ativo, ou com borda tracejada quando inativo — sinalizando que é o alvo. Em seguida, análise do padrão de consumo de tokens, achados e dica de melhoria.

**Modelo**
Abre com a linha da dimensão de adequação de modelo. Em seguida, mapa das escolhas feitas durante a sessão, achados e critério de seleção recomendado.

---

## As três dimensões

### 1. Clareza do prompt
Tipo: escala de progressão (do mais dependente ao mais autônomo)

| Nível | Nome | Descrição |
|---|---|---|
| 0 | Chain-of-thought | Raciocínio explicitado em etapas — necessário quando o prompt sozinho não resolve |
| 1 | Few-shot | Exemplos fornecidos para calibrar o output esperado |
| 2 | Zero-shot | Instrução direta e completa, sem andaimes extras |

### 2. Eficiência de tokens
Tipo: diagnóstico de padrão — o ideal é o centro, não o extremo

| Nível | Nome | Descrição |
|---|---|---|
| 0 | Subfornecido | Contexto insuficiente — o modelo infere o que deveria receber explicitamente |
| 1 | Calibrado | Equilíbrio entre contexto necessário e custo — **único estado desejável** |
| 2 | Superfornecido | Contexto excessivo sem ganho de qualidade — redundância e repetição |

Subfornecido e Superfornecido são erros em direções opostas. A representação visual reflete isso: pills com desvio em âmbar, equilíbrio em azul.

### 3. Adequação do modelo
Tipo: escala de progressão (da escolha aleatória à escolha estratégica)

| Nível | Nome | Descrição |
|---|---|---|
| 0 | Trial | Escolha sem critério identificável — modelo selecionado ao acaso ou por hábito |
| 1 | Consciente | Percepção da tarefa, ainda inconsistente |
| 2 | Estratégico | Modelo escolhido deliberadamente por tipo de tarefa |

---

## Rubrica de cálculo dos scores

Os scores são internos ao sistema. Não aparecem na interface — determinam a posição no quadrante e o nível da tríade, mas não são exibidos ao participante.

### Score de Clareza (0.0–1.0)

Cada prompt recebe pontos pela presença de quatro elementos estruturais:

| Elemento | Peso |
|---|---|
| Papel definido ("atue como...") | +0.25 |
| Contexto fornecido | +0.25 |
| Tarefa explícita e clara | +0.25 |
| Formato de output especificado | +0.25 |

O score final é a média aritmética de todos os prompts da sessão.

Mapeamento para nível:
- 0.00–0.40 → Chain-of-thought
- 0.41–0.70 → Few-shot
- 0.71–1.00 → Zero-shot

**Implementação sugerida:** enviar cada prompt para um modelo avaliador com o seguinte system prompt:

```
Você é um avaliador de qualidade de prompts. Para cada prompt recebido, retorne um JSON com quatro campos booleanos: tem_papel, tem_contexto, tem_tarefa, tem_formato. Retorne apenas o JSON, sem explicação.
```

O score por prompt é a soma dos campos `true` dividida por 4.

---

### Score de Eficiência (0.0–1.0)

Mede a proximidade do equilíbrio ideal, combinando duas métricas:

**Métrica A — Densidade de contexto por resultado:**
```
densidade = tokens_prompt_médio / taxa_sucesso_primeira_tentativa
```

**Métrica B — Índice de redundância:**
Percentual de prompts que repetem contexto já presente no histórico da thread.

**Combinação:**
```
raw_score = (1 - redundância) × (1 / (1 + desvio_relativo_da_densidade_ideal))
```

O `desvio_relativo` é a distância percentual da densidade ideal por tipo de tarefa:
- Chat analítico: ~150 tokens
- Coding: ~200 tokens
- Q&A simples: ~60 tokens

Score 1.0 = Calibrado perfeito. Valores menores indicam desvio em qualquer direção.

Mapeamento para posição no eixo X:
- Score alto com prompts curtos e muitas iterações → Subfornecido (esquerda)
- Score alto com prompts equilibrados → Calibrado (centro)
- Score baixo com prompts longos e redundância → Superfornecido (direita)

---

### Score de Adequação de Modelo (0.0–1.0)

Cada tarefa é classificada por tipo e o modelo usado é comparado contra uma matriz de referência.

**Matriz de adequação:**

| Tipo de tarefa | Adequado | Aceitável | Inadequado |
|---|---|---|---|
| Raciocínio multietapa, síntese | GPT-4o, Opus | Sonnet | GPT-3.5, Haiku |
| Análise e comparação | GPT-4o, Sonnet | Haiku+ | GPT-3.5 puro |
| Geração e refatoração de código | Codex, GPT-4o | Sonnet | GPT-3.5 texto |
| Q&A factual, tradução, formatação | GPT-3.5, Haiku | Sonnet | GPT-4o (superdimensionado) |
| Extração e estruturação | GPT-3.5, Haiku | Sonnet | GPT-4o (superdimensionado) |

**Pontuação por tarefa:**
- Match perfeito: 1.0
- Modelo aceitável: 0.65
- Modelo subdimensionado: 0.30
- Modelo superdimensionado: 0.50

O score final é a média ponderada de todas as tarefas da sessão.

Mapeamento para nível:
- 0.00–0.40 → Trial
- 0.41–0.70 → Consciente
- 0.71–1.00 → Estratégico

---

## Estrutura de dados por participante

```javascript
{
  id: Number,
  name: String,
  scores: {
    clarity: Number,      // 0.0–1.0 — interno, não exibido
    efficiency: Number,   // 0.0–1.0 — interno, não exibido
    modelFit: Number      // 0.0–1.0 — interno, não exibido
  },
  stats: {
    prompts: Number,      // total de prompts na sessão
    custo: String,        // ex: '$0.034'
    iteracoes: String     // média de iterações por tarefa, ex: '2,1'
  },
  triad: {
    clarity: 0 | 1 | 2,
    efficiency: 0 | 1 | 2,   // 0=Subfornecido, 1=Calibrado, 2=Superfornecido
    modelFit: 0 | 1 | 2
  },
  qx: Number,   // 0–100, posição no eixo X (50 = centro/calibrado)
  qy: Number,   // 0–100, posição no eixo Y (0 = topo/alta qualidade)
  quadrant: String,
  tabs: {
    geral: {
      text: String,
      findings: Array<{ type: 'ok'|'warn'|'crit', text: String }>,
      nextSteps: Array<String>
    },
    clareza: {
      text: String,
      findings: Array<{ type: 'ok'|'warn'|'crit', text: String }>,
      tip: { label: String, text: String }
    },
    eficiencia: { /* mesma estrutura de clareza */ },
    modelo:     { /* mesma estrutura de clareza */ }
  }
}
```

---

## Cálculo das coordenadas do quadrante

```javascript
// Eixo Y: invertido (0 = topo = alta qualidade)
qy = (1 - scores.clarity) * 90 + 5

// Eixo X: eficiência — centro = calibrado
if (triad.efficiency === 1) {
  qx = 45 + (scores.modelFit * 10)  // calibrado, leve ajuste por adequação de modelo
} else if (triad.efficiency === 0) {
  qx = 5 + (scores.efficiency * 40)  // subfornecido: lado esquerdo
} else {
  qx = 55 + ((1 - scores.efficiency) * 40)  // superfornecido: lado direito
}
```

---

## Como integrar com dados reais

A página recebe o participante ativo de duas formas:

**Via URL param:**
```
prompt-quality-lab.html?id=3
```

**Via postMessage da página pai:**
```javascript
iframeElement.contentWindow.postMessage({ participantId: 3 }, '*');
```

O pipeline de análise sugerido ao final de cada sessão:

1. Exportar o histórico de prompts por participante da API OpenAI.
2. Processar cada prompt com o modelo avaliador de clareza.
3. Calcular métricas de eficiência a partir dos metadados de uso (tokens, número de chamadas, timestamps).
4. Classificar cada tarefa por tipo e calcular o score de adequação de modelo.
5. Gerar os textos de diagnóstico por aba com uma chamada ao modelo usando scores e histórico como contexto.
6. Calcular `qx`, `qy` e mapear os `triad` levels a partir dos scores.
7. Popular o array `participants` no HTML com os dados gerados.

---

## Decisões de design

**Scores não aparecem na interface.**
São critérios de cálculo interno. Exibir um número como "88" cria falsa precisão e gera questionamentos sobre a métrica em vez de foco no desenvolvimento.

**Eficiência não é progressão.**
Subfornecido e Superfornecido são erros opostos, não estágios. Uma escala linear implicaria que um extremo é "mais avançado" que o outro, o que é falso. O design usa âmbar para desvios e azul para equilíbrio, e marca o pill Calibrado com borda tracejada quando inativo.

**O eixo X não mede custo absoluto.**
Um prompt longo e bem calibrado que resolve na primeira tentativa pode ser mais eficiente do que um prompt curto com cinco iterações. A métrica combina densidade de contexto com taxa de sucesso.

**Tríade dentro de cada aba, não no topo fixo.**
Cada aba abre com a linha da dimensão que analisa, eliminando redundância. A aba Visão Geral mostra as três linhas juntas como resumo de entrada.

---

## Versão

v1.1 — Estrutura analítica completa com rubrica de scoring documentada. Pronto para conexão com dados reais via substituição do array `participants`.
