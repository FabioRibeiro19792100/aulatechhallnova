# Análise de qualidade do prompt

Este documento descreve a lógica atual da análise de qualidade do prompt no facilitador e no drawer do participante.

## O que a análise faz

A análise consolida o histórico de interações de um participante e produz uma leitura textual em seis dimensões:

- Clareza de intenção
- Uso de contexto
- Estruturação de instruções
- Refinamento iterativo
- Escolhas operacionais
- Eficiência operacional

Além das dimensões, a análise também gera:

- evolução observada
- forças e oportunidades
- recomendações práticas

## Fonte dos dados

A análise usa apenas o histórico de execuções já salvo no evento:

- prompt/input enviado
- modo usado em cada rodada (`chat` ou `coding`)
- modelo selecionado/efetivo
- tokens
- custo
- anexos
- sequência cronológica das interações

## Recortes disponíveis

O drawer oferece três recortes:

- `Geral`: consolida todo o histórico do participante
- `Chat`: considera apenas interações em modo `chat`
- `Coding`: considera apenas interações em modo `coding`

O seletor de recorte fica no bloco fixo do drawer, à direita dos ícones de navegação por seção.

## Critério mínimo

Cada recorte só libera análise a partir de `5` prompts no próprio recorte.

Exemplos:

- se o participante tem `12` prompts no total, mas só `3` em `coding`, a análise `Coding` ainda não abre
- se tem `6` prompts em `chat`, a análise `Chat` já pode ser gerada

## Escala usada

Cada dimensão usa uma escala progressiva de três níveis:

- `Simples`
- `Solida`
- `Refinada`

Essa escala qualifica o nível da formulação naquela dimensão, e não rotula a pessoa.

## Como a análise é gerada

Quando há histórico suficiente, o sistema envia o recorte correspondente para a rotina de leitura pedagógica longitudinal.

Hoje o sistema gera e salva, por participante:

- uma análise `general`
- uma análise `chat`
- uma análise `coding`

Cada uma fica persistida dentro de `participantAnalyses`, no campo `analysisScopes`.

O campo legado `analysis` continua apontando para o recorte `general`, para manter compatibilidade com leituras antigas.

## Compatibilidade com análises antigas

Leituras antigas podem ter sido geradas antes da separação por recorte.

Para esses casos:

- o sistema continua lendo o `general`
- `Chat` e `Coding` podem aparecer como indisponíveis ou pendentes até a regeneração
- a escala antiga é convertida automaticamente:
  - `Emergente` → `Simples`
  - `Consistente` → `Solida`
  - `Sofisticada` → `Refinada`

## Interface atual

### Facilitador

No dashboard do facilitador:

- o card do time mantém o atalho para abrir a análise
- a análise abre em drawer lateral
- o topo do drawer fica fixo
- as seções internas são navegadas por ícones

### Participante

Na tela do participante:

- existe um trilho lateral direito
- o primeiro clique no ícone expande o trilho para revelar os labels
- o clique no label executa a ação
- uma das ações do trilho abre a análise de qualidade do prompt

## Persistência

A análise é salva no evento em `participantAnalyses`.

Cada entrada guarda, entre outros campos:

- `participantId`
- `displayName`
- `teamIdx`
- `historySignature`
- `status`
- `analysis`
- `usage`
- `analysisScopes`

## Regeneração

Se o histórico muda, a análise pode ser regenerada.

Hoje isso acontece por:

- rerun automático quando o histórico muda e a entrada não cobre os escopos esperados
- retry manual no drawer quando a leitura falha
