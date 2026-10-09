const $ = (id) => document.getElementById(id);
const categories = { recado: 'Recado', aviso: 'Aviso', lembrete: 'Lembrete' };
const paperColors = ['mel', 'rosa', 'lavanda', 'azul'];
let auth, db, authAPI, dbAPI;
let user = null, unsubscribe = null, editingId = null;
let notes = [], session = 0, filter = 'all';
let ready = false, busy = false, authBusy = false, signup = false;

function notify(text = '', error = false, target = 'message') {
  const box = $(target);
  box.hidden = !text;
  box.classList.toggle('error', error);
  box.setAttribute('role', error ? 'alert' : 'status');
  box.textContent = text;
}
function errorText(error) {
  const errors = {
    'auth/invalid-email': 'Confira o formato do e-mail.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já tem uma conta. Use a opção Entrar.',
    'auth/weak-password': 'Use uma senha mais forte, com pelo menos 6 caracteres.',
    'auth/password-does-not-meet-requirements': 'A senha precisa atender à política definida no Firebase.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    'auth/network-request-failed': 'Confira sua internet e tente novamente.',
    'auth/operation-not-allowed': 'Habilite E-mail/senha no Firebase Authentication.',
    'auth/user-disabled': 'Esta conta está desativada.',
    'auth/unauthorized-domain': 'Autorize o domínio do site nas configurações do Authentication.',
    'auth/invalid-api-key': 'Confira a apiKey em firebase-config.js.',
    'permission-denied': 'Acesso negado. Publique firestore.rules no seu projeto. Cada pessoa só pode alterar os próprios recados.',
    'not-found': 'Este recado não existe mais. Ele pode ter sido excluído em outra aba.',
    'unavailable': 'O banco está indisponível. Confira a internet e tente novamente.',
    'failed-precondition': 'Confira se o banco Firestore padrão (default) foi criado.',
    'resource-exhausted': 'O limite de uso foi atingido. Confira o console Firebase.'
  };
  return errors[error.code] || 'Não foi possível concluir. Confira sua conexão e a configuração do Firebase.';
}
function authMode(value) {
  if (authBusy) return;
  signup = value;
  $('login-tab').setAttribute('aria-pressed', String(!signup));
  $('signup-tab').setAttribute('aria-pressed', String(signup));
  $('confirmation').hidden = !signup;
  $('auth-confirm').disabled = !signup;
  $('auth-confirm').required = signup;
  $('auth-password').minLength = signup ? 6 : 1;
  $('auth-password').autocomplete = signup ? 'new-password' : 'current-password';
  $('auth-password').value = $('auth-confirm').value = '';
  $('auth-heading').textContent = signup ? 'Seu lugar está aqui.' : 'Pode chegar.';
  $('auth-description').textContent = signup ? 'Crie sua conta para participar do mural.' : 'Entre na sua conta para abrir o mural.';
  $('auth-submit').textContent = signup ? 'Criar minha conta ↗' : 'Abrir meu mural ↗';
}
$('login-tab').addEventListener('click', () => authMode(false));
$('signup-tab').addEventListener('click', () => authMode(true));
$('auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!auth || authBusy) return;
  const email = $('auth-email').value.trim(), password = $('auth-password').value;
  if (signup && password !== $('auth-confirm').value) {
    notify('As senhas precisam ser iguais.', true);
    $('auth-confirm').focus();
    return;
  }
  authBusy = true;
  $('auth-fields').disabled = true;
  $('login-tab').disabled = $('signup-tab').disabled = true;
  notify(signup ? 'Criando sua conta…' : 'Entrando no mural…');
  try {
    if (signup) await authAPI.createUserWithEmailAndPassword(auth, email, password);
    else await authAPI.signInWithEmailAndPassword(auth, email, password);
    $('auth-form').reset();
  } catch (error) { notify(errorText(error), true); }
  finally {
    authBusy = false;
    $('auth-fields').disabled = false;
    $('login-tab').disabled = $('signup-tab').disabled = false;
  }
});
$('logout').addEventListener('click', async () => {
  $('logout').disabled = true;
  try { await authAPI.signOut(auth); }
  catch (error) { notify(errorText(error), true); }
  finally { $('logout').disabled = false; }
});

