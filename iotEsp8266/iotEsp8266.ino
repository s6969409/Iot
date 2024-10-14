
#include "System.h"
EEPHelper eep;
Connection cnn;
String ssid, password;

//TimerDelay tmFb;
LocalTime lt;
bool needTeach = true;

//Modbus
#include "MBTcp.h"
ModbusTcpClient mbTC;
bool modbusProcessNotOK = false;

//http
#ifdef ESP8266
#include <ESP8266HTTPClient.h>
#else
#include <HTTPClient.h>
#endif

void setup() {
  Serial.begin(115200);
  Serial1.begin(115200);//only TX (write)
  //pinMode(LED_BUILTIN, OUTPUT);
  //pinMode(16, OUTPUT);
  delay(3000);
  //digitalWrite(LED_BUILTIN, LOW);
  //digitalWrite(16, LOW);
  delay(2000);

  eep.setup();
  getAPInfo();
  //connect to AP
  cnn.setup(ssid, password);

  mbTC.setup();
  initOutputByEEPROM();
}

void loop() {
  //Serial send msg to client
  String strFromSerial = dataFromSerial();
  if (strFromSerial != "") {
    Serial.println(strFromSerial);
    String strFeedback = cmdDecodeAndFeedback(strFromSerial);
    Serial.println(strFeedback);
  }

  if(!needTeach)loopCycleDoing();
  
  if (!cnn.isConnectedAp()) {
    cnn.processCycle();
    delay(500);
    return;
  }

  //Time process
  if (needTeach) {
    if (lt.setTime(time(nullptr))) {
      sendtoClient("teach ok, 現在時間:" + lt.getTime());
      Serial.println("teach ok, 現在時間:" + lt.getTime());
      needTeach = false;
    }
  }
  else {
    lt.processCycle();
  }

  //wifi message process
  clientCycle();
  delay(500);
  //if(modbusProcessNotOK)delay(1000);
  //else delay(10);
}

void getAPInfo() {
  //get ssid & passward from EEPROM
  Serial.println("Read EEPROM...");
  String src = eep.read();
  Serial.println(src);
  JSONVar objSrc = JSON.parse(src);
  ssid = (const char*)objSrc["ssid"];
  password = (const char*)objSrc["password"];
  if (ssid == "" || password == "") { //default setting
    objSrc["ssid"] = "cht5879";//"defaultAP";"DukeAp"
    objSrc["password"] = "076995912";//"defaultPassword";"ddd54679"
    Serial.print("Not AP data, build new data and write:");
    Serial.println(eep.write(JSON.stringify(objSrc)));
  }
  Serial.println("...End");
}

//wifi message transfor
bool isClientConnect = false;
String clientIp = "";
WiFiClient client;
void clientCycle() {
  if (isClientConnect) {
    waitDataTransfor();
    /*WiFiClient client2 = cnn.getClient();
    if (client2 && client2.connected()){
      client2.stop();
    }*/
  } else {
    waitClient();

    //http RESTFUL
    //mbTest();
    //httpTestGET();
    //mbTest();
  }
}
void waitClient() {
  client = cnn.getClient();
  if (client && client.connected()) {
    //get clietIp
    IPAddress clientIPAdress = client.remoteIP();
    clientIp = String(clientIPAdress[0]) + String(".")
               + String(clientIPAdress[1]) + String(".")
               + String(clientIPAdress[2]) + String(".")
               + String(clientIPAdress[3]);

    Serial.print(clientIp);
    Serial.println(" connected");

    isClientConnect = true;
  }
}
void waitDataTransfor() {
  if (!client && !client.connected()) {
    Serial.print(clientIp);
    Serial.println(" disconnected");

    isClientConnect = false;
    clientIp = "";
  }
  else if (client && client.connected()) {
    //wait data transfor...
    //read form client data process
    String dataFromClient = "";
    while (client.available()) {
      char ch = client.read();//static_cast<char>(client.read())
      if (dataFromClient == "") {
        //Serial.print("first char=");
        //Serial.println(ch);
        if (ch != '{' && ch != '[') {
          //Serial.print("filter first char is \'");
          //Serial.print(ch);
          //Serial.println("\'");
          continue;//filter first char
        }
      }
      dataFromClient += ch;
    }
    if (dataFromClient != "") {
      Serial.println(dataFromClient);

      //data process, send to client data feedback
      String dataFeedback = cmdDecodeAndFeedback(dataFromClient);
      //client.write(dataFeedback.c_str());//send to client
      client.print(dataFeedback);//send to client
      Serial.println("FB OK");
      Serial.println(dataFeedback);
      //client.println();
      client.flush();
    }
  }
}
bool sendtoClient(String data) {
  if (client && client.connected()) {
    client.write(data.c_str());
    client.println();
    client.flush();
    return true;
  }
  else {
    return false;
  }
}

