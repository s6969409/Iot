#ifndef System_h
#define System_h

#ifdef ESP8266
#include <ESP8266WiFi.h>
#else
#include <WiFi.h>
#endif

#include <time.h>
#include <server.h>
#include <EEPROM.h>
#include <Arduino_JSON.h>

class TimerDelay {
  private:
    int setTime;//millis second
    int startTime;
  public:
    TimerDelay() {
      setTime = 0;
      startTime = 0;
    }
    void start(int millisSec) {
      if (setTime == 0) {
        setTime = millisSec;
        startTime = millis();
      }
    }
    void reset() {
      setTime = 0;
    }
    bool isOnTime() {
      if (millis() - startTime >= setTime) {
        setTime = 0;
        return true;
      }
      return false;
    }
};

class LocalTime {
  private:
    int startTime;
    int status = 0;
    const String weeks[7] = {
      "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    };
    int millisecond;

  public:
    time_t ut;
    LocalTime() {
      startTime = millis();
    }
    bool setTime(time_t unix) {
      if (unix < 100000000) return false;
      ut = unix;
      return true;
    }
    void processCycle() {
      millisecond += millis() - startTime;
      startTime = millis();

      while(millisecond >= 1000){
        ut++;
        millisecond -= 1000;
      }
    }
    String getTime() {
      tm* p_tm = localtime(&ut);

      char buffer[100];
      sprintf(buffer, "%d/%d/%d %d:%d:%d\nweek:%s, %d days of the year",
              p_tm->tm_year + 1900, 
              p_tm->tm_mon + 1, //day of the month,start at 1
              p_tm->tm_mday, 
              p_tm->tm_hour, 
              p_tm->tm_min, 
              p_tm->tm_sec,
              weeks[p_tm->tm_wday], //day of the year,start at 0
              p_tm->tm_yday //day of the week,start at 1
              );//p_tm->tm_isdst   //daylight saving time flag, I don't know
      return buffer;
    }
    #pragma region time para get...
    int year(){
      tm* p_tm = localtime(&ut);
      return p_tm->tm_year + 1900;
    }
    int mon(){
      tm* p_tm = localtime(&ut);
      return p_tm->tm_mon + 1;
    }
    int day(){
      tm* p_tm = localtime(&ut);
      return p_tm->tm_mday;
    }
    int hour(){
      tm* p_tm = localtime(&ut);
      return p_tm->tm_hour;
    }
    int min(){
      tm* p_tm = localtime(&ut);
      return p_tm->tm_min;
    }
    int second(){
      tm* p_tm = localtime(&ut);
      return p_tm->tm_sec;
    }
    int wday(){
      tm* p_tm = localtime(&ut);
      return p_tm->tm_wday;
    }
    int yday(){
      tm* p_tm = localtime(&ut);
      return p_tm->tm_yday;
    }
    #pragma endregion
};

class EEPHelper {
    //address 0~1 : for saveDataLength
    //address 2~  : data
  private:
    //SPI_FLASH_SEC_SIZE
    //4096 byte
    int length = 0;
    int saveLength = 1;//unit:byte
    String data = "";

  public:
    EEPHelper() {

    }
    void setup() {
      length = 0;
      Serial.print("EEPROM size:");
      Serial.print(SPI_FLASH_SEC_SIZE);
      Serial.println(" bytes.");
      EEPROM.begin(SPI_FLASH_SEC_SIZE);
      int temp = SPI_FLASH_SEC_SIZE;
      while (temp >= 256) {
        temp /= 256;
        saveLength++;
      }
      //get EEPROM save length
      for (int i = 0; i < saveLength; i++) {
        length += EEPROM.read(i) * pow(256, i);
      }
      //check length overflow, clear EEPROM
      if (length >= SPI_FLASH_SEC_SIZE - saveLength) {
        clear();
        return;
      }
      //get EEPROM save data
      char buffer[length];
      for (int i = 0; i < length; i++) {
        EEPROM.begin(SPI_FLASH_SEC_SIZE);
        buffer[i] = EEPROM.read(i + saveLength);
      }
      data = buffer;
    }
    String read() {
      return data.substring(0, length);
    }
    bool write(String s) {
      Serial.println("EEPROM write...");
      Serial.println(s);
      length = s.length();
      Serial.print("length:");
      Serial.println(length);
      int tmp = length;
      //save length of saveData to EEPROM
      for (int i = saveLength - 1; i >= 0; i--) {
        EEPROM.write(i, tmp / pow(256, i));
      }
      //save data to EEPROM
      for (int i = 0; i < length; i++) {
        EEPROM.write(i + saveLength, s[i]);
      }

      //commit & feedbaack
      if (EEPROM.commit()) {
        data = s;
        return true;
      }
      return false;
    }
    void clear() {
      EEPROM.begin(SPI_FLASH_SEC_SIZE);
      for (int i = 0; i < SPI_FLASH_SEC_SIZE; i++) {
        EEPROM.write(i, 0);
      }
      data = "";
    }
};

class Connection {
  private:
    int connetionStatus;
    String ssid, password;
    WiFiServer* server;
    bool startConnectAp() {
      // Connect to WiFi network
      Serial.print("Mac address: ");
      Serial.println(WiFi.macAddress());
      Serial.print("Connecting to ");
      Serial.println(ssid);
      WiFi.begin(ssid.c_str(), password.c_str());//ESP32 .c_str()
      Serial.println("...End");
      return true;
    }
    bool connectingAp() {
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("... connect ok!");
        return true;
      }
      static TimerDelay cnT;
      cnT.start(500);
      if (cnT.isOnTime()) {
        Serial.println("connectingAp...");
      }
      return false;
    }
    bool connectedAp() {
      // Start the server
      server->begin();
      Serial.println("Server started");

      // Print the IP address
      Serial.println(WiFi.localIP());
      Serial.println("...End");
      return true;
    }
    bool initInternetTime() {
      int timezone = 8 * 3600;
      int dst = 0;
      configTime(timezone, dst, "pool.ntp.org", "time.nist.gov");
      Serial.println("Waiting for Internet time...");
      if (!time(nullptr)) {
        return false;
      }
      Serial.println("Time response....OK");
      return true;
    }

  public:
    Connection() {}
    void setup(String _ssid, String _password) {
      server = new WiFiServer(23);//port defaut set 23
      connetionStatus = 0;
      ssid = _ssid;
      password = _password;
    }
    WiFiClient getClient() {
      return server->available();
    }
    bool isConnectedAp() {
      if(connetionStatus >= 4 && WiFi.status() == WL_CONNECTED) return true;
      else if(connetionStatus >= 4) {
        connetionStatus = 0;
      }
      
      return false;
    }
    void processCycle() {
      if (connetionStatus == 0 && startConnectAp()) {
        connetionStatus = 1;
      }
      if (connetionStatus == 1 && connectingAp()) {
        connetionStatus = 2;
      }
      if (connetionStatus == 2 && connectedAp()) {
        connetionStatus = 3;
      }
      if (connetionStatus == 3 && initInternetTime()) {
        connetionStatus = 4;
      }
    }
};

String dataFromSerial() {
  String dataFromSerial = "";
  while (Serial.available()) {
    char ch = Serial.read();
    delay(10);
    Serial.print("serial:");
    Serial.println(ch);
    dataFromSerial += ch;
  }
  return dataFromSerial;
}

#endif
