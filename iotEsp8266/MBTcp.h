//https://github.com/emelianov/modbus-esp8266
//https://github.com/emelianov/modbus-esp8266/tree/master/examples/TCP-ESP
#ifndef MBTcp
#define MBTcp

#ifdef ESP8266
#include <ESP8266WiFi.h>
#else
#include <WiFi.h>
#endif
#include <ModbusIP_ESP8266.h>

class ModbusTcpClient {
  private:
    ModbusIP mb;
    IPAddress remote;
  public:
    void setup() {
      mb.client();
    }
    String getIp() {
      if (mb.isConnected(remote)) return String(remote[0]) + String(".")
                                           + String(remote[1]) + String(".")
                                           + String(remote[2]) + String(".")
                                           + String(remote[3]);
      return "not connect to remote!";
    }

    bool isConnected(String ip) {
      remote.fromString(ip);
      return mb.isConnected(remote);
    }
    bool connect(String ip, int port = 502) {
      remote.fromString(ip);
      return mb.connect(remote, port);
    }
    bool disconnect() {
      if (!remote) {
        return true;
      }
      return mb.disconnect(remote);
    }
    int readHreg(String ip, int port, int offset, uint16_t* values, int length) { //ModbusAPI.h
      remote.fromString(ip);
      if (!mb.isConnected(remote)) {
        if (!mb.connect(remote, port))return -1;
      }

      int status = mb.readHreg(remote, offset, &values[0], length);
      //mb.task();
      while (mb.isTransaction(status)) { // Check if transaction is active
        mb.task();
        delay(10);
      }
      //delay(100);// Pulling interval

      return status;
    }
    int writeHreg(String ip, int port, int offset, uint16_t* values, int length) { //ModbusAPI.h
      remote.fromString(ip);
      if (!mb.isConnected(remote)) {
        if (!mb.connect(remote, port))return -1;
      }

      int status = mb.writeHreg(remote, offset, values, length);
      //mb.task();
      while (mb.isTransaction(status)) { // Check if transaction is active
        mb.task();
        delay(10);
      }
      //delay(100);// Pulling interval

      return status;
    }
    int readCoil(String ip, int port, int offset, bool* values, int length) {
      remote.fromString(ip);
      if (!mb.isConnected(remote)) {
        if (!mb.connect(remote, port))return -1;
      }

      int status = mb.readCoil(remote, offset, &values[0], length);
      //mb.task();
      while (mb.isTransaction(status)) { // Check if transaction is active
        mb.task();
        delay(10);
      }
      //delay(100);// Pulling interval

      return status;
    }
    int writeCoil(String ip, int port, int offset, bool* values, int length) {
      remote.fromString(ip);
      if (!mb.isConnected(remote)) {
        if (!mb.connect(remote, port))return -1;
      }

      int status = mb.writeCoil(remote, offset, values, length);
      //mb.task();
      while (mb.isTransaction(status)) { // Check if transaction is active
        mb.task();
        delay(10);
      }
      //delay(100);// Pulling interval

      return status;
    }

};

#endif
