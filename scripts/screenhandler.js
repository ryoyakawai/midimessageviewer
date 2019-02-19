const disp_input_port_elemId = "disp-input-port";
const initialDisp = '<span>--</span><span class="spacing">--</span><span class="spacing">--</span>';
const msg_disp_elemId = "disp-input-port";
const msg_exp_disp_elemId = "exp-msg";
const message_history_elemId = "message-history";

export const clearToDefault = () => {
  let disparea = document.getElementById(msg_exp_disp_elemId);
  disparea.innerHTML = initialDisp;
  disparea.nextSibling.nextSibling.innerHTML = "";
  document.getElementById(disp_input_port_elemId).innerText = "";
  document.getElementById(message_history_elemId).innerHTML = "";
};

export const dispParsedMIDI = event => {
  if(typeof event.detail == "undefined") return;
  if(event.detail.data[0]==0xfe) return;
  let out=[];
  for(let key in event.detail.property) {
    if(key == "raw") {
      let tmp=[];
      for(let i=0; i<event.detail.property["raw"].length; i++) {
        tmp.push(event.detail.property["raw"][i].toString(16));
      }
      event.detail.property["raw"] = tmp.join(" ");
    }
    let keyName = key;
    if(key == "frequency") keyName = "freq";
    let div = "<div>[" + keyName + "] " + event.detail.property[key] + "</div>";
    out.push(div);
  }
  let disparea = document.getElementById(msg_disp_elemId);
  disparea.innerHTML = out.join("\n");
};

export const dispParsedMIDIExp = event => {
  if(typeof event.detail == "undefined") return;
  let vals = event.detail.property;
  let out = "", exp = "";
  let arrayRaw = vals.raw.split(" ");
  if(vals.type == "channel") {
    for(let i=0; i<arrayRaw.length; i++) {
      arrayRaw[i]=("00"+arrayRaw[i]).substr(-2, 2);
    }
    out = '<span class="red700">' + arrayRaw[0].substr(0,1) + '</span>' +
      '<span class="blue200">' + arrayRaw[0].substr(1,1) + '</span>' +
      '<span class="yellow500 spacing">' + arrayRaw[1] + '</span>' +
      '<span class="green500 spacing">' + arrayRaw[2] + '</span>';
    exp='<span class="strong">'+vals.subType+"</span>";
    switch(vals.subType) {
    case "noteOn":
      if(typeof(vals.itnl)=="undefined") vals.itnl="--";
      exp+=" (Play " + vals.itnl + " with strength of " + vals.velocity + ".)";
      break;
    case "noteOff":
      exp+=" (Stop playing " + vals.itnl +".)";
      break;
    case "controller":
      exp+=" (Update value of ctrl#" + vals.ctrlNo +" to "+vals.value+".)";
      break;
    }
  } else {
    clearToDefault();
    exp = vals.subType;
  }
  let disparea = document.getElementById(msg_exp_disp_elemId);
  disparea.innerHTML = out;
  disparea.nextSibling.nextSibling.innerHTML = exp;
  addToHistory(vals.raw);
};

export const addToHistory = msg => {
  let messages = "";
  let elem = document.getElementById(message_history_elemId);
  messages = elem.innerHTML;
  messages = messages.split("<br>");
  messages.unshift(msg);

  for(let i=0; i<messages.length; i++) {
    let tmp_msg=messages[i].split(" ");
    if(tmp_msg.length>1) {
      for(let j=0; j<tmp_msg.length; j++) {
        tmp_msg[j]=("00"+tmp_msg[j]).substr(-2, 2);
      }
      messages[i]=tmp_msg.join(" ");
    }
  }
  while(messages.length>60) {
    messages.pop();
  }
  elem.innerHTML = messages.join("<br>");
};
