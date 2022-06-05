

# Projectiles
**Projectiles** is a framework for [Foundry VTT](https://foundryvtt.com/  "Foundry VTT") that allows projectiles to be added to the game.

<p align="center">

![GitHub release (latest by date)](https://img.shields.io/github/v/release/oOve/projectiles?style=flat-square)
[![Become a Patron](https://img.shields.io/badge/support-patreon-orange.svg?style=flat-square&logo=patreon)](https://www.patreon.com/drO_o)
 </p>

See [video](./media/video.mp4)

# Usage
Install/enable this module, then add the following macro:
```JS
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
  Projectiles macro
  See: https://github.com/oOve/projectiles for more info 
 */

let tex = 'modules/projectiles/media/td_basic_towers/PNG/Bullet_Cannon.png';

let mouse = canvas.app.renderer.plugins.interaction.mouse;
let local = mouse.getLocalPosition(canvas.app.stage);

function onHit(data){
  console.log("Hitdata:", data);
  if (data.token){
     data.token.actor.update({'data.attributes.hp.value':0});
  }
  let sequence = new Sequence()
   sequence.effect()
   .atLocation(data)
   .file("jb2a.explosion.01.orange")
   .sound("modules/pzzl-1/media/156031__iwiploppenisse__explosion.mp3")
   ;
  sequence.play();
}


let tok = canvas.tokens.controlled[0];
let p = tok.center;
let dir = {x: local.x-p.x, y: local.y-p.y};
let s = Math.sqrt(dir.x**2 + dir.y**2);
dir.x/=s;
dir.y/=s;

p.x += dir.x * tok.width  *0.6;
p.y += dir.y * tok.height *0.6;
let t = new Projectile( {x:p.x, y:p.y}, dir, 10.0, tex, onHit );
```


# Localization
Current support for:
 * English -- https://github.com/oOve
 * 
 

If you want to translate this module, download [this file](lang/en.json) and translate it. After that open an issue sharing your translation. Also share the default name convention for your language. You can find that by either, finding a system or module that is already translated to your language and open its module.json. It should look something like this: ``` "languages": [ { "lang": "en", "name": "English", "path": "lang/en.json" } ```

# Compatibility
Tested on [Foundry VTT](https://foundryvtt.com/  "Foundry VTT") version `9`.

# Feedback
All feedback and suggestions are welcome. Please contact me on Discord (Ove#4315), join the discussion on the Modules' [Discord channel](https://discord.gg/5CCAhsKFDp)

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/oOve/Projectiles/issues  "Issue Tracker")

# Licensing
**Projectiles** is a module for [Foundry VTT](https://foundryvtt.com/  "Foundry VTT") by Dr.O  under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).