//data json
String dataFormate = "{\"parameter\":{\"ssid\":\"\",\"password\":\"\"},\"GPIO\":[0,1,2,3],\"opt\":{\"methodExample\":{\"desc\":\"?\",\"vars\":{\"var1\":{\"desc\":\"?\",\"value\":\"\"},\"var2\":{\"desc\":\"?\",\"value\":0}}},\"setParameter\":{\"desc\":\"set parameter\",\"vars\":{\"name\":{\"desc\":\"parameter name\",\"value\":\"\"},\"value\":{\"desc\":\"parameter setting value, value type follow parameter\",\"value\":\"value type follow parameter\"}}},\"getParameter\":{\"desc\":\"get parameter\",\"vars\":{\"name\":{\"desc\":\"parameter name\",\"value\":\"\"}}},\"removeParameter\":{\"desc\":\"remove parameter\",\"vars\":{\"name\":{\"desc\":\"parameter name\",\"value\":\"\"}}},\"setPinValue\":{\"desc\":\"set pin value\",\"vars\":{\"pin\":{\"desc\":\"pin number\",\"value\":0},\"value\":{\"desc\":\"value\",\"value\":false}}},\"getPinValue\":{\"desc\":\"get pin value\",\"vars\":{\"pin\":{\"desc\":\"pin number\",\"value\":0}}},\"setPinMode\":{\"desc\":\"set pin mode\",\"vars\":{\"pin\":{\"desc\":\"pin number\",\"value\":0},\"value\":{\"desc\":\"value:INPUT,OUTPUT\",\"value\":\"INPUT\"}}},\"getPinMode\":{\"desc\":\"get pin mode\",\"vars\":{\"pin\":{\"desc\":\"pin number\",\"value\":0}}}}}";
JSONVar dataJvr = JSON.parse(dataFormate);
//command data decode and feedback
String cmdDecodeAndFeedback(String dataStr) {
  JSONVar fbkJvr;

  JSONVar objSrc = JSON.parse(dataStr);
  int totalCmds = objSrc.keys().length();
  Serial.print("total cmds=");
  Serial.println(totalCmds);
  if (totalCmds <= 0) return "formate error\n" + dataFormate;

  JSONVar optCmds = dataJvr["opt"].keys();
  for (int i = 0; i < totalCmds; i++) {
    String cmd = (const char*)objSrc.keys()[i];
    JSONVar data = objSrc[cmd];
    if (cmd == "setParameter" && data != "null") {//統一回傳一個bool值
      JSONVar ps = JSON.parse(eep.read());
      for (int i2 = 0; i2 < data.length(); i2++) {
        JSONVar item = data[i2];
        String name = (const char*)item["name"];
        String value = (const char*)item["value"];
        ps[name] = value;
      }
      fbkJvr[cmd] = eep.write(JSON.stringify(ps));
    }
    else if (cmd == "getParameter" && data != "null") {//根據陣列回傳
      JSONVar returnPs = new JSONVar();
      JSONVar ps = JSON.parse(eep.read());
      for (int i2 = 0; i2 < data.length(); i2++) {
        JSONVar item = data[i2];
        String name = (const char*)item["name"];
        returnPs[name] = (const char*)ps[name];

        item["fb"] = (const char*)ps[name];
        fbkJvr[cmd][i2] = item;
        
      }
    }
    else if (cmd == "removeParameter" && data != "null") {//統一回傳一個bool值
      JSONVar ps = JSON.parse(eep.read());
      for (int i2 = 0; i2 < data.length(); i2++) {
        JSONVar item = data[i2];
        String name = (const char*)item["name"];
        if (ps.hasOwnProperty(name))ps[name] = nullptr;
      }

      JSONVar returnPs;
      JSONVar checkNames = ps.keys();
      for (int i2 = 0; i2 < checkNames.length(); i2++) {
        String name = (const char*)checkNames[i2];
        String value = (const char*)ps[name];
        if (value != nullptr) {
          returnPs[name] = value;
        }
      }
      fbkJvr[cmd] = eep.write(JSON.stringify(returnPs));
    }
    else if (cmd == "setPinValue" && data != "null") {//根據陣列回傳寫入值
      JSONVar ps = JSON.parse(eep.read());
      
      for (int i2 = 0; i2 < data.length(); i2++) {
        JSONVar item = data[i2];
        int pin = (int)item["pin"];
        bool value = (bool)item["value"];
        pinMode(pin, OUTPUT);
        digitalWrite(pin, value);

        //save state to EEPROM
        bool notExisted = true;
        for(int i3=0; i3<ps["pinOut"].length(); i3++){
          if((int)ps["pinOut"][i3]["pin"]==pin){
            ps["pinOut"][i3]["value"]=value;
            notExisted = false;
            break;
          }
        }
        if(notExisted){
          JSONVar add;
          add["pin"]=pin;
          add["value"]=value; 
          ps["pinOut"][ps["pinOut"].length()] = add;
          Serial.println(ps["pinOut"]);
        }

        item["fb"] = value;
        fbkJvr[cmd][i2] = item;
      }

      eep.write(JSON.stringify(ps));
    }
    else if (cmd == "removePinMode" && data != "null") {//統一回傳一個bool值
      JSONVar ps = JSON.parse(eep.read());
 
      for (int i2 = 0; i2 < data.length(); i2++) {
        JSONVar item = data[i2];
        int pin = (int)item["pin"];

        JSONVar savePins=JSON.parse("[]");
        for (int i3 = 0; i3<ps["pinOut"].length(); i3++) {
          if((int)ps["pinOut"][i3]["pin"]!=pin){
            savePins[i3]=ps["pinOut"][i3];
          }
        }
        ps["pinOut"] = savePins;
      }

      fbkJvr[cmd] = eep.write(JSON.stringify(ps));

    }
    else if (cmd == "getPinValue" && data != "null") {//找時間拿按鈕+電阻試試 //根據陣列回傳
      JSONVar ps = JSON.parse(eep.read());
      
      for (int i2 = 0; i2 < data.length(); i2++) {
        JSONVar item = data[i2];
        int pin = (int)item["pin"];

        bool valueByEep = false;
        //read EEPROM for pinMode
        bool notExisted = true;
        for (int i3 = 0; i3<ps["pinOut"].length(); i3++) {
          if((int)ps["pinOut"][i3]["pin"]==pin){
            valueByEep = (bool)ps["pinOut"][i3]["value"];
            notExisted = false;
            break;
          }
        }
        if(notExisted){
          pinMode(pin, INPUT_PULLUP);
          item["fb"] = (bool)digitalRead(pin);
        }else{
          item["fb"] = valueByEep;
        }
        
        fbkJvr[cmd][i2] = item;
        
      }
    }
    else if (cmd == "teach") {//回傳一個有"fb"成員的物件
      JSONVar item;
      needTeach = true;
      item["fb"] = "time is teaching...";
      fbkJvr[cmd] = item;
    }
    else if (cmd == "getLocalTime") {//回傳一個有"fb"成員的物件
      JSONVar item;
      item["fb"]=lt.getTime();
      fbkJvr[cmd] = item;
    }
    else if (cmd == "todoAdd" && data != "null") {//回傳EEPROM寫入結果
      JSONVar ps = JSON.parse(eep.read());
      for (int i2 = 0; i2 < data.length(); i2++) {
        time_t unixTime = (int)data[i2]["t"];
        int md = (int)data[i2]["md"];
        JSONVar cmd = data[i2]["cmd"];
        int addIndex = ps["todo"].length();
        ps["todo"][addIndex]["t"] = (int)unixTime;
        ps["todo"][addIndex]["md"] = md;
        ps["todo"][addIndex]["cmd"] = cmd;
      }

      fbkJvr[cmd] = eep.write(JSON.stringify(ps));
    }
    else if (cmd == "todoRemove" && data != "null") {//回傳EEPROM寫入結果
      JSONVar ps = JSON.parse(eep.read());

      for (int i2 = 0; i2 < data.length(); i2++) {
        JSONVar item = data[i2];
        time_t ut = (int)item["t"];
        int md = (int)item["md"];
        JSONVar cmd = item["cmd"];

        JSONVar saveTodos=JSON.parse("[]");
        for (int i3 = 0; i3<ps["todo"].length(); i3++) {
          if((int)ps["todo"][i3]["t"]!=(int)ut || (int)ps["todo"][i3]["md"]!=md || JSON.stringify(ps["todo"][i3]["cmd"])!=JSON.stringify(cmd)){
            saveTodos[i3]=ps["todo"][i3];
          }
        }
        ps["todo"] = saveTodos;
      }

      fbkJvr[cmd] = eep.write(JSON.stringify(ps));
    }
    else if (cmd == "todoGet") {//回傳todo list [解jTodos["todo"]會跳Exception...不知道為什麼??]
      JSONVar j = JSON.parse(eep.read());
      JSONVar jTodos = j["todo"];
      fbkJvr[cmd] = jTodos;
    }
    else if (cmd == "todoClear") {//回傳EEPROM寫入結果
      JSONVar ps = JSON.parse(eep.read());
      JSONVar arrNull = JSON.parse("[]");
      ps["todo"] = arrNull;
      fbkJvr[cmd] = eep.write(JSON.stringify(ps));
    }
    else if (cmd == "version") {//回傳版本號
      fbkJvr[cmd] = "20241006";///////////////
    }
    else if (cmd == "????????" && data != "null") {//回傳??????

    }
    else {//回傳一個有"fb"成員的物件
      Serial.println("formate error");
      JSONVar item;
      item["fb"]="formate error";
      fbkJvr[cmd] = item;
    }
  }


  //******************

  return JSON.stringify(fbkJvr);
}
void initOutputByEEPROM(){
  JSONVar ps = JSON.parse(eep.read());
  JSONVar pins = ps["pinOut"];
  for(int i=0; i<pins.length();i++){
    int pin = (int)pins[i]["pin"];
    bool value = (bool)pins[i]["value"];
    pinMode(pin, OUTPUT);
    digitalWrite(pin, value);
  }
}

