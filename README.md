# Finanças — Frontend

Frontend em **React + TypeScript + Vite** para a API de finanças pessoais (Spring Boot).
Consome exclusivamente a API REST; não acessa o Supabase e não guarda despesas localmente.

## Anexos:
<img width="1916" height="1022" alt="image" src="https://github.com/user-attachments/assets/4a57e060-44b4-4f29-b9d7-77b1576d30a5" />
<img width="1913" height="1017" alt="image" src="https://github.com/user-attachments/assets/ebd38fb4-ad1b-42a7-931b-e8ba97faaa78" />
<img width="1910" height="1020" alt="image" src="https://github.com/user-attachments/assets/1b75e908-e91f-40d9-a951-ada0a2cb9cfe" />
<img width="1915" height="1017" alt="image" src="https://github.com/user-attachments/assets/e3242e2c-ff6e-4708-88f3-966fd28b58cb" />

## Requisitos

- Node.js 18 ou superior

## Instalação e execução

```bash
npm install
cp .env.example .env     # ajuste VITE_API_URL se necessário
npm run dev              # http://localhost:5173
```

Outros comandos: `npm run typecheck`, `npm run build` (verifica tipos e gera `dist/`), `npm run preview`.

## Configuração da URL da API

A URL-base vem de `VITE_API_URL` (sem barra final):

| Ambiente | Valor |
|---|---|
| Produção (`.env.production`, já incluído) | `https://apifinancas.onrender.com` |
| Backend local | `http://localhost:8080` |

Se a variável não existir, o app usa a URL de produção e avisa no console.

> O backend libera CORS para qualquer origem (`CorsConfig`). Em hospedagem estática, configure o
> redirecionamento de todas as rotas para `/index.html` (já há `public/_redirects` para Netlify/Render).

## Funcionalidades

**Visão geral** (`/`) — mês atual, calculado dinamicamente:
- Situação do mês (aberto/fechado) a partir de `GET /months`.
- Resumo (total, crédito, imediatos, quantidade) via `GET /expenses/month/summary`.
- Cadastro, edição (modal) e exclusão (com confirmação) de despesas.
- Relatórios: rosca por categoria e barras crédito × imediato, com dados reais; estados vazios.
- Fechamento do mês com confirmação (`POST /months`).

**Histórico** (`/historico`) — meses fechados na ordem do backend:
- Lista com data de fechamento e total (obtido do resumo de cada mês).
- Detalhe do mês: resumo, gráficos e lançamentos (somente leitura).
- Reabrir mês (`DELETE /months/{id}/reopen`), oferecido apenas ao primeiro item da lista (último
  fechado). O servidor continua sendo a autoridade: se recusar, a mensagem é exibida.
- Após reabrir, o aviso oferece "Ver despesas", que abre `/?mes=AAAA-MM` na visão geral para
  editar o mês reaberto. Sem o parâmetro, a página sempre mostra o mês atual.

## Mapeamento da API

| Uso no app | Endpoint |
|---|---|
| Lista do mês | `GET /expenses/month?month&year` |
| Resumo | `GET /expenses/month/summary?month&year` |
| Cadastrar / editar / excluir | `POST /expenses`, `PUT /expenses/{id}`, `DELETE /expenses/{id}` |
| Histórico | `GET /months` |
| Fechar | `POST /months` com `{ month, year }` |
| Reabrir | `DELETE /months/{id}/reopen` |

Existem em `src/services` (sem uso na interface): `GET /expenses`, `GET /expenses/{id}`,
`GET /months/{id}`. `DELETE /months/{id}` não foi exposto, conforme o escopo.

## Estrutura

```
src/
  config/      URL da API
  types/       tipos espelhando DTOs e enums do backend
  constants/   rótulos, ícones e cores de categorias e formas de pagamento
  services/    http.ts (cliente central), expenses.ts, months.ts
  hooks/       useMonthData, useClosedMonths, useMonthTotals, useToast
  components/  formulário, lista, gráficos (SVG próprio), modais, estados
  pages/       OverviewPage, HistoryPage
  styles/      tokens, base, componentes, páginas
```

Os gráficos são SVG/CSS próprios, sem biblioteca de gráficos.

## Limitações e observações

1. **Mensagens de erro do backend.** O Spring, por padrão, não envia o campo `message` e não há
   `@ControllerAdvice`. Um `400` pode ser validação ou regra de negócio ("Mês encerrado.", "Mês já
   encerrado.", "Não existem despesas neste mês.", "Apenas o último mês fechado pode ser
   reaberto."), e o front não consegue distingui-los. Por isso usa mensagens contextuais para cada
   operação e exibe a mensagem do servidor quando ela existir. Para mensagens exatas seria preciso
   alterar o backend (não feito).
2. **Ordem das despesas.** `GET /expenses/month` não define ordenação; a lista é ordenada no front
   (data mais recente primeiro) apenas na apresentação.
3. **Total no histórico.** `ClosedMonth` não traz total; é feita uma consulta de resumo por mês
   fechado. Se uma falhar, aparece "—" (nada é inventado).
4. **Validação de mês fechado no formulário** usa a lista de `GET /months` só para orientar; o
   backend valida de novo, inclusive o mês antigo e o novo na edição.
5. **Data de fechamento.** `closedAt` é definido pelo servidor (`LocalDate.now()`), podendo diferir
   da data local perto da meia-noite.
6. **Render.** Após inatividade a primeira resposta pode levar cerca de um minuto; as consultas têm
   novas tentativas automáticas, aviso de espera e limite de 60 s. Escritas não são repetidas.
7. Sem autenticação ou múltiplos usuários, pois o backend não os define.
