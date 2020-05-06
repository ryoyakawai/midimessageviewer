"use strict";

import { xWebMIDI } from "../node_modules/x-webmidi/xwebmidi.js";
import { BLEMIDIUtils } from "./blemidiutils.js";
import { MIDIMessageUtils } from "./midimessageutils.js";
import { clearToDefault, dispParsedMIDI, dispParsedMIDIExp, addToHistory } from "./screenhandler.js";

const dispClearDuration = 3000; // (ms)
clearToDefault();
let dispState = "remove"; // [leave/remove]
let timerId = 0;

(async () => {
  // justify width
  let loadingControl = function() { }
  loadingControl.prototype = {
    addviewport: async () => {
      return new Promise( (resolve) => {
        const app_fixed_screen_width = 440
        let actual_screen_width = window.outerWidth
        let sig_digit = Math.pow(10, 3)
        let just_scale = Math.ceil(sig_digit * (actual_screen_width / app_fixed_screen_width)) / sig_digit
        let viewport = document.createElement('meta')
        viewport.setAttribute('name', 'viewport')
        viewport.setAttribute('content', `width=device-width, initial-scale=${just_scale}, maximum-scale=${just_scale}`)
        document.getElementsByTagName('head')[0].appendChild(viewport)
        resolve()
      })
    },
    hide: () => {
      let div_loading = document.querySelector('#loading')
      setTimeout( () => {
        div_loading.style.setProperty('opacity', '0')
      }, 500)
      setTimeout( () => {
        document.body.removeChild(div_loading)
      }, 1500)
    }
  }
  let lc = new loadingControl()
  await lc.addviewport()
  // justify width

  // for Web Bluetooth
  const bleMIDIUtls = new BLEMIDIUtils();
  const midiMsgUtls = new MIDIMessageUtils();
  bleMIDIUtls.setMIDIParser(midiMsgUtls.parseMIDIMessage.bind(midiMsgUtls));
  let state = bleMIDIUtls.getDeviceConnected();
  bleMIDIUtls.setnMidiEventHandleCallback( event => {
    dispParsedMIDI(event);
    dispParsedMIDIExp(event);
    window.clearTimeout(timerId);
    if(dispState == "remove") {
      timerId = window.setTimeout(() => {
        clearToDefault();
        document.querySelector("#disp-input-port").innerText="";
      }, dispClearDuration);
    }
  });
  bleMIDIUtls.setConnectedBleCallback( event => {
    document.getElementById("ble-icon").innerHTML = "bluetooth_connected";
    document.getElementById("start-ble").classList.add('ble-connected');
    updateFavicon();
  });
  bleMIDIUtls.setDisconnectedBleCallback( event => {
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


  // for Web MIDI and x-webmidi
  const xwm = new xWebMIDI()
  await xwm.requestMIDIAccess(true)
  xwm.initInput('input-port')
  xwm.initOutput('output-port')

  window.addEventListener('midiin-event:input-port', event => {
    // send msg to output
    let output = document.getElementById("output-port");
    if(output.checkOutputIdx != "false") {
      xwm.sendRawMessage(event.detail.data);
    }

    // handle input msg
    let out = [], disp = true;
    if(event.detail.data[0]==0xfe || event.detail.data[0]==0xf8) {
      disp = false;
    } else {
      dispParsedMIDI(event);
      dispParsedMIDIExp(event);
      window.clearTimeout(timerId);
      if(dispState == "remove") {
        timerId = window.setTimeout(() => {
          clearToDefault();
          document.querySelector("#disp-input-port").innerText = "";
        }, dispClearDuration);
      }
    }
  });

  // for both Web MIDI and Web Bluetooth
  document.querySelector("#clear-button").addEventListener("mousedown", clearToDefault, false);
  document.querySelector("#disp-state").addEventListener("mousedown", event => {
    let outVal=0;
    if(dispState == "leave") {
      dispState = "remove";
      event.target.innerHTML = "pause_circle_outline";
      outVal = 0x00;
      clearToDefault();
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

  // vvv removing loading overlay vvv
  lc.hide()
  // ^^^ removing loading overlay ^^^

})()

