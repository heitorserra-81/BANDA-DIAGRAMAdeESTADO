# Diagrama de Estado — código completo

Este pacote contém o código-fonte do aplicativo, com telas, estilos, imagens, ícones, manifesto PWA, service worker, rotas do servidor e migrações do banco. Ele não contém os dados cadastrados em produção, as mídias enviadas posteriormente nem credenciais.

## O que esta versão inclui

- Área pública com agenda, fotos, vídeos e músicas; os convites de envio foram removidos da página pública.
- Área da banda com login ChatGPT autorizado e senha adicional. A senha inicial é `1234`; o administrador altera em Configurações. A mudança invalida as sessões antigas.
- Ficha por show: endereço, chegada, passagem de som, contratante, telefone, confirmação individual, checklist com responsáveis e repertório em ordem.
- Contratos vinculados ao show, despesas, recebimentos e divisão por integrante.
- PWA com ícones e aviso de instalação no navegador. No iPhone, Safari > Compartilhar > Adicionar à Tela de Início.
- Os dados compartilhados precisam de conexão. Não há modo de uso offline nem cache dos dados do financeiro.

## Subir para o GitHub

1. Extraia o ZIP.
2. Crie um repositório privado no GitHub.
3. Envie o conteúdo da pasta, incluindo arquivos de configuração, sem `node_modules`, caches ou credenciais.
4. Faça o primeiro commit. O GitHub preserva o código; isso por si só não publica o servidor nem migra o banco.

Este é um projeto React/TypeScript com rotas de servidor, e não um único HTML. O GitHub Pages sozinho não executa autenticação, banco e uploads.

## Executar e publicar

O projeto usa Node.js 22.13+ e o gerenciador declarado no package.json. A versão atual está preparada para Sites/Cloudflare, com banco D1 (`DB`), arquivos R2 (`BUCKET`) e cabeçalhos de identidade fornecidos pela hospedagem confiável. Nunca exponha diretamente um servidor que aceite cabeçalhos de identidade enviados pelo visitante.

Instale as dependências com o fluxo do projeto (`npm run install:ci`), configure os recursos do ambiente e execute `npm run dev`. Para compilar, `npm run build`. As migrações SQL estão incluídas no pacote. Para o ambiente Sites, use o fluxo de publicação do Sites; a configuração `.openai/hosting.json` identifica o site existente.

## Firebase: etapa ainda pendente

Este pacote NÃO está conectado ao Firebase. A migração exige trocar autenticação, banco, uploads e suas regras de acesso, migrar dados e arquivos existentes e testar os quatro usuários. Não basta adicionar o ID do projeto Firebase.

## Antes de entregar à banda

- Trocar a senha inicial.
- Preencher nomes e e-mails dos integrantes e compartilhar o acesso ao site com eles.
- Testar confirmação de presença com contas diferentes.
- Cadastrar contatos, agenda e conteúdo reais.
- Testar a instalação no Android e no iPhone.
- Definir hospedagem definitiva e backup de banco e arquivos.

A versão não contém assinatura, cobrança, teste de sete dias ou publicação na Play Store. Esses assuntos foram discutidos para outro aplicativo.