#pragma region http
String getHtmlUrl() {
  String src = eep.read();
  JSONVar objSrc = JSON.parse(src);
  //Serial.println(objSrc["htmlUrl"]);
  return (const char*)objSrc["htmlUrl"];
}
String lastCmd = "";
void httpTestGET() {
  HTTPClient http;

  Serial.print("[HTTP] begin...");
  if (http.begin(client, getHtmlUrl())) {  // HTTP


    Serial.print("[HTTP] GET...\n");
    // start connection and send HTTP header
    int httpCode = http.GET();

    // httpCode will be negative on error
    if (httpCode > 0) {
      // HTTP header has been send and Server response header has been handled
      Serial.printf(" code: %d\n", httpCode);
      // file found at server  HTTP_CODE_OK=200, HTTP_CODE_MOVED_PERMANENTLY=301
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
        String payload = http.getString();//receive res.send from node.js
        if (payload == "") {
          Serial.println("NULL");
        } else {
          //decode Str to JSON
          //if(payload == lastCmd)return;
          Serial.println("get source:");
          JSONVar jvSrc = JSON.parse(payload);
          Serial.println(jvSrc);
          Serial.println(jvSrc.length());

          modbusProcessNotOK = true;
          JSONVar jvFb = modbusCmdDecode(jvSrc);
          JSONVar jvFb2 = modbusCmdDecode(jvSrc);

          if (jvFb == jvFb2 && jvFb.length() > 0) {
            Serial.println("post process:");
            Serial.println(jvFb);
            httpTestPOST(JSON.stringify(jvFb));
            modbusProcessNotOK = false;
            lastCmd = payload;
          }

        }
      }
    } else {
      Serial.printf("[HTTP] GET... failed, error: %s , code: %d\n", http.errorToString(httpCode).c_str(), httpCode);
    }

    http.end();
  } else {
    Serial.printf("[HTTP} Unable to connect\n");
  }
}
JSONVar modbusCmdDecode(JSONVar jvr) {
  JSONVar feedbackData;

  for (int i = 0; i < jvr.length(); i++) {
    String ip = (const char*)jvr[i]["ip"];
    int port = (int)jvr[i]["port"];
    JSONVar cmds = jvr[i]["cmds"];


    JSONVar ipNode;
    ipNode["ip"] = ip;
    ipNode["port"] = port;
    ipNode["cmds"];

    if (!mbTC.isConnected(ip)) {
      mbTC.disconnect();
      if (!mbTC.connect(ip, port))return new JSONVar(null);
    }

    for (int i2 = 0; i2 < cmds.length(); i2++) {
      String method = (const char*)cmds[i2]["method"];
      String dir = (const char*)cmds[i2]["dir"];
      int offset = (int)cmds[i2]["offset"];
      int p4 = (int)cmds[i2]["p4"];


      if (method == "Register" && dir == "Read") {
        int length = (int)cmds[i2]["p4"];
        uint16_t values[100];//1000會吃土 幹~
        int status = mbTC.readHreg(ip, port, offset, values, length);
        JSONVar jd = null;

        if (status > 0) {
          for (int i3 = 0; i3 < length; i3++) {
            jd[i3] = values[i3];
          }
        }

        ipNode["cmds"][i2] = jd;
      }
      else if (method == "Register" && dir == "Write") {
        JSONVar ja = cmds[i2]["p4"];
        int length = ja.length();
        uint16_t datas[length];
        for (int i3 = 0; i3 < length; i3++) {
          datas[i3] = (int)ja[i3];
        }
        mbTC.writeHreg(ip, port, offset, datas, length);
        ipNode["cmds"][i2] = ja;
      }
      else if (method == "Coil" && dir == "Read") {
        int length = (int)cmds[i2]["p4"];
        bool values[1000];
        int status = mbTC.readCoil(ip, port, offset, values, length);
        JSONVar jd = null;

        if (status > 0) {
          for (int i3 = 0; i3 < length; i3++) {
            jd[i3] = values[i3];
          }
        }
        ipNode["cmds"][i2] = jd;
      }
      else if (method == "Coil" && dir == "Write") {
        JSONVar ja = cmds[i2]["p4"];
        int length = ja.length();
        bool datas[length];
        for (int i3 = 0; i3 < length; i3++) {
          datas[i3] = (bool)ja[i3];
        }
        mbTC.writeCoil(ip, port, offset, datas, length);
        ipNode["cmds"][i2] = ja;
      }


    }

    feedbackData[i] = ipNode;
  }

  return feedbackData;
}
void httpTestPOST(String data) {
  HTTPClient http;

  Serial.print("[HTTP] begin...\n");
  // configure traged server and url
  http.begin(client, getHtmlUrl()); //HTTP
  http.addHeader("Content-Type", "application/json");

  Serial.print("[HTTP] POST...");
  // start connection and send HTTP header and body
  int httpCode = http.POST(data);

  // httpCode will be negative on error
  if (httpCode > 0) {
    // HTTP header has been send and Server response header has been handled
    Serial.printf(" code: %d\n", httpCode);

    // file found at server
    if (httpCode == HTTP_CODE_OK) {//  HTTP_CODE_OK=200
      const String& payload = http.getString();
      Serial.print("received payload:<<");
      Serial.print(payload);//response
      Serial.println(">>");

    }
  } else {
    Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
    Serial.println(httpCode);//XXX
  }

  http.end();
}
#pragma endregion

