# Afogados Empreende · PWA

Aplicativo web progressivo oficial da 8ª Feira do Empreendedor de Afogados da Ingazeira. O projeto oferece informações atualizadas sobre o evento, como programação, mapa interativo, cadastro de expositores e conteúdos de apoio para visitantes e organizadores.

## ✨ Principais recursos

- **Home dinâmica** com contagem regressiva, destaques e atalhos rápidos.
- **Cadastro online** de expositores e participantes, integrado ao Firebase (Firestore, Auth e Storage).
- **Mapa e manual interativos** para facilitar a experiência durante a feira.
- **Design responsivo** com componentes reutilizáveis baseados em shadcn/ui.
- **Experiência PWA** (instalação no dispositivo, splash screen e uso offline básico).

## 🧱 Stack tecnológica

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) e [shadcn/ui](https://ui.shadcn.com/)
- [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage) para dados, autenticação e arquivos
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

Crie um arquivo `.env` na raiz com as credenciais do seu projeto Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# Opcional, apenas se o projeto usar Analytics
VITE_FIREBASE_MEASUREMENT_ID=...
```

Esses valores podem ser encontrados no painel **Configurações do projeto › Seus apps** no console do Firebase. Após configurar, reinicie o servidor de desenvolvimento.

### Scripts úteis

| Comando          | Descrição                                         |
| ---------------- | ------------------------------------------------- |
| `npm run dev`    | Ambiente de desenvolvimento com hot reload        |
| `npm run build`  | Gera a versão otimizada para produção             |
| `npm run preview`| Servidor local para inspecionar o build gerado    |
| `npm run lint`   | Executa verificação de estilo e padrões de código |

## 📁 Estrutura destacada

```
src/
├─ assets/          # Imagens e ícones
├─ components/      # Componentes compartilhados (UI, navegação, etc.)
├─ hooks/           # Hooks reutilizáveis
├─ integrations/    # Clientes externos (ex.: Firebase)
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
