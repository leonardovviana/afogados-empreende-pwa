# Afogados Empreende · PWA

Aplicativo web progressivo oficial da 8ª Feira do Empreendedor de Afogados da Ingazeira. O projeto oferece informações atualizadas sobre o evento, como programação, mapa interativo, cadastro de expositores e conteúdos de apoio para visitantes e organizadores.

## ✨ Principais recursos

- **Home dinâmica** com contagem regressiva, destaques e atalhos rápidos.
- **Cadastro online** de expositores e participantes, integrado ao Supabase (Postgres, Auth e Storage).
- **Mapa e manual interativos** para facilitar a experiência durante a feira.
- **Design responsivo** com componentes reutilizáveis baseados em shadcn/ui.
- **Experiência PWA** (instalação no dispositivo, splash screen e uso offline básico).

## 🧱 Stack tecnológica

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) e [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) (Postgres, Auth, Storage) para dados, autenticação e arquivos
- [React Router](https://reactrouter.com/) para navegação SPA

## 🚀 Como rodar localmente

> Pré-requisitos: [Node.js 18+](https://nodejs.org/en/download) e [npm](https://www.npmjs.com/)

```cmd
git clone https://github.com/leonardovviana/afogados-empreende-pwa.git
cd afogados-empreende-pwa
npm install
npm run dev
```

O servidor será carregado em `http://localhost:5173/` por padrão.

### Variáveis de ambiente

Crie um arquivo `.env` na raiz com as credenciais do seu projeto Supabase:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_WEB_PUSH_PUBLIC_KEY=...
```

Esses valores podem ser encontrados no painel **Project Settings › API** do Supabase. Após configurar, reinicie o servidor de desenvolvimento.

Para gerar a chave pública VAPID (`VITE_WEB_PUSH_PUBLIC_KEY`) e a respectiva chave privada, execute no seu terminal (com o pacote `web-push` instalado globalmente ou via npx):

```cmd
npx web-push generate-vapid-keys
```

Armazene a chave pública no arquivo `.env` e mantenha a chave privada em um local seguro (por exemplo, nas variáveis secretas do Supabase ou Netlify) para uso pelo worker responsável por disparar as notificações. Para o worker, configure também as variáveis `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL` (opcional) e `SUPABASE_SERVICE_ROLE_KEY` no ambiente de execução.

### Scripts úteis

| Comando          | Descrição                                         |
| ---------------- | ------------------------------------------------- |
| `npm run dev`    | Ambiente de desenvolvimento com hot reload        |
| `npm run build`  | Gera a versão otimizada para produção             |
| `npm run preview`| Servidor local para inspecionar o build gerado    |
| `npm run lint`   | Executa verificação de estilo e padrões de código |
| `npm run generate:icons` | Regenera os ícones PWA (192px e 512px) com padding seguro |

## 🔔 Fluxo de notificações push

1. Gere as chaves VAPID conforme descrito acima e defina `VITE_WEB_PUSH_PUBLIC_KEY` no `.env` (a chave privada será usada pelo serviço que envia as notificações).
2. Execute as novas migrações do Supabase (veja a pasta `supabase/migrations`) para criar a tabela `web_push_subscriptions` e as políticas de acesso necessárias.
3. Configure o worker/serviço responsável por observar mudanças na tabela `exhibitor_registrations` e enviar notificações push (ver função `supabase/functions/notify-status-change`). Defina as variáveis de ambiente `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e, opcionalmente, `VAPID_CONTACT_EMAIL` antes de publicar a função.
4. Após o deploy, os usuários poderão consentir com os alertas diretamente na página de consulta e passam a receber avisos quando o status for atualizado.

### ⏰ Agendamento dos lembretes automáticos de stand

Para que a função `stand-selection-reminders` execute a cada 5 minutos e mantenha os alertas em dia:

1. **Garanta que a função esteja publicada**
	```cmd
	supabase functions deploy stand-selection-reminders --no-verify-jwt
	```
	> O comando acima usa o Supabase CLI autenticado no projeto. Certifique-se de que as variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_CONTACT_EMAIL` estejam definidas no ambiente da função (via `supabase functions secrets set` ou painel).
2. **Crie um agendamento (Job Scheduler)**
	 - Pelo painel: acesse **Project Settings › Edge Functions › Schedules**, clique em **New schedule**, selecione `stand-selection-reminders` e defina o cron `*/5 * * * *` (a cada 5 minutos). Salve para ativar.
	 - Pelo CLI (alternativa, CLI ≥ 1.154):
		 ```cmd
		 supabase functions schedule create stand-selection-reminders --cron "*/5 * * * *"
		 ```
3. **Monitore os disparos** no painel de funções (logs) e ajuste o cron se precisar de janelas diferentes por ambiente (ex.: homologação com intervalos maiores).

> Enquanto houver inscrições com janela ativa e sem stand escolhido, o agendamento chamará automaticamente `notify-stand-selection` e reenviará os lembretes push.

## 📁 Estrutura destacada

```
src/
├─ assets/          # Imagens e ícones
├─ components/      # Componentes compartilhados (UI, navegação, etc.)
├─ hooks/           # Hooks reutilizáveis
├─ integrations/    # Clientes externos (ex.: Supabase)
├─ pages/           # Páginas da aplicação (rotas)
└─ styles           # Estilos globais e utilitários
```

## 📱 Publicação e PWA

A aplicação já acompanha manifesto (`public/manifest.json`) e ícones base para instalação em dispositivos móveis. Após ajustes de conteúdo, rode `npm run build` para gerar a versão otimizada de produção antes de publicar.

## 🤝 Contribuindo

1. Crie uma branch a partir da `main` (`git checkout -b feature/minha-feature`).
2. Faça commits descritivos.
3. Abra um Pull Request explicando o contexto e os passos de teste.

Sinta-se à vontade para sugerir melhorias ou relatar bugs abrindo issues no repositório.

---

Feito para fortalecer o ecossistema empreendedor de Afogados da Ingazeira. 💚
