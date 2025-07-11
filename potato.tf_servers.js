// ==UserScript==
// @name     potato.tf Server Browser
// @version  1
// @grant    none
// @include  https://potato.tf/servers
// @run-at   document-idle
// @description This script filters the list of servers listed by the potatoe.tf server browser based on filter criteria
// ==/UserScript==

//TODO: track checked and unchecked maps to be able to identify new maps etc.
//TODO: enable/disable individual filters
//TODO: add event handler for text change of input boxes

"use strict";

//default config value
let config = {
  difficulty: new Set(["Expert", "Advanced", "Intermediate"]),
  completed: new Set(["true", "false"]),
  maps: new Set(),
  missions: new Set(),
  wave: {
    min: 0,
    max: 8
  },
  status: new Set(["Setup", "Waiting", "In-Wave"]),
  players: {
    min: 0,
    max: 6
  },
  disable: false,
  replace_connect: true,
  show_maps: false,
  show_missions: false,
  ping: {
    max: 120
  }
}

const DEBUG = false;
let initilized = false;

async function start() {
  const targetNode = document.getElementById("serverDeck");
  const observer = new MutationObserver((m, o) => {
    if (!initilized) {
      init()
      initilized = true;
    }
    else {
      console.log("running update")
      update()
    }
  });
  observer.observe(targetNode, { childList: true });
}

function init() {

  //load saved config
  var saved_config = localStorage.getItem("config");
  try {
    saved_config = JSON.parse(saved_config, (_key, value) => (value instanceof Array ? new Set(value) : value))
    config = saved_config ?? config
    console.log("loaded saved config")
  }
  catch (e) {
    console.log("failed to load saved config")
  }

  //probe server list to get possible config values
  let possible = update();

  //generate checkboxes for possible difficutly values
  let difficulty = ""
  for (let p of possible.difficulty) {
    let checkbox =
      `<div>
        <input type="checkbox" id="${p}" name="difficulty" value="${p}" data-type="list" ${config.difficulty.has(p) ? "checked" : ""} />
        <label for="${p}">${p}</label>
     </div>`
    difficulty = difficulty + "\n" + checkbox;
  }

  //generate checkboxes for possible map values
  let maps = ""
  for (let p of possible.maps) {
    let checkbox =
      `<div>
        <input type="checkbox" id="${p}" name="maps" value="${p}" data-type="list" ${config.maps.has(p) ? "checked" : ""} />
        <label for="${p}">${p}</label>
     </div>`
    maps = maps + "\n" + checkbox;
  }

  //generate checkboxes for possible mission values
  let missions = ""
  for (let p of possible.missions) {
    let checkbox =
      `<div>
          <input type="checkbox" id="${p}" name="missions" value="${p}" data-type="list" ${config.missions.has(p) ? "checked" : ""} />
          <label for="${p}">${p}</label>
       </div>`
    missions = missions + "\n" + checkbox;
  }

  //create controls
  let control = `
<div id="filter_panel" style="background-color: white; position: absolute;top: 70px;right: 10px;display: flex; flex-direction: column; font-size: unset;">
  <div id="filters">
    <fieldset>
      <legend>Difficulty</legend>
				${difficulty}
    </fieldset>

    <fieldset>
      <legend>Mission</legend>
      <div>
        <input type="checkbox" id="completed" name="completed" value="true" data-type="list" ${config.completed.has("true") ? "checked" : ""} />
        <label for="completed">Completed</label>
      </div>
      <div>
        <input type="checkbox" id="not_completed" name="completed" value="false" data-type="list" ${config.completed.has("false") ? "checked" : ""} />
        <label for="not_completed">Not Completed</label>
    </div>
    </fieldset>

    <fieldset>
      <legend>Wave</legend>
      <div>
        <input type="number" id="wave_max" name="wave" data-bound="max" value="${config.wave.max}" />
        <label for="wave_max">max</label>
      </div>
      <div>
        <input type="number" id="wave_min" name="wave" data-bound="min" value="${config.wave.min}"/>
        <label for="wave_min">min</label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Status</legend>
      <div>
        <input type="checkbox" id="setup" name="status" value="Setup" data-type="list" ${config.status.has("Setup") ? "checked" : ""} />
        <label for="setup">Setup</label>
      </div>
      <div>
        <input type="checkbox" id="waiting" name="status" value="Waiting" data-type="list" ${config.status.has("Waiting") ? "checked" : ""} />
        <label for="waiting">Waiting</label>
      </div>
      <div>
        <input type="checkbox" id="inwave" name="status" value="In-Wave" data-type="list" ${config.status.has("In-Wave") ? "checked" : ""} />
        <label for="inwave">In-Wave</label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Players</legend>
      <div>
        <input type="number" id="player_max" name="players" data-bound="max" value="${config.players.max}"/>
        <label for="player_max">max</label>
      </div>
      <div>
        <input type="number" id="player_min" name="players" data-bound="min" value="${config.players.min}"/>
        <label for="player_min">min</label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Ping</legend>
      <div>
        <input type="number" id="ping_max" name="ping" data-bound="max" value="${config.ping.max}"/>
        <label for="ping_max">max</label>
      </div>
    </fieldset>

    <fieldset>
      <legend class="toggles" data-target-id="maps-list" data-setting="show_maps">Maps</legend>
      <div id="maps-list" style="display: ${config.show_maps ? "" : "none"}">
        ${maps}
      </div>
    </fieldset>

    <fieldset>
      <legend class="toggles" data-target-id="missions-list" data-setting="show_missions">Missions</legend>
      <div id="missions-list" style="display: ${config.show_missions ? "" : "none"}">
        ${missions}
      </div>
    </fieldset>

  </div>

  <div id="options">
    <fieldset>
      <legend>Options</legend>
      <div>
        <input type="checkbox" id="replace_links" name="replace_connect" data-type="boolean" ${config.replace_connect ? "checked" : ""}/>
        <label for="replace_links">Replace Links</label>
      </div>
      <div>
        <input type="checkbox" id="disable" name="disable" data-type="boolean" ${config.disable ? "checked" : ""}/>
        <label for="disable">Disable Filters</label>
      </div>
    </fieldset>
  </div>
</div>`

  document.body.insertAdjacentHTML("beforeend", control)

  const toggles = document.querySelectorAll(".toggles");

  toggles.forEach(x => x.addEventListener("click", (event) => {
    const id = x.dataset.targetId;
    const target = document.getElementById(id);
    const seen = target.checkVisibility()
    target.style.display = seen ? "none" : "";
    config[x.dataset.setting] = !seen
    localStorage.setItem("config", JSON.stringify(config, (_key, value) => (value instanceof Set ? [...value] : value)));
  }));

  const ingredients = document.querySelectorAll("#filter_panel fieldset div input");

  ingredients.forEach(ig => ig.addEventListener("click", (e) => {
    if (e.target.type == "checkbox" && e.target.dataset.type == "list") {
      if (e.target.checked) {
        config[e.target.name].add(e.target.value);
      }
      else {
        config[e.target.name].delete(e.target.value);
      }
    }
    else if (e.target.type == "checkbox" && e.target.dataset.type == "boolean") {
      config[e.target.name] = e.target.checked
    }
    else if (e.target.type == "number") {
      config[e.target.name][e.target.dataset.bound] = e.target.value;
    }
    else {
      console.log("error");
    }

    localStorage.setItem("config", JSON.stringify(config, (_key, value) => (value instanceof Set ? [...value] : value)));
    update();
  }));
}

