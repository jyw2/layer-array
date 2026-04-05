const { entrypoints } = require("uxp");

showAlert = () => {
  alert("This is an alert message");
}

entrypoints.setup({
  commands: {
    showAlert,
  },
  panels: {
    vanilla: {
      show(node) {
      }
    }
  }
});

let spacing = 10
let length = 2
let direction = 0
let group = null
let doc = null
let ogLayer = null

function isCloneSelected() {
  return group && doc && ogLayer
}

function clearSelectedClone() {
  group = null
  doc = null
  ogLayer = null
}

function previewCloneLayer() {
  return window.require("photoshop").core.executeAsModal(
    async () => {
      if (isCloneSelected()) {
        if (!isCloneSelected()) return
        group.layers.forEach((layer) => {
          layer.delete()
        })
        group.delete()
        ogLayer.selected = true
        clearSelectedClone()
      }

      const app = window.require("photoshop").app;
      doc = app.activeDocument;

      ogLayer = doc.activeLayers[0];

      const options = { name: `Array-Clone: ${crypto.randomUUID()}`, opacity: 100 };
      group = await doc.createLayerGroup(options);
      group.opacity = 50
      await cloneLayer(ogLayer, length - 1, group)
    },
    {
      commandName: "Rename layers",
    }
  );
}

function confirm() {
  return window.require("photoshop").core.executeAsModal(
    async () => {
      if (!isCloneSelected()) return
      group.opacity = 100
      await group.merge() // Merges preview group together
      await group.merge() // Merges resulting layer into og layer
      clearSelectedClone()
    }
  )
}

function cancel() {
  return window.require("photoshop").core.executeAsModal(
    () => {
      if (!isCloneSelected()) return
      group.layers.forEach((layer) => {
        layer.delete()
      })
      group.delete()
      ogLayer.selected = true
      clearSelectedClone()
    }
  )
}

async function cloneLayer(layer, recursions, group) {

  let xOffsetPct = spacing * Math.cos(direction * (Math.PI / 180));
  let yOffsetPct = -1 * spacing * Math.sin(direction * (Math.PI / 180));

  const copyLayer = await layer.duplicate()
  await copyLayer.move(group, "placeInside")

  await copyLayer.translate(xOffsetPct, yOffsetPct);


  recursions -= 1
  if (recursions <= 0) return

  await cloneLayer(copyLayer, recursions, group)
}

document
  .getElementById("preview")
  .addEventListener("click", previewCloneLayer);

document
  .getElementById("confirm")
  .addEventListener("click", confirm);

document
  .getElementById("cancel")
  .addEventListener("click", cancel);

document.querySelector("#direction").addEventListener("input", evt => {
  direction = evt.target.value
})
document.querySelector("#spacing").addEventListener("input", evt => {
  spacing = evt.target.value
})
document.querySelector("#length").addEventListener("input", evt => {
  length = evt.target.value
})