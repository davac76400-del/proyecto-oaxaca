const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{
 const b = await chromium.launch();
 const pg = await b.newPage({viewport:{width:1056,height:1632}});
 await pg.goto('file:///home/user/proyecto-oaxaca/cartel/cartel.html');
 await pg.waitForTimeout(2500);
 await pg.pdf({path:'cartel_doble_carta.pdf',width:'11in',height:'17in',printBackground:true});
 await pg.screenshot({path:'/tmp/claude-0/-home-user-proyecto-oaxaca/b9338e06-8bb4-5cc1-a642-9256c5f9fc35/scratchpad/prev.png'});
 await b.close();
})();
