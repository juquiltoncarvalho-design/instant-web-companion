# Pomodoro IoT - Firmware ESP32

Este diretorio contem o firmware Arduino (C++) para o ESP32 que sincroniza um
dispositivo fisico (LED + buzzer) com o temporizador Pomodoro do site.

## Como funciona

O ESP32 faz *polling* HTTP a cada 3 segundos ao endpoint `/api/pomodoro` do site.
O servidor devolve o estado atual do temporizador em JSON, por exemplo:

```json
{
  "status": "running",
  "mode": "focus",
  "remainingSeconds": 1140,
  "deviceOnline": true
}
```

Com base neste estado, o ESP32:

- **Foco a correr** — LED aceso de forma continua.
- **Pausa a correr** — LED a piscar lentamente.
- **Em pausa (paused)** — LED a piscar rapidamente.
- **Sessao terminada (finished)** — toca o buzzer tres vezes.
- **Parado (idle)** — LED apagado.

Sempre que o ESP32 comunica, envia `?device=1`, o que faz o site mostrar o
estado **ONLINE**. Se o dispositivo deixar de comunicar durante mais de 10
segundos, o site passa a mostrar **OFFLINE**.

## Ligacoes (wiring)

| Componente | Pino ESP32 |
|------------|-----------|
| LED (+ resistencia 220Ω) | GPIO 2 |
| Buzzer                    | GPIO 4 |
| GND dos componentes       | GND    |

> O GPIO 2 corresponde tipicamente ao LED interno da maioria das placas ESP32
> DevKit, por isso pode testar sem ligar nada.

## Configuracao

As credenciais WiFi estao no ficheiro `secrets.h`, na mesma pasta do `.ino`.
Esse ficheiro **nao e enviado para o GitHub** (contem a palavra-passe da rede).
Se usar o projeto noutro computador, crie `esp32/secrets.h` com:

```cpp
#define WIFI_SSID "nome_da_rede"
#define WIFI_PASSWORD "palavra_passe"
#define HOTSPOT_SSID "HOTSPOT_TELEMOVEL"
#define HOTSPOT_PASSWORD "PASSWORD_HOTSPOT"
```

O `.ino` usa esses valores e mantem a URL da API:

```cpp
const RedeWiFi REDES_WIFI[] = {
  { WIFI_SSID, WIFI_PASSWORD },           // 1) WiFi de casa
  { HOTSPOT_SSID, HOTSPOT_PASSWORD },     // 2) Hotspot do telemovel
};

const char *API_BASE_URL = "https://instant-web-companion.vercel.app";
```

### Redes por ordem de preferencia (fallback)

O ESP32 tenta as redes pela ordem da lista. Se o **WiFi de casa** estiver
em baixo, ele liga automaticamente ao **hotspot do telemovel**. Assim pode
continuar a controlar a casa pela rede do telemovel sem ficar offline.

- Preencha o SSID e a password de cada rede que quer usar.
- Pode adicionar mais redes a lista (ex.: outro router, repetidor).
- Para usar o hotspot: ative o "Ponto de acesso / Hotspot" no telemovel e
  copie o nome da rede e a password para a segunda entrada da lista.
- Se so quiser uma rede, basta deixar uma entrada na lista.

### URL da API

- Em **producao**, use o dominio publicado, ex.:
  `https://instant-web-companion.vercel.app`.
- Em **desenvolvimento local**, use o IP do seu computador na rede local,
  por exemplo `http://192.168.1.100:8080`. O telemovel/ESP32 e o computador
  tem de estar na mesma rede WiFi (ou no mesmo hotspot).

## Bibliotecas necessarias

Instale atraves do Gestor de Bibliotecas do Arduino IDE:

- **ArduinoJson** (Benoit Blanchon)

As bibliotecas `WiFi` e `HTTPClient` ja vem incluidas no core do ESP32.

## Passos no Arduino IDE

1. Instale o core **esp32** da Espressif (Gestor de Placas).
2. Selecione a placa **ESP32 Dev Module**.
3. Instale a biblioteca **ArduinoJson**.
4. Abra `pomodoro_esp32.ino` e ajuste as constantes de configuracao.
5. Ligue o ESP32 por USB, selecione a porta correta e carregue o codigo.
6. Abra o Monitor Serie a 115200 baud para ver os registos.

## Nota sobre o buzzer

A funcao `tone()` e suportada nas versoes recentes do core do ESP32 (2.x e
superior). Se usar um core antigo e a compilacao falhar, atualize o core ou
substitua `tone()` por uma implementacao com `ledcWriteTone()`.
