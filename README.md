# GameVault - Frontend com Supabase REST API

Projeto desenvolvido para o trabalho de Frontend consumindo backend Supabase.

## Tema

Sistema de gerenciamento de coleção de jogos, com autenticação de usuário e CRUD completo.

## Tecnologias usadas

- HTML5
- CSS3
- JavaScript puro
- Tailwind CSS via CDN
- Supabase REST API
- Supabase Auth REST API

## O que o sistema faz

- Cadastro de novo usuário
- Login de usuário
- Área exclusiva autenticada
- CRUD de categorias
- CRUD de jogos
- Relacionamento com Foreign Key entre jogos e categorias
- Interface responsiva
- Requisições assíncronas com `fetch`, sem recarregar a página

## Estrutura das tabelas

### categories

Tabela auxiliar de categorias.

Campos principais:

- id
- user_id
- name
- description
- created_at
- updated_at

### games

Tabela principal com mais de 5 atributos e Foreign Key.

Campos principais:

- id
- user_id
- category_id
- name
- platform
- price
- status
- rating
- description
- created_at
- updated_at

Foreign Keys:

- `category_id` referencia `categories(id)`
- `user_id` referencia `auth.users(id)`

## Como configurar o Supabase

1. Crie um projeto no Supabase.
2. Entre em **SQL Editor**.
3. Copie e execute todo o conteúdo do arquivo `database.sql`.
4. Vá em **Project Settings → API**.
5. Copie:
   - Project URL
   - anon public key
6. Abra o site.
7. Clique em **Configurar Supabase**.
8. Cole a URL e a anon key.
9. Cadastre um usuário e faça login.

## Como publicar no GitHub Pages

1. Crie um repositório público no GitHub.
2. Envie estes arquivos:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `database.sql`
   - `README.md`
3. No repositório, vá em **Settings → Pages**.
4. Em **Build and deployment**, selecione:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /root
5. Salve e aguarde o link do GitHub Pages.

## Observação importante

Este projeto usa obrigatoriamente a API REST do Supabase, por meio de `fetch`, sem usar a biblioteca `supabase-js`.