int duringSec = 3;
void loopCycleDoing(){
  JSONVar j = JSON.parse(eep.read());
  JSONVar jTodos = j["todo"];
  for (int i = 0; i < jTodos.length(); i++) {
    JSONVar item = jTodos[i];
    time_t ut = (int)item["t"];
    int md = (int)item["md"];
    JSONVar cmd = item["cmd"];

    int utSec = (ut + 3600 * 8) % 60;
    int utMin = (ut + 3600 * 8) / 60 % 60;
    int utHour = (ut + 3600 * 8) / 3600 % 24;
    int utWDay = (ut + 3600 * 8) / 3600 / 24 % 7;
    int utMDay = 0;//??
    int utMon = 0;//??

    if(
      (md == 0 && lt.ut > ut && lt.ut < ut + duringSec) //no cycle
      ||
      (md == 1 && lt.second() > utSec && lt.second() < utSec + duringSec)//sec
      ||
      (md == 2 && lt.second() > utSec && lt.second() < utSec + duringSec 
    && lt.min() == utMin)//minute
      ||
      (md == 3 && lt.second() > utSec && lt.second() < utSec + duringSec 
    && lt.min() == utMin && lt.hour() == utHour)//hour
      ||
      (md == 4 && lt.second() > utSec && lt.second() < utSec + duringSec 
    && lt.min() == utMin && lt.hour() == utHour 
    && lt.wday() == utWDay)//week
      ||
      (md == 5 && lt.second() > utSec && lt.second() < utSec + duringSec 
    && lt.min() == utMin && lt.hour() == utHour 
    && lt.day() == utMDay)//mday
      ||
      (md == 6 && lt.second() > utSec && lt.second() < utSec + duringSec 
    && lt.min() == utMin && lt.hour() == utHour 
    && lt.day() == utMDay && lt.mon() == utMon)//month
      ){
      cmdDecodeAndFeedback(JSON.stringify(cmd));
      continue;
    }
  }
}
