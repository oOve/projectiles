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


const MOD_NAME = "Projectiles";

function lang(k){
  return game.i18n.localize("PROJECTILES."+k);
}

function getHP(token){
  if (game.system.id == 'dnd5e'){
    return token.actor.data.data.attributes.hp.value;
  }

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
        this.onHit(data);
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









Hooks.once('init', async function () {
  window.Projectile = Projectile;
})

Hooks.once("ready", () => {  
    window.Projectile = Projectile;
});


