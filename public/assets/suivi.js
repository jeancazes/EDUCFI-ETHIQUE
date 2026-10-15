/* Suivi élève – EDUCFI critique
 * Léger, sans dépendance. Identité = code classe + pseudo (jamais le vrai nom).
 * Envoie des événements à ../api/collect.php ; si le serveur est injoignable,
 * l'élève obtient un « code de bilan » à copier pour son enseignant.
 */
(function(){
  "use strict";
  var script=document.currentScript;
  var API=new URL("../api/",script.src).href;
  var KID="educfi.identite", KQ="educfi.file";
  var ident=null, sid=null, game=null, t0=0, log=[], finished=false;

  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v);}catch(e){return null;} }
  function uid(){ try{ return crypto.randomUUID(); }catch(e){ return "s"+Math.random().toString(36).slice(2)+Date.now().toString(36); } }
  function clean(s,n){ return String(s==null?"":s).replace(/[<>]/g,"").trim().slice(0,n); }
  function normClass(s){ return String(s||"").toUpperCase().replace(/[^A-Z0-9-]/g,"").slice(0,20); }

  var css=document.createElement("style");
  css.textContent=
   "#sv-back{position:fixed;inset:0;background:rgba(5,10,20,.82);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px}"+
   "#sv-box{background:#17263d;color:#f2f5fa;border:1px solid #3e5f90;border-radius:16px;padding:22px;max-width:420px;width:100%;font:16px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}"+
   "#sv-box h2{margin:.1em 0 .4em;font-size:1.2rem}#sv-box label{display:block;margin:.7em 0 .2em;font-size:.9rem;color:#a9b6c9}"+
   "#sv-box input{width:100%;padding:10px;border-radius:10px;border:1px solid #3e5f90;background:#0f1b2d;color:#fff;font:inherit}"+
   "#sv-box button{font:inherit;cursor:pointer;border-radius:10px;padding:10px 14px;border:1px solid #3e5f90;background:#1f3556;color:#fff;margin-top:12px}"+
   "#sv-box button.p{background:#ffb703;color:#111;border-color:#ffb703;font-weight:600}"+
   "#sv-box .n{font-size:.82rem;color:#a9b6c9;margin-top:10px}#sv-box .e{color:#ff8b8b;font-size:.9rem;min-height:1.2em}"+
   "#sv-badge{position:fixed;right:8px;bottom:8px;background:#17263dcc;color:#cfd8e6;border:1px solid #2c4062;border-radius:999px;padding:4px 10px;font:12px system-ui,sans-serif;z-index:900}"+
   "#sv-badge button{all:unset;cursor:pointer;text-decoration:underline;margin-left:6px}"+
   "#sv-stat{position:fixed;left:8px;right:8px;bottom:40px;max-width:520px;margin:0 auto;background:#17263d;color:#f2f5fa;border:1px solid #3e5f90;border-radius:12px;padding:10px 12px;font:14px/1.4 system-ui,sans-serif;z-index:900}"+
   "#sv-stat textarea{width:100%;height:64px;margin-top:6px;background:#0f1b2d;color:#fff;border:1px solid #3e5f90;border-radius:8px;font:11px monospace}"+
   "#sv-stat button{font:inherit;cursor:pointer;border-radius:8px;padding:5px 10px;border:1px solid #3e5f90;background:#1f3556;color:#fff;margin-top:6px}";
  document.head.appendChild(css);

  function el(html){ var d=document.createElement("div"); d.innerHTML=html; return d.firstElementChild; }

  function badge(){
    var b=document.getElementById("sv-badge"); if(b) b.remove();
    b=el('<div id="sv-badge"></div>');
    b.textContent=ident&&!ident.anon ? "👤 "+ident.pseudo+" · "+ident.classe : "👤 sans suivi";
    var c=document.createElement("button"); c.textContent="changer"; c.onclick=function(){ ask(function(){ badge(); }); };
    b.appendChild(c); document.body.appendChild(b);
  }

  function ask(done){
    var prev=ident||{};
    var m=el('<div id="sv-back" role="dialog" aria-modal="true" aria-labelledby="sv-t"><div id="sv-box">'+
     '<h2 id="sv-t">Qui joue ?</h2>'+
     '<p style="margin:.2em 0">Ton professeur pourra voir ta progression.</p>'+
     '<label for="sv-c">Code de la classe (donné par ton professeur)</label><input id="sv-c" autocomplete="off" maxlength="20" placeholder="ex. 4B-LAB">'+
     '<label for="sv-p">Ton pseudo <b>(pas ton vrai nom)</b></label><input id="sv-p" autocomplete="off" maxlength="24" placeholder="ex. Renard42">'+
     '<div class="e" id="sv-e" aria-live="polite"></div>'+
     '<button class="p" id="sv-ok">C\'est parti</button> <button id="sv-no">Jouer sans suivi</button>'+
     '<div class="n">Seuls ton pseudo, ton code de classe et tes réponses au jeu sont enregistrés (pas d\'adresse, pas de nom). Ton professeur peut tout effacer.</div>'+
     '</div></div>');
    document.body.appendChild(m);
    var c=m.querySelector("#sv-c"), p=m.querySelector("#sv-p"), e=m.querySelector("#sv-e");
    c.value=prev.classe||""; p.value=prev.pseudo||""; (c.value?p:c).focus();
    function ok(){
      var cl=normClass(c.value), ps=clean(p.value,24);
      if(cl.length<2){ e.textContent="Entre le code de ta classe (2 caractères minimum)."; return; }
      if(ps.length<2){ e.textContent="Choisis un pseudo (2 caractères minimum)."; return; }
      ident={classe:cl,pseudo:ps}; ls(KID,JSON.stringify(ident)); m.remove(); done&&done();
    }
    m.querySelector("#sv-ok").onclick=ok;
    m.querySelector("#sv-no").onclick=function(){ ident={anon:true}; ls(KID,JSON.stringify(ident)); m.remove(); done&&done(); };
    m.addEventListener("keydown",function(ev){ if(ev.key==="Enter") ok(); });
  }

  function queue(){ try{ return JSON.parse(ls(KQ)||"[]"); }catch(e){ return []; } }
  function saveQ(q){ ls(KQ, q.length?JSON.stringify(q.slice(-300)):null); }

  function post(items){
    return fetch(API+"collect.php",{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify({events:items}),keepalive:true})
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); });
  }
  var chain=Promise.resolve();
  function doFlush(){
    if(!ident||ident.anon) return false;
    var q=queue(); if(!q.length) return true;
    var n=Math.min(50,q.length);
    return post(q.slice(0,n)).then(function(){ var rest=queue().slice(n); saveQ(rest); return rest.length?doFlush():true; })
      .catch(function(){ return false; });
  }
  function flush(){ chain=chain.then(doFlush); return chain; }
  function push(type,d){
    var ev={t:Date.now(),sid:sid,game:game,type:type,d:d||{}};
    log.push(ev);
    if(!ident||ident.anon) return Promise.resolve(false);
    ev.classe=ident.classe; ev.pseudo=ident.pseudo;
    var q=queue(); q.push(ev); saveQ(q); return flush();
  }

  function code(){ try{ return btoa(unescape(encodeURIComponent(JSON.stringify({v:1,ident:ident&&!ident.anon?ident:null,game:game,events:log})))); }catch(e){ return ""; } }

  function status(ok){
    var s=document.getElementById("sv-stat"); if(s) s.remove();
    var anon=!ident||ident.anon;
    var html;
    if(anon) html='Partie terminée (sans suivi).';
    else if(ok) html='✅ Ton bilan a été envoyé à ton professeur.';
    else html='⚠️ Connexion impossible. <b>Copie ce code de bilan</b> et donne-le à ton professeur :<textarea readonly id="sv-code"></textarea><button id="sv-copy">Copier le code</button>';
    s=el('<div id="sv-stat"><span>'+html+'</span> <button id="sv-x" aria-label="Fermer">×</button></div>');
    document.body.appendChild(s);
    var ta=s.querySelector("#sv-code"); if(ta){ ta.value=code(); s.querySelector("#sv-copy").onclick=function(){ ta.select(); try{document.execCommand("copy");}catch(e){} }; }
    s.querySelector("#sv-x").onclick=function(){ s.remove(); };
  }

  window.Suivi={
    ready:function(fn){
      try{ ident=JSON.parse(ls(KID)||"null"); }catch(e){ ident=null; }
      if(ident&&(ident.anon||(ident.classe&&ident.pseudo))){ badge(); fn(); }
      else ask(function(){ badge(); fn(); });
      flush();
    },
    begin:function(g){ game=g; sid=uid(); t0=Date.now(); log=[]; finished=false; var s=document.getElementById("sv-stat"); if(s) s.remove(); push("debut",{}); },
    ev:function(type,d){ if(sid) push(type,d); },
    finish:function(summary){
      if(!sid||finished) return; finished=true;
      var d=Object.assign({},summary||{},{duree:Math.round((Date.now()-t0)/1000)});
      push("fin",d).then(function(ok){ status(ok===true); });
    },
    code:code
  };
})();
