# Bilhetim — Mural de recados

Aplicação acadêmica feita com HTML, CSS e JavaScript puros, Firebase Authentication e Cloud Firestore. O visual usa quadro de cortiça, papéis coloridos, tachinhas, ilustrações SVG e tipografia de livro.

## Funcionalidades

- Cadastro e login por e-mail/senha; saída da conta.
- Mural compartilhado entre todas as contas cadastradas.
- Criar, ler, editar e excluir recados com atualização em tempo real.
- Apenas o autor pode editar ou excluir seu recado, com proteção também nas regras do banco.
- Categorias Recado, Aviso e Lembrete; quatro cores de papel.
- Busca por título, texto ou autor, desconsiderando acentos.
- Interface adaptada para computador e celular.

## Conectar seu novo Firebase

O código está pronto, mas a configuração entregue tem valores de exemplo. Crie um projeto separado dos sites de tarefas e contatos. Login e gravação só funcionarão depois dos passos abaixo.

1. Abra https://console.firebase.google.com/ e crie um projeto com o nome **Mural de Recados**.
2. Sugestão de ID: **mural-recados-glauco**. O ID precisa estar disponível; aceite um sufixo se necessário. Use depois o ID real exibido pelo Firebase. Analytics é opcional e não é usado pelo app.
3. Abra **Authentication > Começar / Métodos de login**, habilite **E-mail/senha** e salve. Não é necessário ativar login por link de e-mail.
4. Abra **Firestore Database > Criar banco de dados**. Escolha edição Standard quando solicitado, banco **(default)** e modo de produção. Escolha a região antes de criar (por exemplo São Paulo, se disponível).
5. No Firestore, abra **Regras**, substitua todo o texto pelo conteúdo de `firestore.rules` deste projeto e clique em **Publicar**. Não use regras que liberem tudo.
6. Em **Configurações > Geral > Seus aplicativos**, registre um aplicativo Web (ícone </>) com apelido **mural-web**.
7. Copie os valores do objeto `firebaseConfig` para `public/firebase-config.js`, mantendo `export const firebaseConfig =`. Não cole o restante do exemplo do console sobre esse arquivo.
8. Salve o arquivo e atualize o site aberto por um servidor local.

Exemplo de formato (substitua pelos valores do seu próprio aplicativo):

```js
export const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_ID_REAL.firebaseapp.com",
  projectId: "SEU_ID_REAL",
  appId: "SEU_APP_ID"
};
```

Essa configuração Web é pública. Senhas de usuários e chaves privadas de conta de serviço não fazem parte dela. O app já importa os módulos do Firebase 13.0.0 via CDN; não precisa executar npm install firebase.

### Onde ficam os recados?

O nome do banco é **(default)**. A coleção é **recados**, criada automaticamente quando você publica o primeiro recado. Não precisa criar uma tabela manualmente.

Cada documento fica em `recados/{id}` e contém:

| Campo | Conteúdo |
| --- | --- |
| title | Título (até 80 caracteres) |
| body | Mensagem (até 1.000 caracteres) |
| category | recado, aviso ou lembrete |
| color | mel, rosa, lavanda ou azul |
| authorId | UID da conta do autor |
| authorName | Nome derivado da parte do e-mail anterior ao @ |
| createdAt | Data de criação gerada pelo servidor |
| updatedAt | Data da última alteração gerada pelo servidor |

As contas aparecem em Authentication > Usuários. Os recados aparecem em Firestore > Dados. Todas as contas autenticadas leem o mesmo mural; visitantes sem login não têm acesso aos dados.

## Executar localmente

Abra a pasta do projeto no VS Code. Abra `public/index.html` e use Ctrl+Shift+P > **Live Server: Open with Live Server**. Isso dispensa encontrar o botão na barra inferior.

Alternativa com Python instalado, no PowerShell:

```powershell
cd "C:\Users\ronal\Desktop\Projetos Glauco\mural-recados"
py -m http.server 5503 --bind 127.0.0.1 --directory public
```

Abra http://localhost:5503/. Mantenha o terminal aberto; Ctrl+C encerra o servidor. Se a porta estiver ocupada, troque 5503 por 5504 tanto no comando quanto no endereço.
Não abra o HTML com duplo clique usando file://. É necessária conexão com a internet para carregar o SDK e acessar seu Firebase.

