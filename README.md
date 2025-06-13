# Sistema de Validação de Certificados - Atividades Formativas

Sistema web para upload e validação de certificados de atividades formativas com interface para alunos e professores.

## 📋 Funcionalidades

### Para Alunos:
- ✅ Login simples com nome/email
- ✅ Upload de certificados (.pdf, .jpg, .png)
- ✅ Seleção de atividade vinculada ao certificado
- ✅ Solicitação de horas para validação
- ✅ Acompanhamento do status dos certificados
- ✅ Visualização do progresso por grupos de atividades
- ✅ Exclusão de certificados pendentes

### Para Professores:
- ✅ Interface de validação de certificados
- ✅ Aprovação/rejeição com comentários
- ✅ Definição de horas validadas
- ✅ Visualização dos arquivos enviados
- ✅ Controle de limites por grupo de atividades

## 🚀 Como Usar

### 1. Acessar o Sistema
1. Abra o arquivo `index.html` no navegador
2. Escolha o tipo de usuário (Aluno ou Professor)
3. Digite seu nome ou email
4. Clique em "Entrar"

### 2. Área do Aluno

#### Enviando um Certificado:
1. Selecione o arquivo do certificado
2. Digite uma descrição
3. Escolha a atividade correspondente
4. Informe as horas que deseja validar
5. Clique em "Enviar Certificado"

#### Acompanhando o Progresso:
- Na parte superior, veja o progresso por grupos
- Na lista de certificados, acompanhe o status:
  - **Pendente**: Aguardando validação
  - **Aprovado**: Certificado aprovado com horas validadas
  - **Rejeitado**: Certificado rejeitado com comentário

### 3. Área do Professor

#### Validando Certificados:
1. Visualize a lista de certificados pendentes
2. Clique em "Ver Certificado" para examinar o arquivo
3. Adicione um comentário (obrigatório para rejeição)
4. Defina as horas a validar (para aprovação)
5. Clique em "Aprovar" ou "Rejeitar"

## 📊 Grupos de Atividades

O sistema trabalha com 6 grupos de atividades formativas:

- **Grupo I**: Atividades Formativas de Ensino (max: 100h)
- **Grupo II**: Atividades Formativas de Pesquisa e Inovação (max: 100h)
- **Grupo III**: Atividades Formativas de Extensão e Cultura (max: 100h)
- **Grupo IV**: Atividades Formativas voltadas à Profissionalização (max: 100h)
- **Grupo V**: Atividades Formativas de Representação (max: 40h)
- **Grupo VI**: Eventos Acadêmico-Científicos (max: 100h)

## 🔧 Validações Implementadas

### Aluno:
- Limite máximo de horas por atividade
- Limite máximo de horas por grupo
- Validação de arquivos (PDF, JPG, PNG)
- Campos obrigatórios

### Professor:
- Horas validadas não podem exceder horas solicitadas
- Comentário obrigatório para rejeição
- Verificação de limites de grupo antes da aprovação

## 💾 Persistência de Dados

O sistema utiliza `localStorage` para armazenar:
- Dados do usuário atual
- Lista de certificados enviados
- Status de validação

**Nota**: Os dados são mantidos apenas no navegador local. Para uso em produção, seria necessário implementar um backend.

## 📁 Estrutura de Arquivos

```
/
├── index.html          # Página principal
├── style.css           # Estilos do sistema
├── script.js           # Lógica JavaScript
├── atividades_AG.json  # Configuração das atividades
├── grupos_AG.json      # Configuração dos grupos
└── README.md           # Este arquivo
```

## 🎨 Design e Interface

- Interface responsiva com Bootstrap 5
- Design moderno com gradientes e animações
- Ícones Font Awesome
- Alertas informativos
- Modal para visualização de certificados

## 🔍 Recursos Adicionais

### Visualização de Certificados:
- PDFs são exibidos em iframe
- Imagens são mostradas diretamente
- Download de arquivos disponível

### Progresso Visual:
- Barras de progresso por grupo
- Percentual de conclusão
- Cores indicativas de status

### Responsividade:
- Funciona em desktop, tablet e mobile
- Layout adaptativo
- Menus colapsáveis

## 🚨 Limitações Atuais

1. **Sem autenticação real**: Login apenas com nome
2. **Dados locais**: Usa localStorage (não compartilhado entre dispositivos)
3. **Sem backup**: Dados podem ser perdidos se localStorage for limpo
4. **Arquivos em base64**: Pode consumir muita memória com arquivos grandes

## 🔮 Melhorias Futuras

- [ ] Autenticação com senha
- [ ] Backend para persistência real
- [ ] Exportação de relatórios em CSV
- [ ] Histórico completo para professores
- [ ] Notificações por email
- [ ] Sistema de permissões mais granular
- [ ] Compressão de arquivos
- [ ] Backup automático dos dados

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se os arquivos JSON estão corretos
2. Confirme que está acessando via servidor web (não file://)
3. Verifique o console do navegador para erros
4. Teste com arquivos pequenos primeiro

## 📜 Licença

Este sistema foi desenvolvido para fins educacionais e pode ser adaptado conforme necessário. 