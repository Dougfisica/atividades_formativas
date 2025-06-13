# 🎓 Sistema de Validação de Certificados - Atividades Formativas

## 🆓 Versão 100% Gratuita - GitHub Pages + Firebase

Sistema completo para validação de certificados de atividades formativas, totalmente gratuito usando GitHub Pages e Firebase (sem Storage).

### ✨ **Funcionalidades Principais**

#### 👨‍🎓 **Para Alunos:**
- 🔐 **Login seguro** com e-mail/senha
- 📁 **Upload de certificados** (PDF, JPG, PNG até 800KB)
- 📊 **Progresso visual** por grupos de atividades
- ⏱️ **Controle de horas** com validação automática
- 📱 **Interface responsiva** para mobile

#### 👨‍🏫 **Para Professores:**
- ✅ **Validação de certificados** em tempo real
- 💬 **Comentários** para aprovação/rejeição
- 📈 **Relatórios completos** de todos os alunos
- 📊 **Acompanhamento individual** do progresso
- 📄 **Exportação em CSV**

### 🏗️ **Arquitetura**

```
GitHub Pages (Frontend)    +    Firebase (Backend)
├── HTML/CSS/JS            ├── Authentication (gratuito)
├── Hosting gratuito       ├── Firestore (gratuito)
└── Deploy automático      └── Base64 para arquivos
```

### 📁 **Arquivos do Projeto**

#### **🔧 Sistema:**
- `index.html` - Interface principal
- `style.css` - Estilos responsivos
- `firebase-script.js` - Lógica completa (sem Storage)
- `firebase-config.js` - Configuração Firebase

#### **📊 Dados:**
- `atividades_AG.json` - 25 atividades configuradas
- `grupos_AG.json` - 6 grupos com limites de horas
- `firestore.rules` - Regras de segurança

#### **📖 Documentação:**
- `SOLUCAO_100_GRATUITA.md` - Guia completo da solução
- `GUIA_RAPIDO_GITHUB.md` - Deploy em 20 minutos

### 🚀 **Deploy Rápido (20 minutos)**

#### **1. Configure Firebase (10 min)**
1. Acesse: https://console.firebase.google.com/
2. Criar projeto → Ativar Authentication + Firestore
3. Copiar configuração → Editar `firebase-config.js`

#### **2. GitHub Pages (5 min)**
1. Criar repositório público no GitHub
2. Upload de todos os arquivos
3. Settings → Pages → Ativar

#### **3. Configurar Segurança (5 min)**
1. Firebase → Authentication → Adicionar domínio GitHub
2. Firestore → Rules → Copiar conteúdo do `firestore.rules`

### ✅ **Vantagens da Versão Gratuita**

- 🆓 **Totalmente gratuito** para sempre
- 🌐 **URL profissional**: `seuusuario.github.io/projeto`
- 🔒 **Segurança empresarial** com Firebase Auth
- 📱 **Mobile first** e responsivo
- ⚡ **Deploy automático** com git push
- 📊 **Banco na nuvem** com Firestore
- 🔄 **Tempo real** - mudanças instantâneas

### 📏 **Especificações Técnicas**

#### **Limites (mais que suficientes):**
- **Arquivo**: Máximo 800KB (PDF/JPG/PNG)
- **Compressão automática** para imagens
- **Firestore**: 50k leituras/dia + 20k escritas/dia
- **GitHub Pages**: Ilimitado para repos públicos

#### **Grupos de Atividades:**
- **Grupo I**: Disciplinas (100h máximo)
- **Grupo II**: Pesquisa (100h máximo)  
- **Grupo III**: Extensão (100h máximo)
- **Grupo IV**: Monitoria (100h máximo)
- **Grupo V**: Vivência profissional (40h máximo)
- **Grupo VI**: Outras atividades (100h máximo)

### 🧪 **Teste Local**

```bash
# Servidor local para teste
python -m http.server 8000
# Acesse: http://localhost:8000
```

### 🎯 **Próximos Passos**

1. **Leia**: `GUIA_RAPIDO_GITHUB.md`
2. **Configure**: Firebase Backend
3. **Deploy**: GitHub Pages
4. **Teste**: Sistema funcionando!

---

## 📞 **Suporte**

- **Documentação**: `SOLUCAO_100_GRATUITA.md`
- **Deploy rápido**: `GUIA_RAPIDO_GITHUB.md`
- **Firebase Console**: https://console.firebase.google.com/
- **GitHub Pages**: https://pages.github.com/

---

**🚀 Sistema profissional, gratuito e pronto para produção!** 