## Arquivos

- `public/index.html`: estrutura das telas.
- `public/styles.css`: aparência e adaptação para celular.
- `public/app.js`: autenticação, CRUD, filtros e sincronização.
- `public/firebase-config.js`: configuração do novo projeto.
- `public/images/`: ilustrações SVG originais, sem dependências externas.
- `firestore.rules`: autorização e validação dos documentos.
- `firebase.json`: configuração opcional de Hosting e dos emuladores.
- `GITHUB.txt`: comandos para criar e enviar o repositório.
- `evidencias/`: coloque seus prints ou vídeo da aplicação conectada ao seu Firebase.
- `previas/`: imagens de testes locais identificadas como dados fictícios; não são evidência de implantação real.

## Enviar para o GitHub

Veja `GITHUB.txt`. Antes do primeiro commit, configure seu nome e e-mail para evitar que apareça um nome antigo. Envie a pasta inteira do projeto, incluindo as regras e este README.
Um repositório GitHub com os arquivos não publica o site automaticamente. Para acessá-lo online, use Hosting abaixo, ou execute localmente.

## Publicar com Firebase Hosting (opcional)

Após conectar e testar o app, instale a CLI com uma versão de Node suportada. Na pasta do projeto, substitua SEU_ID_REAL_DO_PROJETO:

```powershell
npm install -g firebase-tools
firebase login
firebase deploy --only hosting,firestore:rules --project SEU_ID_REAL_DO_PROJETO
```

O arquivo firebase.json já está pronto, portanto não é necessário rodar firebase init. O comando publica o site e as regras no projeto informado. Use o link retornado pela CLI.

## Demonstração para o professor

1. Mostre o cadastro de uma conta de teste no site e a conta criada em Authentication > Usuários.
2. Saia e entre novamente com essa conta.
3. Crie um recado com título, texto, categoria e cor.
4. Mostre o recado no site e o documento na coleção recados do Firestore (Criar e Ler).
5. Edite a mensagem e mostre a alteração no site e no banco (Atualizar).
6. Exclua o recado e mostre que ele sumiu dos dois lugares (Deletar).
7. Se quiser demonstrar tempo real, use duas janelas logadas: a segunda atualiza sem recarregar.
8. Salve o vídeo ou os prints em evidencias. Use dados de demonstração.

O professor pode criar a própria conta para testar. Ele verá os recados do mural e poderá editar ou excluir somente os que criar. A integração depende do Firebase continuar ativo e das regras publicadas.
O certificado do curso é um documento separado, emitido pela plataforma após a conclusão.

## Verificação realizada

17 verificações passaram com Authentication e Firestore Emulator: autorização, validação de dados, cadastro, login, CRUD, persistência após recarregar, atualização entre contas, busca, filtros, proteção contra interpretação de HTML e layout mobile. As imagens e o relatório estão em previas.
Esses testes não acessaram um banco real. É necessário repetir a demonstração depois de preencher sua configuração e publicar as regras.

## Gerar ZIP atualizado

```powershell
powershell -ExecutionPolicy Bypass -File .\gerar-zip.ps1
```

O ZIP é salvo na pasta acima do projeto e inclui código, documentação e evidências. As prévias fictícias de teste não entram no ZIP.

## Problemas comuns

- **Falta conectar seu Firebase:** preencha os quatro valores de public/firebase-config.js.
- **Acesso negado:** confira o projeto selecionado e publique o arquivo firestore.rules inteiro.
- **Login não habilitado:** ative o provedor E-mail/senha em Authentication.
- **Domínio não autorizado:** em Authentication > Configurações > Domínios autorizados, adicione o domínio exibido no endereço (por exemplo localhost ou 127.0.0.1), sem porta.
- **O mural está vazio:** a coleção surge ao criar o primeiro recado no site.
- **O professor não consegue abrir localhost:** esse endereço só funciona no computador que iniciou o servidor. Entregue o código com instruções ou publique com Hosting.

## Referências

- Firebase Web: https://firebase.google.com/docs/web/setup
- Cloud Firestore: https://firebase.google.com/docs/firestore/quickstart
- GitHub CLI: https://cli.github.com/manual/gh_repo_create
