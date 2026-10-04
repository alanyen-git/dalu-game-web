const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","qunlu-app","src","map-controls.js"),"utf8");
const events={},MAPS=".xu-board,.xu-town-board,.town-map-canvas",transformTarget={style:{}};
const stage={clientWidth:800,clientHeight:500,children:[],classList:{add(){}},querySelector(sel){if(sel===":scope > .map-zoom-controls")return this.children.find(x=>x.className==="map-zoom-controls")||null;if(sel===".xu-map-pan-surface")return transformTarget;return null},appendChild(el){this.children.push(el)},setPointerCapture(){},closest(sel){return sel===MAPS?this:null}};
class Element{constructor(){this.children=[];this.dataset={};this.style={};this.classList={add(){}}}setAttribute(){}appendChild(child){this.children.push(child);child.parent=this}closest(sel){if(sel==="[data-map-zoom]")return this.dataset.mapZoom?this:null;if(sel===MAPS)return stage;if(sel==="button,a,input,summary")return this.dataset.mapZoom?this:null;return null}}
const document={documentElement:{},querySelectorAll(sel){return sel===MAPS?[stage]:[]},createElement(){return new Element()},addEventListener(name,fn){events[name]=fn}};
class MutationObserver{constructor(fn){this.fn=fn}observe(){}}
vm.runInNewContext(source,{document,MutationObserver,setTimeout,WeakMap,Math});
const box=stage.children.find(x=>x.className==="map-zoom-controls");assert.ok(box,"map controls install");
const zoomIn=box.children.find(x=>x.dataset.mapZoom==="in");events.click({target:zoomIn,preventDefault(){},stopPropagation(){}});
assert.match(transformTarget.style.transform,/scale\(1\.2\)/,"zoom in enlarges the map");
events.pointerdown({target:stage,pointerId:7,clientX:10,clientY:20});let prevented=false;
events.pointermove({target:stage,pointerId:7,clientX:35,clientY:35,preventDefault(){prevented=true}});
assert.ok(prevented,"dragging prevents page scroll");assert.match(transformTarget.style.transform,/translate\(25px,15px\)/,"drag moves the map");
events.pointerup({target:stage,pointerId:7});let suppressed=false;events.click({target:stage,preventDefault(){suppressed=true},stopImmediatePropagation(){}});
assert.ok(suppressed,"drag release does not activate an underlying map node");
const reset=box.children.find(x=>x.dataset.mapZoom==="reset");events.click({target:reset,preventDefault(){},stopPropagation(){}});
assert.equal(transformTarget.style.transform,"translate(0px,0px) scale(1)","reset restores the initial map view");
console.log("PASS map zoom, touch pan, click suppression, and reset controls");