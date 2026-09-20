#include <WiFiS3.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// --- CONFIGURAZIONE SERVER ---
char serverAddress[] = "10.191.192.27";
int serverPort = 3000;
const char* sensorId = "SENS-ARDUINO-002";

// --- STRUTTURA MEMORIA (EEPROM) ---
struct NetworkCreds {
  bool isSaved;
  char ssid[50];
  char pass[50];
};
NetworkCreds creds;

// --- VARIABILI GLOBALI ---
WiFiServer server(80);
bool isAPMode = false;
unsigned long lastTime = 0;
unsigned long timerDelay = 30000;
WiFiClient nodeClient;

void setup() {
  Serial.begin(115200);
  while (!Serial);

  // Legge la memoria interna per vedere se c'è un Wi-Fi salvato
  EEPROM.get(0, creds);

  // RESETTARE LA MEMORIA
  //creds.isSaved = false;
  //EEPROM.put(0, creds);
  
  // Se ci sono credenziali salvate, salta il portale e tenta la connessione
  if (creds.isSaved) {
    Serial.println("\n[MEMORIA] Credenziali trovate! Tentativo di connessione a: ");
    Serial.println(creds.ssid);
    
    if (connectToHomeWiFi(creds.ssid, creds.pass)) {
      isAPMode = false;
      return;
    } else {
      Serial.println("[MEMORIA] Rete non trovata. Avvio portale d'emergenza...");
    }
  }

  // Se non ci sono credenziali (o sono sbagliate), avvia il Captive Portal
  startAPMode();
}

void loop() {
  if (isAPMode) {
    handleCaptivePortal(); // Ascolta il telefono
  } else {
    handleSensorData();    // Invia dati ad Angular
  }
}

// FUNZIONI DI RETE E LOGICA

bool connectToHomeWiFi(char* targetSSID, char* targetPass) {
  WiFi.disconnect();
  delay(1000);
  
  int attempts = 0;
  int status = WiFi.begin(targetSSID, targetPass);

  while (status != WL_CONNECTED && attempts < 10) {
    delay(2000);
    Serial.print(".");
    status = WiFi.status();
    attempts++;
  }

  if (status == WL_CONNECTED) {
    Serial.println("\n✅ Router agganciato! In attesa di IP (DHCP)...");
    
    IPAddress ip = WiFi.localIP();
    while (ip[0] == 0) {
      delay(500);
      Serial.print(".");
      ip = WiFi.localIP();
    }
    
    Serial.println("\n🎉 SUCCESSO! L'Arduino è online.");
    Serial.print("Indirizzo IP: "); 
    Serial.println(ip);
    return true;
  } 
  
  return false;
}

void startAPMode() {
  isAPMode = true;
  Serial.println("\n--- AVVIO MODALITA' SETUP (AP) ---");
  WiFi.disconnect();
  delay(1000);
  
  int status = WiFi.beginAP("SmartGarden-Setup", "garden123");
  if (status != WL_AP_LISTENING) {
    Serial.println("❌ Creazione AP fallita! Riavvio in corso...");
    delay(3000);
    NVIC_SystemReset();
  }

  server.begin();
  Serial.println("✅ Rete creata! Connettiti a: SmartGarden-Setup");
  Serial.print("Apri il browser all'indirizzo: ");
  Serial.println(WiFi.localIP());
}

void handleCaptivePortal() {
  WiFiClient client = server.available();
  if (client) {
    String currentLine = "";
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        if (c == '\n') {
          if (currentLine.length() == 0) {
            // Invia la grafica del portale
            client.println("HTTP/1.1 200 OK\nContent-type:text/html\n");
            client.print("<html><head><meta name='viewport' content='width=device-width, initial-scale=1.0'></head><body style='font-family: sans-serif; padding: 20px;'>");
            client.print("<h2>SmartGarden Setup</h2>");
            client.print("<form action='/save' method='GET'>");
            client.print("Wi-Fi Nome:<br> <input type='text' name='ssid' style='padding: 8px; margin-bottom: 10px; width: 90%;'><br>");
            client.print("Password:<br> <input type='password' name='pass' style='padding: 8px; margin-bottom: 20px; width: 90%;'><br>");
            client.print("<input type='submit' value='Connetti' style='padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px;'>");
            client.print("</form></body></html>\n");
            break;
          } else {
            if (currentLine.startsWith("GET /save?")) {
              if (currentLine.indexOf("ssid=") != -1 && currentLine.indexOf("&pass=") != -1) {
                
                int ssidStart = currentLine.indexOf("ssid=") + 5;
                int ssidEnd = currentLine.indexOf("&pass=");
                int passStart = ssidEnd + 6;
                int passEnd = currentLine.indexOf(" HTTP/");

                String newSSID = currentLine.substring(ssidStart, ssidEnd);
                String newPass = currentLine.substring(passStart, passEnd);

                newSSID.replace("+", " "); newPass.replace("+", " ");
                newSSID.replace("%20", " "); newPass.replace("%20", " ");

                creds.isSaved = true;
                newSSID.toCharArray(creds.ssid, 50);
                newPass.toCharArray(creds.pass, 50);
                EEPROM.put(0, creds);

                // Conferma visuale sul telefono
                client.println("HTTP/1.1 200 OK\nContent-type:text/html\n");
                client.print("<html><body style='font-family: sans-serif; text-align: center; margin-top: 50px;'>");
                client.print("<h1 style='color: #4CAF50;'>Ricevuto!</h1>");
                client.print("<p>Salvataggio in memoria... L'Arduino si sta riavviando per connettersi.</p>");
                client.print("</body></html>\n");
                
                delay(2000); 
                client.stop();

                Serial.println("\n✅ Dati salvati in EEPROM! Riavvio scheda in corso...");
                delay(1000);
                NVIC_SystemReset(); 
              }
            }
            currentLine = ""; 
          }
        } else if (c != '\r') {
          currentLine += c; 
        }
      }
    }
    client.stop();
  }
}

void handleSensorData() {
  // Invia dati solo allo scadere del timer
  if (millis() - lastTime > timerDelay || lastTime == 0) {
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n[RETE] Invio dati dei sensori al server Node.js...");
      
      if (nodeClient.connect(serverAddress, serverPort)) {
        
        // Generazione di dati
        int umidita_t = random(40, 70); 
        int umidita_a = random(50, 70); 
        int temp = random(20, 28);      
        int luce = random(0, 100000);      

        JsonDocument doc;
        doc["ID_SE"] = sensorId;
        doc["umidita_terreno"] = umidita_t;
        doc["umidita_ambiente"] = umidita_a;
        doc["temperatura"] = temp;
        doc["esposizione_luce"] = luce;

        String jsonPayload;
        serializeJson(doc, jsonPayload);

        // Invio dei dati tramite HTTP POST
        nodeClient.println("POST /dati-sensore HTTP/1.1");
        nodeClient.print("Host: "); nodeClient.println(serverAddress);
        nodeClient.println("Content-Type: application/json");
        nodeClient.println("Connection: close");
        nodeClient.print("Content-Length: "); nodeClient.println(jsonPayload.length());
        nodeClient.println(); 
        nodeClient.println(jsonPayload); 

        Serial.println("✅ Dati inviati con successo! Verifica le Dashboard su Angular.");
        nodeClient.stop();
      } else {
        Serial.println("❌ Errore di connessione al server Node.js.");
      }
    } else {
      Serial.println("⚠️ Wi-Fi disconnesso. In attesa del router...");
    }
    
    lastTime = millis();
  }
}