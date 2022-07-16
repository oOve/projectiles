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

  // Default, valid for 5e and pf at least
  return token.actor.data.data.attributes.hp.value;
}

let desc = {
	"alpha": {
		"start": 1,
		"end": 0
	},
	"scale": {
		"start": 0.2,
		"end": 0.15,
		"minimumScaleMultiplier": 5
	},
	"color": {
		"start": "#aaaaaa",
		"end": "#010101"
	},
	"speed": {
		"start": 200,
		"end": 50,
		"minimumSpeedMultiplier": 1
	},
	"acceleration": {
		"x": 0,
		"y": 500
	},
	"maxSpeed": 0,
	"startRotation": {
		"min": 0,
		"max": 360
	},
	"noRotation": true,
	"rotationSpeed": {
		"min": 0,
		"max": 0
	},
	"lifetime": {
		"min": 0.2,
		"max": 0.8
	},
	"blendMode": "normal",
	"frequency": 0.001,
	"emitterLifetime": -1,
	"maxParticles": 430,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": false,
	"spawnType": "point"
};




export default class Projectile{
  constructor(position, direction, velocity, image, onHit, deviation=0.0, trail=false){
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
    canvas.foreground.addChild(this.sprite);
    
    desc.pos = position;
    if (trail){
      this.emitter = new PIXI.particles.Emitter(canvas.foreground,'/modules/projectiles/media/particle.png', desc);
      this.emitter.emit = true;
    }else{this.emitter=null;}

    this.tick = new PIXI.Ticker();
    this.tick.add( this.refresh.bind(this) );
    this.tick.start();
  }
 
  static create(position, direction, velocity, image, onHit, deviation=0.0, sync=true, trail=false){
    if (sync){
      p_socket.executeForOthers("create_projectile",{position:position, direction: direction, velocity:velocity, image:image, deviation:deviation});
    }
    return new Projectile(position,direction, velocity, image, onHit, deviation, trail);
  }


  destroy(){
    this.sprite.destroy();
    this.tick.destroy();
    if(this.emitter)
      this.emitter.destroy();
  }

  refresh(ms){
    
    let p1 = {x:this.sprite.x, y:this.sprite.y};
    let p2 = utils.vAdd(p1, utils.vMult(this.dir, this.vel));
    
    if (this.emitter){
      this.emitter.update(ms*0.01);
      this.emitter.updateSpawnPos(p1.x, p1.y);
    }
    
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
    this.pos = position;
    this.rep = 0;
    this.len = 200;
    desc.pos = position;
    this.emitter = new PIXI.particles.Emitter(canvas.foreground,'/modules/projectiles/media/particle.png', desc);
    this.emitter.emit = true;
    this.tick = new PIXI.Ticker();
    this.tick.add( this.refresh.bind(this) );
    this.tick.start();
  }
  destroy(){
    this.emitter.destroy();
    this.tick.destroy();
  }

  refresh(ms){
    this.rep+=ms;
    this.emitter.update(ms * 0.001);
    if (this.rep>this.len) this.destroy();    
  }

}



/*
class Explosion{
  constructor(position){
    this.pos = position;
    this.rep = 0;
    this.count = 20;
    this.len = 50;
    this.p = [...Array(this.count).keys()].map(t=>Object.assign({},this.pos));
    this.v = this.p.map(t=>{
      let phi = Math.random()*2*Math.PI;
      return {x:Math.cos(phi), y:Math.sin(phi)};
    });
    let image = '/modules/projectiles/media/20220609192700-6f49d388.png';
    this.s = this.p.map(p=>{
      let s = PIXI.Sprite.from(image);
      s.anchor.set(0.5);
      s.x=p.x;
      s.y=p.y;
      s.width = canvas.grid.size*2;
      s.height= canvas.grid.size*2;
      s.rotation = Math.random()*2*Math.PI;
      canvas.foreground.addChild(s);
      return s;
    });
    this.tick = new PIXI.Ticker();
    this.tick.add( this.refresh.bind(this) );
    this.tick.start();
  }
  destroy(){
    this.s.map(s=>s.destroy());
    this.tick.destroy();
  }

  refresh(ms){
    this.rep+=ms;
    this.s.forEach((s,i)=>{
      s.x+=this.v[i].x * ms * 10.0;
      s.y+=this.v[i].y * ms * 10.0;
      s.alpha = 1.0 - this.rep / this.len;
    })
    if (this.rep>this.len) this.destroy();
    
  }

}
*/

const argFact = (compareFn) => (array) => array.map((el, idx) => [el, idx]).reduce(compareFn)[1]
const argMax = argFact((min, el) => (el[0] > min[0] ? el : min))
const argMin = argFact((max, el) => (el[0] < max[0] ? el : max))

function rad2deg(radians){return radians * 180 / Math.PI;}
function vSub(v1,v2){return {x:v1.x-v2.x, y:v1.y-v2.y}}
function len2(v1,v2){return (v1.x-v2.x)**2 + (v1.y-v2.y)**2 }


Hooks.on('updateToken', (token, change, options, user_id)=>{
  if (!game.user.isGM)return true;                          // only trigger on the gm's client
  if (!game.settings.get(MOD_NAME, "cannons")) return true; // If cannon-animation is off
  if (!token.actor.hasPlayerOwner) return true;             // This token has a player owner

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

});


Hooks.on("canvasReady", (can)=>{
    
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