function resetEditor() {
  editingId = null;
  $('note-form').reset();
  $('editor-heading').textContent = 'Um novo bilhetim';
  $('save-note').textContent = 'Pendurar no mural ↗';
  notify('', false, 'form-message');
}
function controls() {
  $('new-note').disabled = !ready || busy;
  $('note-fields').disabled = busy;
  $('close-dialog').disabled = busy;
}
function openEditor(note = null) {
  if (!ready || busy || !user) return;
  if (note && note.authorId !== user.uid) return;
  resetEditor();
  if (note) {
    editingId = note.id;
    $('note-title').value = note.title;
    $('note-body').value = note.body;
    $('note-category').value = note.category;
    const color = document.querySelector('input[name="color"][value="' + note.color + '"]');
    if (color) color.checked = true;
    $('editor-heading').textContent = 'Ajustar este bilhete';
    $('save-note').textContent = 'Salvar alterações';
  }
  $('note-dialog').showModal();
  $('note-title').focus();
}
function closeEditor() {
  if (!busy) $('note-dialog').close();
}
$('new-note').addEventListener('click', () => openEditor());
$('cancel-edit').addEventListener('click', closeEditor);
$('close-dialog').addEventListener('click', closeEditor);
$('note-dialog').addEventListener('cancel', (event) => { if (busy) event.preventDefault(); });
$('note-dialog').addEventListener('close', resetEditor);

// Resultados de uma sessão antiga não atualizam a tela de outra conta.
async function write(operation, successText, inDialog = false) {
  if (!user || !ready || busy) return;
  const activeSession = session;
  busy = true;
  controls();
  render();
  const target = inDialog ? 'form-message' : 'message';
  notify('Salvando no Firebase… Aguarde a confirmação do servidor.', false, target);
  try {
    await operation();
    if (activeSession !== session) return;
    if (inDialog) $('note-dialog').close();
    notify(successText);
  } catch (error) {
    if (activeSession === session) notify(errorText(error), true, target);
  } finally {
    if (activeSession === session) {
      busy = false;
      controls();
      render();
    }
  }
}
$('note-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!user || busy || !ready) return;
  const title = $('note-title').value.trim(), body = $('note-body').value.trim();
  if (!title || !body) {
    notify('Preencha o título e a mensagem do recado.', true, 'form-message');
    (!title ? $('note-title') : $('note-body')).focus();
    return;
  }
  if (!navigator.onLine) {
    notify('Você está sem internet. Reconecte para publicar seu recado.', true, 'form-message');
    return;
  }
  const data = {
    title, body,
    category: $('note-category').value,
    color: document.querySelector('input[name="color"]:checked').value,
    updatedAt: dbAPI.serverTimestamp()
  };
  const id = editingId;
  const ref = id ? dbAPI.doc(db, 'recados', id) : dbAPI.collection(db, 'recados');
  if (!id) {
    data.authorId = user.uid;
    data.authorName = (user.displayName || user.email.split('@')[0]).replace(/[._-]+/g, ' ').trim().slice(0, 40) || 'Pessoa do mural';
    data.createdAt = dbAPI.serverTimestamp();
  }
  void write(() => id ? dbAPI.updateDoc(ref, data) : dbAPI.addDoc(ref, data), id ? 'Recado atualizado.' : 'Seu recado já está no mural!', true);
});

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function normalized(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}
function render() {
  const query = normalized($('search').value.trim());
  const visible = notes.filter((note) =>
    (filter === 'all' || note.category === filter) &&
    normalized(note.title + ' ' + note.body + ' ' + note.authorName).includes(query)
  );
  $('count').textContent = !ready ? 'Aguardando o banco…' : visible.length + (visible.length === 1 ? ' bilhete à vista' : ' bilhetes à vista') + ' · ' + notes.length + ' no mural';
  $('empty').hidden = visible.length > 0;
  $('empty-title').textContent = !ready ? 'Preparando o mural' : notes.length ? 'Nenhum bilhete por aqui' : 'Quem deixa o primeiro recado?';
  $('empty-description').textContent = !ready ? 'Aguardando acesso ao banco de dados.' : notes.length ? 'Tente outra busca ou escolha outro filtro.' : 'Clique em “Escrever recado” e inaugure o nosso mural.';
  const fragment = document.createDocumentFragment();
  for (const note of visible) {
    const color = paperColors.includes(note.color) ? note.color : 'mel';
    const card = element('li', 'note ' + color);
    const top = element('div', 'note-category');
    top.append(element('span', '', categories[note.category] || 'Recado'));
    const date = note.createdAt && typeof note.createdAt.toDate === 'function' ? note.createdAt.toDate() : null;
    top.append(element('span', '', date ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date) : 'Salvando…'));
    card.append(top, element('h3', '', note.title), element('p', 'note-body', note.body));
    const own = user && note.authorId === user.uid;
    card.append(element('div', 'note-author', 'Por ' + (own ? 'você' : note.authorName)));
    if (own) {
      const actions = element('div', 'note-actions');
      const edit = element('button', '', 'Editar');
      edit.type = 'button'; edit.disabled = busy || !ready;
      edit.setAttribute('aria-label', 'Editar recado ' + note.title);
      edit.addEventListener('click', () => openEditor(note));
      const remove = element('button', '', 'Excluir');
      remove.type = 'button'; remove.disabled = busy || !ready;
      remove.setAttribute('aria-label', 'Excluir recado ' + note.title);
      remove.addEventListener('click', () => {
        if (!window.confirm('Excluir o recado "' + note.title + '"? Esta ação não pode ser desfeita.')) return;
        const ref = dbAPI.doc(db, 'recados', note.id);
        void write(() => dbAPI.deleteDoc(ref), 'Recado retirado do mural.');
      });
      actions.append(edit, remove);
      card.append(actions);
    }
    fragment.append(card);
  }
  $('note-list').replaceChildren(fragment);
}
$('search').addEventListener('input', render);
document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  render();
}));

