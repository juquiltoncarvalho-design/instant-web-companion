# Casa Inteligente: várias contas, segurança e administração

## O que vais ver
1. **Página de entrada** (/auth): criar conta e entrar com email e palavra-passe, ou com Google. Palavras-passe fracas ou que já foram divulgadas na Internet são recusadas. Há página para recuperar a palavra-passe.
2. **Cada pessoa tem a sua casa**: luzes, janelas, sirene, registo e conversas com a Ana ficam separados por conta. Ninguém vê a casa de outra pessoa.
3. **Membros da casa**: o dono convida familiares por email e escolhe o papel de cada um: Dono, Familiar (pode controlar) ou Visitante (só vê). Quando alguém se muda, o dono tira-lhe o acesso e fica registado quem entrou, quem saiu e quando.
4. **Avisos ao dono (auditoria)**: cada alteração feita por outra pessoa (abrir janela, ligar a sirene, mudar membros) fica num registo com quem, o quê e quando. O dono recebe um aviso no sininho da app.
5. **Ações críticas confirmadas**: desligar a sirene, abrir todas as janelas e remover membros pedem a palavra-passe outra vez.
6. **Verificação em dois passos (2FA)**: nas definições da conta, ligar um código de uma app como o Google Authenticator. Depois disso, o código é pedido sempre que entrares.
7. **Painel do Administrador** (/admin): só para administradores. Mostra utilizadores, casas e registo geral. Pode bloquear contas.
8. **Privacidade**: página /privacidade com a política (que dados guardamos, quem os vê, como apagar a conta) e um botão para apagar a conta e todos os dados.
9. **Presença em casa**: cartão "Quem está em casa" com sensores por divisão. Para já, o estado é mudado à mão ou pela Ana. O ESP32 vai poder enviar o estado de um sensor de movimento real. Sensores Samsung SmartThings ficam para depois, porque precisam de uma conta deles.

## Limites
- As atualizações da app chegam sozinhas quando publicas. Não há nada a instalar.
- A chamada automática para o 923 346 087 continua por fazer (falta o Twilio).

## Detalhes técnicos
- Cloud Auth: email/password + Google + Lovable; HIBP ligado; MFA TOTP do Supabase (verificação AAL2 no guard).
- Tabelas: profiles, homes, home_members(role owner/member/viewer), user_roles(admin), home_state por home_id, ai_messages por home_id, audit_log, notifications, presence_sensors. RLS com funções security definer is_home_member/home_role/has_role.
- Migração do registo único atual para a casa do primeiro utilizador.
- Rotas: /auth, /reset-password, /privacidade públicas; dashboard, /pomodoro, /conta, /membros, /admin em _authenticated.
- Endpoints /api/ai-command, /api/stt, /api/tts passam a exigir sessão.
- Trigger de auditoria em home_state que grava o diff e cria notificação para o dono quando o autor não é o dono.
