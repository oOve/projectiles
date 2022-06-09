/*
▓█████▄  ██▀███           ▒█████  
▒██▀ ██▌▓██ ▒ ██▒        ▒██▒  ██▒
░██   █▌▓██ ░▄█ ▒        ▒██░  ██▒
░▓█▄   ▌▒██▀▀█▄          ▒██   ██░
░▒████▓ ░██▓ ▒██▒ ██▓    ░ ████▓▒░
 ▒▒▓  ▒ ░ ▒▓ ░▒▓░ ▒▓▒    ░ ▒░▒░▒░ 
 ░ ▒  ▒   ░▒ ░ ▒░ ░▒       ░ ▒ ▒░ 
 ░ ░  ░   ░░   ░  ░      ░ ░ ░ ▒  
   ░       ░       ░         ░ ░  
 ░                 ░              
 */
import * as utils from "./utils.mjs"
const MOD_NAME = "projectiles";


let p_socket;
Hooks.once("socketlib.ready", () => {
  // socketlib is activated, lets register our function moveAsGM
	p_socket = socketlib.registerModule(MOD_NAME);	
	p_socket.register("create_projectile", create_projectile);
});

function create_projectile(data){
  Projectile.create(data.position, data.direction, data.velocity, data.image, undefined, data.deviation, false);
}


function lang(k){
  return game.i18n.localize("PROJECTILES."+k);
}

function getHP(token){
  if (game.system.id == 'dnd5e'){
    return token.actor.data.data.attributes.hp.value;
  }

  // Default, valid for 5e and pf1 at least
  return token.actor.data.data.attributes.hp.value;
}


export default class Projectile{
  constructor(position, direction, velocity, image, onHit, deviation=0.0){
    this.pos = position;
    this.dir = utils.vNorm(direction);
    this.vel = velocity;
    this.img = image;
    this.onHit = onHit;
    this.dev = deviation;

    this.sprite = PIXI.Sprite.from(image);
    this.sprite.anchor.set(0.5);
    this.sprite.x = position.x;
    this.sprite.y = position.y;
    this.sprite.rotation = Math.PI/2. + utils.vRad(direction);
    canvas.background.addChild(this.sprite);

    this.tick = new PIXI.Ticker();
    this.tick.add( this.refresh.bind(this) );
    this.tick.start();
  }
 
  static create(position, direction, velocity, image, onHit, deviation=0.0, sync=true){
    if (sync){
      p_socket.executeForOthers("create_projectile",{position:position, direction: direction, velocity:velocity, image:image, deviation:deviation});
    }
    return new Projectile(position,direction, velocity, image, onHit, deviation);
  }


  destroy(){
    this.sprite.destroy();
    this.tick.destroy();
  }

  refresh(){
    let p1 = {x:this.sprite.x, y:this.sprite.y};
    let p2 = utils.vAdd(p1, utils.vMult(this.dir, this.vel));
    let r = new Ray(p1, p2);
    let wcoll = canvas.walls.checkCollision(r);
    let tcoll = canvas.tokens.placeables.filter(t=>t.bounds.contains(p2.x, p2.y));
    tcoll = tcoll.filter(t=>getHP(t));
    if (wcoll || tcoll.length){
      let data = {};
      if (tcoll.length){
        data.token = tcoll[0];
      };
      data.x = p1.x;
      data.y = p1.y;
      try{
        if (this.onHit != undefined) this.onHit(data);
      }catch (error){
        console.error(error);
      }
      this.destroy();
    }else {
      this.sprite.x = p2.x;
      this.sprite.y = p2.y;
    }
  }
}

class Explosion{
  constructor(position){
    
  }

}


const argFact = (compareFn) => (array) => array.map((el, idx) => [el, idx]).reduce(compareFn)[1]
const argMax = argFact((min, el) => (el[0] > min[0] ? el : min))
const argMin = argFact((max, el) => (el[0] < max[0] ? el : max))

function rad2deg(radians){return radians * 180 / Math.PI;}
function vSub(v1,v2){return {x:v1.x-v2.x, y:v1.y-v2.y}}
function len2(v1,v2){return (v1.x-v2.x)**2 + (v1.y-v2.y)**2 }


Hooks.on('updateToken', (token, change, options, user_id)=>{
  if (!game.user.isGM)return true;                          // only trigger on the gm's client
  if (!game.settings.get(MOD_NAME, "cannons")) return true; // If cannon-animation is off
  if (!token.actor.hasPlayerOwner) return true;                   // This token has a player owner

  let players = canvas.tokens.placeables.filter( t=>t.actor.hasPlayerOwner );
  let cannons = Tagger.getByTag("cannon");
  

  for (let cannon of cannons){
    let p = players;
    if (!game.settings.get(MOD_NAME, 'cannon_closest')){
      p = p.filter(t=>{return !canvas.walls.checkCollision(new Ray(t.center, cannon.object.center))});
    }
    if (p.length){
      let distances = p.map( player=>len2(player.center, cannon.object.center));
      let closest = argMin(distances);
      
      let dir = vSub(p[closest].center, cannon.object.center);
      let r = Math.atan2(dir.x, dir.y);
      let d = 0-rad2deg(r);
      cannon.update({rotation:d});
    }

  }

  "dfreds pocket money"
  "innocentis loot"
  "monks little details"

});


Hooks.on("canvasReady", (can)=>{
  //console.error(can);
});





Hooks.once('init', async function () {
  window.Projectile = Projectile;


  game.settings.register(MOD_NAME, "cannons", {
    name: "Auto-aiming cannons",
    hint: 'Should tiles/tokens tagged "cannon" (using the Tagger module) auto aim',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register(MOD_NAME, "cannon_closest", {
    name: "Auto-aiming towards closest player",
    hint: 'Aiming at the closest player (true), or only at visible tokens (false).',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });



})

Hooks.once("ready", () => {  
    
});


