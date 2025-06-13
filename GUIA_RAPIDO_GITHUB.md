# ⚡ Guia Rápido - GitHub Pages (SEM NPM)

## 🎯 **Resumo em 5 Passos**

### **1. Configure Firebase Backend (10 min)**
1. Acesse: https://console.firebase.google.com/
2. **Criar projeto** → Nome: `sistema-certificados`
3. **Authentication** → Começar → E-mail/senha → Ativar
4. **Firestore** → Criar banco → Modo teste → southamerica-east1
5. **Storage** → Começar → Modo teste
6. **Configurações** (⚙️) → Adicionar app Web → Copiar `firebaseConfig`

### **2. Prepare Arquivos (2 min)**
1. **Renomear**: `index-firebase.html` → `index.html`
2. **Editar** `firebase-config.js` → Colar sua configuração
3. **Arquivos necessários**:
   - `index.html`
   - `style.css`
   - `firebase-script.js`
   - `firebase-config.js` ✏️ (editar)
   - `atividades_AG.json`
   - `grupos_AG.json`

### **3. Upload no GitHub (3 min)**
1. **GitHub.com** → **New repository** → Nome: `sistema-certificados`
2. **Público** ✅ → **Create repository**
3. **Add file** → **Upload files** → Arrastar todos os 6 arquivos
4. **Commit changes**

### **4. Ativar GitHub Pages (1 min)**
1. **Settings** → **Pages**
2. **Source**: Deploy from branch
3. **Branch**: main → **Save**

### **5. Configurar Segurança (5 min)**
1. **Firebase Console** → **Authentication** → **Sign-in method**
2. **Authorized domains** → **Add domain**: `SEUUSUARIO.github.io`
3. **Firestore** → **Rules** → Colar conteúdo do `firestore.rules`
4. **Storage** → **Rules** → Colar conteúdo do `storage.rules`

## ✅ **Resultado**

**URL**: `https://SEUUSUARIO.github.io/sistema-certificados`

## 🧪 **Teste Rápido**

1. **Abrir URL** → Aguardar 2-5 minutos
2. **Criar conta** aluno
3. **Enviar certificado**
4. **Criar conta** professor
5. **Aprovar certificado**

## 🔧 **Para Atualizações**

1. **Editar** arquivo localmente
2. **Upload** no GitHub (substituir)
3. **Aguardar** 2 minutos → Sistema atualizado!

---

## 📞 **Links Importantes**

- **Firebase Console**: https://console.firebase.google.com/
- **GitHub**: https://github.com/
- **Sua URL**: `https://SEUUSUARIO.github.io/sistema-certificados`

---

**🚀 Total: ~20 minutos para sistema online completo!** 