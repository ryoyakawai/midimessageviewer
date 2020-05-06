/**
 * Copyright (c) 2019 Ryoya Kawai. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
"use strict";

export class BLEMIDIUtils {
  constructor() {
    this.device_connected = false;
    this.MIDI_UUID = this.SERVICE_UUID =
      '03b80e5a-ede8-4b33-a751-6ce34ec4c700';
    this.MIDI_CHARA_UUID = '7772e5db-3868-4112-a1a9-f2669d106bf3';
    this.connectedDevice = null;
    this.timerId = 0;
  }
  getDeviceConnected() {
    return this.device_connected;
  }
  setDeviceConnected(state) {
    this.device_connected = state;
  }
  async startBle () {
    let ble_options = {
      filters: [ { services: [ this.MIDI_UUID ] } ]
    };
    try {
      this.connectedDevice = await navigator.bluetooth.requestDevice(ble_options);
      let server = await this.connectedDevice.gatt.connect();
      let service = await server.getPrimaryService(this.SERVICE_UUID);
      await this.startBleMIDIService(service, this.MIDI_CHARA_UUID);
      this.connectedBleCallback();
    } catch(err) {
      console.log("[ERROR] " + err);
    }
  }
  connectedBleCallback() {
    console.log("[Called] connected_ble_callback");
  }
  setConnectedBleCallback(callback) {
    //this.startBleCallback = callback;
    this.connectedBleCallback = callback
  }
  endBle() {
    if (this.connectedDevice === null
        || typeof this.connectedDevice.gatt.connected == "undefined") {
      console.log('[No devices are connected!]');
    } else {
      this.connectedDevice.gatt.disconnect();
      console.log('[Disconnected]');
      this.device_connected = false;
      this.disconnectedBleCallback();
    }
  }
  disconnectedBleCallback() {
    console.log("[Called] disconnected_ble_callback");
  }
  setDisconnectedBleCallback(callback) {
    this.disconnectedBleCallback = callback;
  }
  async startBleMIDIService(service, charUUID) {
    let characteristic = await service.getCharacteristic(charUUID);
    await characteristic.startNotifications();
    this.device_connected = true;
    console.log("[Connected] ", characteristic.uuid);
    characteristic.addEventListener('characteristicvaluechanged', this.onMIDIEvent.bind(this));
  }
  onMIDIEvent(event) {
    let data = event.target.value;
    let out = [];
    let str = "";
    for (let i = 0; i < data.buffer.byteLength; i++) {
      let val = data.getUint8(i);
      //if (val < 0x10) str += "0";
      str += val.toString(16) + " ";
      out.push(val);
    }
    event.detail = this.parseMIDIMessage(out.slice(2));
    this.onMidiEventHandleCallback.bind(this)(event);
  }
  setnMidiEventHandleCallback(callback) {
    this.onMidiEventHandleCallback = callback;
  }
  onMidiEventHandleCallback(event) {
    console.log(event);
  }
  setMIDIParser(parser) {
    this.parseMIDIMessage = parser;
  }
  parseMIDIMessage(msg) {
    console.log("[Use 'setMIDIParser()' to set MIDI Parser]");
    console.log(msg);
  }
}