function sessionChanged(currentUser) {
  session += 1;
  const activeSession = session;
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  user = currentUser;
  notes = [];
  busy = false;
  ready = false;
  if ($('note-dialog').open) $('note-dialog').close();
  resetEditor();
  $('search').value = '';
  filter = 'all';
  document.querySelectorAll('[data-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.filter === 'all')));
  $('auth-view').hidden = !!user;
  $('dashboard').hidden = !user;
  $('logout').hidden = !user;
  $('account').textContent = user ? 'Você entrou como ' + user.email : '';
  notify();
  controls();
  render();
  if (!user) return;
  $('sync').textContent = 'Conectando…';
  const query = dbAPI.query(dbAPI.collection(db, 'recados'), dbAPI.orderBy('createdAt', 'desc'));
  unsubscribe = dbAPI.onSnapshot(query, { includeMetadataChanges: true }, (snapshot) => {
    if (activeSession !== session) return;
    notes = snapshot.docs.map((document) => ({ ...document.data(), id: document.id }));
    ready = true;
    if (editingId && !notes.some((note) => note.id === editingId)) {
      $('note-dialog').close();
      notify('O recado em edição foi removido em outra aba.');
    }
    $('sync').textContent = snapshot.metadata.hasPendingWrites ? 'Aguardando gravação…' : snapshot.metadata.fromCache ? 'Aguardando conexão…' : 'Mural atualizado';
    controls();
    render();
  }, (error) => {
    if (activeSession !== session) return;
    ready = false;
    notes = [];
    controls();
    render();
    $('sync').textContent = 'Falha na conexão';
    $('empty-title').textContent = 'Não foi possível abrir o mural';
    $('empty-description').textContent = 'Confira as regras do Firestore e atualize a página.';
    notify(errorText(error), true);
  });
}
async function initialize() {
  try {
    const settings = await import('./firebase-config.js');
    const config = settings.firebaseConfig;
    if (['apiKey', 'authDomain', 'projectId', 'appId'].some((key) => !config || typeof config[key] !== 'string' || !config[key].trim() || /COLE_|SEU_PROJETO/.test(config[key]))) {
      $('setup').hidden = false;
      notify('Siga o README para conectar o novo projeto Firebase.');
      return;
    }
    const [appAPI, authentication, firestore] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js')
    ]);
    authAPI = authentication; dbAPI = firestore;
    const app = appAPI.initializeApp(config);
    auth = authAPI.getAuth(app); db = dbAPI.getFirestore(app);
    // Ativado somente pelo servidor de testes locais, nunca pela configuração entregue.
    if (settings.useEmulators === true) {
      if (!['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error('Emuladores apenas em localhost.');
      authAPI.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      dbAPI.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
    await authAPI.setPersistence(auth, authAPI.browserSessionPersistence);
    authAPI.onAuthStateChanged(auth, sessionChanged, (error) => notify(errorText(error), true));
    $('auth-fields').disabled = false;
  } catch (error) {
    console.error('Falha ao iniciar:', error.code || error.name);
    notify('Não foi possível iniciar. Use o Live Server e confira a conexão e o arquivo firebase-config.js.', true);
  }
}
void initialize();
