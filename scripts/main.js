"use strict";

import { BLEMIDIUtils } from "./blemidiutils.js";
import { MIDIMessageUtils } from "./midimessageutils.js";
import { clearToDefault, dispParsedMIDI, dispParsedMIDIExp, addToHistory } from "./screenhandler.js";

clearToDefault();
let dispState = "remove"; // [leave/remove]
let timerId = 0;

// for Web Bluetooth
let bleMIDIUtls = new BLEMIDIUtils();
let midiMsgUtls = new MIDIMessageUtils();
bleMIDIUtls.setMIDIParser(midiMsgUtls.parseMIDIMessage.bind(midiMsgUtls));
let state = bleMIDIUtls.getDeviceConnected();
bleMIDIUtls.setnMidiEventHandleCallback( event => {
  dispParsedMIDI(event);
  dispParsedMIDIExp(event);
  window.clearTimeout(timerId);
  timerId = window.setTimeout(() => {
    timerId = timerId;
    if(dispState == "remove") {
      clearToDefault();
      document.querySelector("#disp-input-port").innerText="";
    }
  }, 3000);
});
bleMIDIUtls.setStartBleCallabck( event => {
  document.getElementById("ble-icon").innerHTML = "bluetooth_connected";
  document.getElementById("start-ble").classList.add('ble-connected');
  updateFavicon();
});
bleMIDIUtls.setEndBleCallabck( event => {
  document.getElementById("ble-icon").innerHTML = "bluetooth";
  document.getElementById("start-ble").classList.remove('ble-connected');
  updateFavicon();
});
document.querySelector("#start-ble").addEventListener("mousedown", event => {
  let state = bleMIDIUtls.getDeviceConnected();
  if(state == false) {
    bleMIDIUtls.startBle.bind(bleMIDIUtls)(event);
  } else {
    bleMIDIUtls.endBle.bind(bleMIDIUtls)(event);
  }
}, false);
const updateFavicon = () => {
  let head_ = document.getElementsByTagName('head');
  let link_ = head_[0].getElementsByTagName('link');
  for( let key in link_) {
    if(typeof link_[key].relList != 'undefined' ) {
      if(link_[key].relList.contains('icon')) {
        if(link_[key].href.match(/_on/) != null) {
          link_[key].href = link_[key].href.replace('_on', '_off');
        } else {
          link_[key].href = link_[key].href.replace('_off', '_on');
        }
      }
    }
  }
};


// for Web MIDI
window.addEventListener('midiin-event:input-port', event => {
  // send msg to output
  let output = document.getElementById("output-port");
  if(output.checkOutputIdx != "false") {
    output.sendRawMessage(event.detail.data);
  }

  // handle input msg
  let out = [], disp = true;
  if(event.detail.data[0]==0xfe || event.detail.data[0]==0xf8) {
    disp = false;
  } else {
    dispParsedMIDI(event);
    dispParsedMIDIExp(event);
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => {
      timerId = timerId;
      if(dispState == "remove") {
        clearToDefault();
        document.querySelector("#disp-input-port").innerText = "";
      }
    }, 3000);
  }
});

// for both Web MIDI and Web Bluetooth
document.querySelector("#clear-button").addEventListener("mousedown", clearToDefault, false);
document.querySelector("#disp-state").addEventListener("mousedown", event => {
  let outVal=0;
  if(dispState == "leave") {
    dispState = "remove";
    event.target.innerHTML = "pause_circle_outline";
    outVal=0x00;
  } else {
    dispState = "leave";
    event.target.innerHTML = "play_circle_outline";
    outVal = 0x40;
  }
  // search output port which has same name with input port
  let midi = document.getElementById("x-webmidi").midi;
  let outputs = midi.outputs, inputs = midi.inputs;
  let inputIdx = document.getElementById("input-port").inputIdx;
  for(let i=0; i<outputs.length; i++) {
    if(outputs[i].name == inputs[inputIdx].name) {
      outputs[i].send([0xb0, 0x11, outVal]);
      break;
    }
  }
});