function update() {
  let servers = document.getElementById("serverDeck").childNodes;

  let possible = {
    difficulty: new Set(),
    maps: new Set(),
    missions: new Set(),
    wave: {
      min: 0,
      max: 1
    },
    status: new Set(),
    players: {
      min: 0,
      max: 1
    },
  }

  for (const server of servers) {
    if (server instanceof HTMLDivElement) {
      let cols = server.childNodes;

      const location = cols[1].childNodes[1];
      const map = cols[3].childNodes[1].textContent;

      const mission = cols[5].childNodes[1].textContent.trim();
      const done = cols[5].childNodes[1].childNodes.length > 1 ? true : false;

      const compaign = cols[7].childNodes[1].textContent.trim();

      const difficulty = cols[9].childNodes[1].childNodes[0].textContent;
      const wave = cols[11].childNodes[1].textContent;
      const wave_current = parseInt(wave.split('/')[0].trim());

      let wave_total = parseInt(wave.split('/')[1].trim());

      wave_total = isNaN(wave_total) ? 1 : wave_total //handel case wave count is '?' 

      const state = cols[13].childNodes[1].textContent;

      const players_present = parseInt(cols[15].childNodes[1].childNodes[0].textContent.split('/')[0].trim()); // ignores (+n)

      const players_total = [...cols[15].childNodes[1].childNodes].at(-1).textContent;

      const classes = cols[17].childNodes[1];

      const spec = cols[19].childNodes[1];

      const connect = cols[21].childNodes[1]
      const ping = parseInt(connect.childNodes[1].childNodes[0].textContent.split(" ")[0])

      possible.maps.add(map)
      possible.missions.add(mission)

      possible.difficulty.add(difficulty)
      possible.status.add(state)

      possible.wave.max = Math.max(possible.wave.max, wave_total)
      possible.players.max = Math.max(possible.players.max, players_total)

      //Replace link. This fixed issues with opening server from browser
      if (config.replace_connect) {
        const text = "connect " + connect.href.split('/')[4];

        let write = function (e) {
          navigator.clipboard.writeText(text)
            .then(
              () => { },
              (e) => {
                console.log(e)
              }
            );
          e.preventDefault();
        };

        connect.addEventListener("click", write, false);
        connect.onclick = ""; //nessary?
      }

      //Show or Hide
      if (!config.disable &&
        (!config.difficulty.has(difficulty) || !config.status.has(state) ||
          config.wave.max < wave_current || config.wave.min > wave_current ||
          config.players.max < players_present || config.players.min > players_present ||
          config.ping.max < ping ||
          !config.completed.has(done.toString()) ||
          !config.maps.has(map) || !config.missions.has(mission)
        )) {
        if (DEBUG) {
          server.style.cssText = "background-color: red !important";
        }
        else {
          server.style.display = "none";
        }
      }
      else {
        if (DEBUG) {
          server.style.cssText = "";
        }
        else {
          server.style.display = "";
        }
      }
    }
  }
  return possible;
}

start();
