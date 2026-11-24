/*
 * ============================================================
 *  Pomodoro IoT - Firmware ESP32
 * ============================================================
 *
 *  Este firmware liga o ESP32 a uma rede WiFi e comunica com a
 *  API do site Pomodoro. A cada poucos segundos faz um pedido
 *  HTTP para ler o estado do temporizador e reage em conformidade:
 *
 *    - Acende o LED enquanto o temporizador esta a correr (modo foco).
 *    - Faz piscar o LED durante a pausa.
 *    - Toca o buzzer quando a sessao termina.
 *
 *  A comunicacao e feita por POLLING: o ESP32 pergunta o estado
 *  ao servidor a cada INTERVALO_POLLING_MS milissegundos.
 *
 *  Bibliotecas necessarias (Gestor de Bibliotecas do Arduino IDE):
 *    - WiFi (incluida no core do ESP32)
 *    - HTTPClient (incluida no core do ESP32)
 *    - ArduinoJson (instalar via Gestor de Bibliotecas)
 *
 *  Placa: "ESP32 Dev Module" (instalar o core esp32 da Espressif)
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ------------------------------------------------------------
//  CONFIGURACAO - ajuste estes valores ao seu ambiente
// ------------------------------------------------------------

// Redes WiFi por ordem de preferencia.
// O ESP32 tenta a primeira; se falhar, tenta a seguinte (ex.: hotspot
// do telemovel quando o WiFi de casa esta em baixo).
// Preencha o SSID e a password de cada rede que quer usar.
struct RedeWiFi {
  const char *ssid;
  const char *password;
};

const RedeWiFi REDES_WIFI[] = {
  { "O_SEU_WIFI", "A_SUA_PASSWORD" },              // 1) WiFi de casa
  { "HOTSPOT_TELEMOVEL", "PASSWORD_HOTSPOT" },     // 2) Hotspot do telemovel (alternativa)
};
const int NUM_REDES = sizeof(REDES_WIFI) / sizeof(REDES_WIFI[0]);

// URL base da API (substitua pelo endereco do seu site/deploy).
// Em desenvolvimento local, use o IP do computador na rede, ex.:
//   "http://192.168.1.100:8080"
// Em producao, use o dominio publicado, ex.:
//   "https://instant-web-companion.lovable.app"
const char *API_BASE_URL = "https://instant-web-companion.lovable.app";

// Pinos do hardware
const int PINO_LED = 2;    // LED interno do ESP32 (ou LED externo)
const int PINO_BUZZER = 4; // Buzzer passivo/ativo

// Intervalo de polling em milissegundos (entre 2000 e 5000 conforme o pedido)
const unsigned long INTERVALO_POLLING_MS = 3000;

// ------------------------------------------------------------
//  ESTADO LOCAL
// ------------------------------------------------------------

String estadoAtual = "idle";     // idle | running | paused | finished
String modoAtual = "focus";      // focus | break
long segundosRestantes = 0;      // tempo restante reportado pelo servidor
String estadoAnterior = "idle";  // para detetar a transicao para "finished"

unsigned long ultimoPolling = 0;
unsigned long ultimoPiscar = 0;
bool ledLigado = false;

// Controlo das tentativas de ligacao ao WiFi
unsigned long ultimaTentativaWiFi = 0;
const unsigned long INTERVALO_TENTATIVA_WIFI_MS = 5000; // espera entre rondas de tentativas
const int TENTATIVAS_POR_REDE = 20;                     // 20 x 500 ms = 10 s por rede
int redeAtual = -1;                                     // indice da rede ligada (-1 = nenhuma)

// ------------------------------------------------------------
//  SETUP
// ------------------------------------------------------------

void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(PINO_LED, OUTPUT);
  pinMode(PINO_BUZZER, OUTPUT);
  digitalWrite(PINO_LED, LOW);
  digitalWrite(PINO_BUZZER, LOW);

  ligarWiFi();
}

// ------------------------------------------------------------
//  LOOP PRINCIPAL
// ------------------------------------------------------------

void loop() {
  // Reconectar ao WiFi se a ligacao cair (com espera entre rondas de tentativas)
  if (WiFi.status() != WL_CONNECTED) {
    redeAtual = -1;
    unsigned long agora = millis();
    if (agora - ultimaTentativaWiFi >= INTERVALO_TENTATIVA_WIFI_MS) {
      ultimaTentativaWiFi = agora;
      ligarWiFi();
    }
  }

  // Fazer polling ao servidor no intervalo definido
  unsigned long agora = millis();
  if (agora - ultimoPolling >= INTERVALO_POLLING_MS) {
    ultimoPolling = agora;
    lerEstadoDoServidor();
  }

  // Atualizar o hardware (LED/buzzer) conforme o estado atual
  atualizarHardware();
}

// ------------------------------------------------------------
//  WIFI
// ------------------------------------------------------------

void ligarWiFi() {
  WiFi.mode(WIFI_STA);

  // Tenta cada rede por ordem de preferencia (casa -> hotspot do telemovel).
  for (int i = 0; i < NUM_REDES; i++) {
    Serial.print("A ligar ao WiFi: ");
    Serial.println(REDES_WIFI[i].ssid);

    WiFi.disconnect();
    WiFi.begin(REDES_WIFI[i].ssid, REDES_WIFI[i].password);

    int tentativas = 0;
    while (WiFi.status() != WL_CONNECTED && tentativas < TENTATIVAS_POR_REDE) {
      delay(500);
      Serial.print(".");
      tentativas++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      redeAtual = i;
      Serial.println();
      Serial.print("WiFi ligado (");
      Serial.print(REDES_WIFI[i].ssid);
      Serial.print("). IP: ");
      Serial.println(WiFi.localIP());
      return;
    }

    Serial.println();
    Serial.print("Falha na rede ");
    Serial.print(REDES_WIFI[i].ssid);
    Serial.println(". A tentar a seguinte...");
  }

  Serial.println("Nenhuma rede disponivel. Nova tentativa mais tarde.");
}

// ------------------------------------------------------------
//  COMUNICACAO COM A API
// ------------------------------------------------------------

void lerEstadoDoServidor() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  // O parametro ?device=1 regista o "heartbeat" para o site mostrar ONLINE
  String url = String(API_BASE_URL) + "/api/pomodoro?device=1";

  http.begin(url);
  http.addHeader("Accept", "application/json");
  int codigo = http.GET();

  if (codigo == 200) {
    String payload = http.getString();

    // Documento JSON. Ajuste o tamanho se adicionar mais campos.
    StaticJsonDocument<2048> doc;
    DeserializationError erro = deserializeJson(doc, payload);

    if (!erro) {
      estadoAnterior = estadoAtual;
      estadoAtual = String((const char *)doc["status"]);
      modoAtual = String((const char *)doc["mode"]);
      segundosRestantes = doc["remainingSeconds"] | 0;

      Serial.print("Estado: ");
      Serial.print(estadoAtual);
      Serial.print(" | Modo: ");
      Serial.print(modoAtual);
      Serial.print(" | Restante: ");
      Serial.print(segundosRestantes);
      Serial.println("s");

      // Detetar a transicao para "finished" e tocar o buzzer uma vez
      if (estadoAtual == "finished" && estadoAnterior != "finished") {
        tocarBuzzerFim();
      }
    } else {
      Serial.print("Erro ao interpretar JSON: ");
      Serial.println(erro.c_str());
    }
  } else {
    Serial.print("Erro HTTP: ");
    Serial.println(codigo);
  }

  http.end();
}

// Envia um comando para o servidor (opcional - permite ao ESP32 controlar o timer,
// por exemplo atraves de um botao fisico). Exemplo de uso: enviarComando("start").
void enviarComando(const char *acao) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/pomodoro";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String corpo = String("{\"action\":\"") + acao + "\"}";
  int codigo = http.POST(corpo);

  Serial.print("Comando '");
  Serial.print(acao);
  Serial.print("' enviado. Resposta HTTP: ");
  Serial.println(codigo);

  http.end();
}

// ------------------------------------------------------------
//  CONTROLO DO HARDWARE
// ------------------------------------------------------------

void atualizarHardware() {
  if (estadoAtual == "running") {
    if (modoAtual == "focus") {
      // Durante o foco: LED aceso de forma continua
      digitalWrite(PINO_LED, HIGH);
    } else {
      // Durante a pausa: LED a piscar lentamente
      piscarLed(800);
    }
  } else if (estadoAtual == "paused") {
    // Em pausa: LED a piscar rapidamente
    piscarLed(250);
  } else {
    // idle ou finished: LED apagado
    digitalWrite(PINO_LED, LOW);
    ledLigado = false;
  }
}

void piscarLed(unsigned long intervalo) {
  unsigned long agora = millis();
  if (agora - ultimoPiscar >= intervalo) {
    ultimoPiscar = agora;
    ledLigado = !ledLigado;
    digitalWrite(PINO_LED, ledLigado ? HIGH : LOW);
  }
}

// Toca uma sequencia sonora quando a sessao termina
void tocarBuzzerFim() {
  Serial.println(">>> Sessao concluida! A tocar o buzzer.");
  // Tres bips curtos
  for (int i = 0; i < 3; i++) {
    tone(PINO_BUZZER, 1000, 150); // frequencia 1000 Hz durante 150 ms
    delay(200);
  }
  noTone(PINO_BUZZER);
  digitalWrite(PINO_BUZZER, LOW);
}
