"""Test de bout en bout : serveur PHP local + Chromium (Playwright).
Usage : python3 tools/e2e_test.py   (nécessite php, playwright, chromium)"""
import subprocess, time, hashlib, os, json, sys, shutil, tempfile
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB=os.path.join(ROOT,"public"); CFG=os.path.join(PUB,"api","config.php"); DATA=os.path.join(PUB,"api","data")
OUT=os.environ.get("E2E_OUT",tempfile.mkdtemp())
assert not os.path.exists(CFG), "config.php existe déjà : test annulé pour ne pas l'écraser"
open(CFG,"w").write("<?php define('TEACHER_SHA256','%s');"%hashlib.sha256(b"secret-test").hexdigest())
srv=subprocess.Popen(["php","-S","127.0.0.1:8099","-t",PUB],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
B="http://127.0.0.1:8099"; fails=[]
def check(c,m):
    print(("OK   " if c else "FAIL ")+m); 
    if not c: fails.append(m)
try:
  with sync_playwright() as p:
    br=p.chromium.launch(executable_path="/opt/pw-browsers/chromium" if os.path.exists("/opt/pw-browsers/chromium") else None)
    def ident(pg,cl,ps):
        pg.fill("#sv-c",cl); pg.fill("#sv-p",ps); pg.click("#sv-ok")
    # ---- Arnaque
    ctx=br.new_context(); pg=ctx.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(B+"/jeux/arnaque/"); ident(pg,"4b-test","Renard")
    verd=pg.evaluate("DOCS.map(d=>d.v)")
    for i in range(1,9):
        pg.click('.tile[data-id="%d"]'%i)
        for c in pg.query_selector_all(".clue"): c.click()
        if i==2: pg.click('#vd [data-v="R"]')   # erreur volontaire
        pg.click('#vd [data-v="%s"]'%verd[i-1]); pg.click("#ok")
    pg.fill("#word","SIGNALER"); pg.click("#try"); pg.wait_for_selector("#sv-stat")
    check("envoyé" in pg.inner_text("#sv-stat"),"arnaque : bilan envoyé")
    check(not errs,"arnaque : aucune erreur JS %s"%errs)
    # ---- Frais
    pg2=ctx.new_page(); errs2=[]; pg2.on("pageerror",lambda e:errs2.append(str(e)))
    pg2.goto(B+"/jeux/frais/")
    check(pg2.is_visible("#sv-back") is False,"frais : identité mémorisée entre jeux")
    for _ in range(80):
        if "Bilan" in pg2.inner_text("#app"): break
        if pg2.is_visible("#nx"): pg2.click("#nx")
        elif pg2.is_visible("#app .primary"): pg2.click("#app .primary")
        else:
            ch=pg2.query_selector_all("#app .choice:not([disabled])")
            if not ch: break
            ch[-1 if "Quel" in pg2.inner_text("#app")[:0] else 0].click()
        pg2.wait_for_timeout(30)
    pg2.wait_for_selector("#sv-stat",timeout=3000)
    check("envoyé" in pg2.inner_text("#sv-stat"),"frais : bilan envoyé")
    check(not errs2,"frais : aucune erreur JS %s"%errs2)
    # ---- Hors-ligne : code de bilan
    ctx3=br.new_context(); pg3=ctx3.new_page(); pg3.route("**/api/collect.php",lambda r:r.abort())
    pg3.goto(B+"/jeux/arnaque/"); ident(pg3,"4B-TEST","Hibou")
    pg3.evaluate("Suivi.finish({tries:1})"); pg3.wait_for_selector("#sv-code")
    code=pg3.input_value("#sv-code"); check(len(code)>20,"hors-ligne : code de bilan fourni")
    # ---- Sans suivi
    ctx4=br.new_context(); pg4=ctx4.new_page(); pg4.goto(B+"/jeux/arnaque/"); pg4.click("#sv-no")
    pg4.evaluate("Suivi.finish({})"); pg4.wait_for_selector("#sv-stat"); check("sans suivi" in pg4.inner_text("#sv-stat"),"sans suivi : aucun envoi")
    # ---- Tableau de bord
    pd=ctx.new_page(); pd.goto(B+"/prof/"); pd.fill("#pwd","mauvais"); pd.click("#btnLogin"); pd.wait_for_timeout(1500)
    check("incorrect" in pd.inner_text("#loginErr"),"prof : mauvais mot de passe refusé")
    pd.fill("#pwd","secret-test"); pd.click("#btnLogin"); pd.wait_for_selector("#tbl tbody tr")
    txt=pd.inner_text("#tbl tbody")
    check("Renard" in txt and "8/8" in txt and "1 erreur" in txt,"prof : arnaque 8/8 avec 1 erreur")
    check("Quiz" in txt and "terminé" in txt,"prof : frais terminé avec quiz")
    check("Hibou" not in txt,"prof : le bilan hors-ligne n'est pas compté")
    pd.set_viewport_size({"width":1180,"height":700}); pd.screenshot(path=OUT+"/dashboard.png")
    pd.click("#tbl tbody tr"); pd.wait_for_selector("#dBody li"); check("verdict" in pd.inner_text("#dBody"),"prof : détail chronologique")
    pd.screenshot(path=OUT+"/dashboard_detail.png",full_page=True)
    # import hors-ligne
    pd.click("summary:has-text(\"Importer un code de bilan élève (hors-ligne)\")"); pd.fill("#importBox textarea",code); pd.click("#importBox button"); pd.wait_for_timeout(300)
    check("Hibou" in pd.inner_text("#tbl tbody"),"prof : import du code de bilan")
    # purge pseudo
    pd.once("dialog",lambda d:d.accept()); pd.click("#tbl tbody tr:has-text('Renard')"); pd.click("#dPurge"); pd.wait_for_timeout(600)
    check("Renard" not in pd.inner_text("#tbl tbody"),"prof : suppression d'un élève")
    # API : accès direct aux données interdit (php -S ignore .htaccess : on vérifie juste l'auth)
    r=pd.request.post(B+"/api/list.php",data=json.dumps({"action":"list","classe":"4B-TEST"}))
    check(r.status==401,"api : list sans mot de passe = 401")
    r=pd.request.post(B+"/api/collect.php",data=json.dumps({"events":[{"classe":"x","pseudo":"a","sid":"1","game":"zz","type":"debut"}]}))
    check(r.status==200 and r.json()["stored"]==0,"api : événement invalide ignoré")
    br.close()
finally:
    srv.terminate(); os.remove(CFG); shutil.rmtree(DATA,ignore_errors=True)
print("captures :",OUT)
sys.exit(1 if fails else 0)
