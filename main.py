from flask import Flask, request, render_template, redirect, url_for, session, flash
import random
import time
import json
from pathlib import Path

# ============================================================
# CHARGEMENT DES DONNÉES
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# Chargement actif.json
with open(DATA_DIR / "actif.json", encoding="utf-8") as f:
    ACTIF = json.load(f)

# Chargement passif.json
with open(DATA_DIR / "passif.json", encoding="utf-8") as f:
    PASSIF = json.load(f)

# Par défaut, conjugaisons = actif
conjugaisons = ACTIF


# ============================================================
# FLASK
# ============================================================

app = Flask(__name__)
app.secret_key = "secret123"


# ============================================================
# ROUTES DE BASE
# ============================================================

@app.route("/")
def index():
    session.clear()
    return render_template("index.html")


@app.route("/changelog")
def changelog():
    return render_template("changelog.html")


@app.route("/cible")
def cible():

    # Modes disponibles (à partir de ACTIF)
    modes = sorted({m for v in ACTIF.values() for m in v.keys()})

    # Mapping mode -> temps valides
    modes_temps = {}
    for v in ACTIF.values():
        for mode, temps_dict in v.items():
            modes_temps.setdefault(mode, set())
            for t in temps_dict.keys():
                modes_temps[mode].add(t)

    modes_temps = {m: sorted(list(ts)) for m, ts in modes_temps.items()}

    # Listes de verbes
    LISTES_VERBES = {
        "liste1": ["être", "avoir", "aller", "faire", "falloir", "pouvoir", "savoir", "valoir", "vouloir", "appeler", "jeter"],
        "liste2": ["peindre", "peigner", "plaire", "pleuvoir", "se taire", "taire", "moudre", "mouler", "choir", "tuer"],
        "liste3": ["acquérir", "seoir", "devoir", "cueillir", "fuir", "recevoir", "rendre", "courir", "tenir", "sentir"],
        "liste4": ["joindre", "assaillir", "pouvoir", "asseoir", "faillir", "savoir", "voir", "vaincre", "prendre", "croire"],
    }

    return render_template(
        "cible.html",
        modes=modes,
        modes_temps_json=json.dumps(modes_temps, ensure_ascii=False),
        listes=LISTES_VERBES
    )


# ============================================================
# GÉNÉRATION D’UNE QUESTION
# ============================================================

def generer_question(modes=None, temps=None, personnes=None, verbes=None, base=None):
    """
    base = ACTIF ou PASSIF selon la voix choisie
    """
    try:
        local_conj = base if base else ACTIF

        # 1) Sélection du verbe
        if verbes:
            candidats_verbes = [v for v in verbes if v in local_conj]
            if not candidats_verbes:
                return generer_question(modes, temps, personnes, verbes, base)
            verbe = random.choice(candidats_verbes)
        else:
            verbe = random.choice(list(local_conj.keys()))

        modes_dict = local_conj.get(verbe, {})
        if not modes_dict:
            return generer_question(modes, temps, personnes, verbes, base)

        # 2) Sélection du mode
        if modes:
            candidats_modes = [m for m in modes if m in modes_dict]
            if not candidats_modes:
                return generer_question(modes, temps, personnes, verbes, base)
            mode_v = random.choice(candidats_modes)
        else:
            mode_v = random.choice(list(modes_dict.keys()))

        temps_dict = modes_dict.get(mode_v, {})
        if not temps_dict:
            return generer_question(modes, temps, personnes, verbes, base)

        # 3) Sélection du temps
        if temps:
            candidats_temps = [t for (m, t) in temps if m == mode_v and t in temps_dict]
            if not candidats_temps:
                return generer_question(modes, temps, personnes, verbes, base)
            temps_sel = random.choice(candidats_temps)
        else:
            temps_sel = random.choice(list(temps_dict.keys()))

        formes = temps_dict.get(temps_sel, [])
        if not formes:
            return generer_question(modes, temps, personnes, verbes, base)

        # 4) Sélection de la personne
        mapping = ["je", "tu", "il", "nous", "vous", "ils"]

        if mode_v.lower() == "impératif":
            imperatif_personnes = ["tu", "nous", "vous"]

            if personnes:
                convert = {"2s": "tu", "1p": "nous", "2p": "vous"}
                sujets_possibles = [convert[p] for p in personnes if p in convert]
            else:
                sujets_possibles = imperatif_personnes

            if not sujets_possibles:
                sujets_possibles = imperatif_personnes

            sujet = random.choice(sujets_possibles)
            idx = mapping.index(sujet)

        else:
            if len(formes) == 1:
                sujet = "(forme impersonnelle)"
                idx = 0
            else:
                if personnes:
                    convert = {
                        "1s": "je", "2s": "tu", "3s": "il",
                        "1p": "nous", "2p": "vous", "3p": "ils"
                    }
                    sujets_possibles = [
                        convert[p] for p in personnes
                        if convert[p] in mapping[:len(formes)]
                    ]
                else:
                    sujets_possibles = mapping[:len(formes)]

                if not sujets_possibles:
                    return generer_question(modes, temps, personnes, verbes, base)

                sujet = random.choice(sujets_possibles)
                idx = mapping.index(sujet)

        if idx >= len(formes):
            return generer_question(modes, temps, personnes, verbes, base)

        bonne = formes[idx]

        mapping_desc = {
            "je": "1re personne du singulier",
            "tu": "2e personne du singulier",
            "il": "3e personne du singulier",
            "nous": "1re personne du pluriel",
            "vous": "2e personne du pluriel",
            "ils": "3e personne du pluriel",
            "(forme impersonnelle)": "(forme impersonnelle)"
        }

        sujet_affiche = mapping_desc.get(sujet, sujet)
        question = f"Conjugue : {verbe} — {mode_v} — {temps_sel} — {sujet_affiche}"

        return verbe, mode_v, temps_sel, sujet, bonne, question

    except Exception:
        return generer_question(modes, temps, personnes, verbes, base)


# ============================================================
# MODE RÉVISION CIBLÉE
# ============================================================

@app.route("/cible_start", methods=["POST"])
def cible_start():

    session["mode"] = "cible"
    session["score"] = 0
    session["total"] = 0
    session["start"] = time.time()

    session["cible_modes"] = request.form.getlist("modes")
    session["cible_personnes"] = request.form.getlist("personnes")
    session["cible_verbes"] = request.form.getlist("verbes")

    # VOIX (actif/passif)
    session["cible_voix"] = request.form.getlist("voix")

    raw_temps = request.form.getlist("temps")
    session["cible_temps"] = []

    for item in raw_temps:
        try:
            mode, temps = item.split("|")
            session["cible_temps"].append((mode, temps))
        except:
            continue

    if not session["cible_modes"] or not session["cible_temps"] or not session["cible_personnes"] or not session["cible_verbes"]:
        flash("Veuillez sélectionner au moins un mode, un temps, une personne et un verbe.")
        return redirect("/cible")

    session["questions_cibles"] = []

    for verbe in session["cible_verbes"]:
        for mode, temps in session["cible_temps"]:
            for personne in session["cible_personnes"]:
                session["questions_cibles"].append((verbe, mode, temps, personne))

    random.shuffle(session["questions_cibles"])

    return redirect("/quiz")


# ============================================================
# ROUTE DU QUIZ
# ============================================================

@app.route("/quiz", methods=["GET", "POST"])
def quiz():

    # Initialisation depuis l'accueil
    if request.method == "GET" and "mode" in request.args:
        session.clear()
        mode = request.args.get("mode")
        session["mode"] = mode
        session["score"] = 0
        session["total"] = 0
        session["start"] = time.time()
        session["erreurs"] = []

        if mode == "evaluation":
            session["timer"] = 5 * 60
            session["questions_restantes"] = 10

    mode = session.get("mode", "entrainement")

    session.setdefault("score", 0)
    session.setdefault("total", 0)
    session.setdefault("erreurs", [])
    session.setdefault("start", time.time())

    if mode == "evaluation":
        session.setdefault("timer", 5 * 60)
        session.setdefault("questions_restantes", 10)

    if mode == "evaluation":
        if time.time() - session["start"] >= session["timer"]:
            return redirect("/fin")

    feedback = None

    # Réception réponse
    if request.method == "POST":
        rep = request.form["reponse"].strip().lower()
        if rep == "chateaubriand":
            return redirect("https://youtu.be/2Taq4fOVQ60")

        bonne = session["bonne"]
        session["total"] += 1

        if rep != bonne.lower():
            session["erreurs"].append((
                session["verbe"],
                session["mode_verbe"],
                session["temps"],
                session["sujet"],
                rep,
                bonne
            ))
        else:
            session["score"] += 1

        if mode == "evaluation":
            session["questions_restantes"] -= 1
            if session["questions_restantes"] <= 0:
                return redirect("/fin")

        elif mode == "revision":
            if not session.get("erreurs_revision"):
                return redirect("/fin")

        else:
            feedback = "✔️ Correct" if rep == bonne.lower() else f"❌ Faux. Réponse attendue : {bonne}"

    # Nouvelle question
    if mode == "revision":

        if not session.get("erreurs_revision"):
            return redirect("/fin")

        verbe, mode_v, temps, sujet, rep_faute, bonne = session["erreurs_revision"].pop(0)
        question = f"Conjugue : {verbe} — {mode_v} — {temps} — {sujet}"

    elif mode == "cible":

        # Sélection de la base actif/passif
        voix = session.get("cible_voix", ["actif"])

        if "actif" in voix and "passif" in voix:
            base = random.choice([ACTIF, PASSIF])
        elif "passif" in voix:
            base = PASSIF
        else:
            base = ACTIF

        verbe, mode_v, temps, sujet, bonne, question = generer_question(
            modes=session["cible_modes"],
            temps=session["cible_temps"],
            personnes=session["cible_personnes"],
            verbes=session["cible_verbes"],
            base=base
        )

    else:
        verbe, mode_v, temps, sujet, bonne, question = generer_question()

    # Stockage
    session["verbe"] = verbe
    session["mode_verbe"] = mode_v
    session["temps"] = temps
    session["sujet"] = sujet
    session["bonne"] = bonne

    temps_restant = None
    if mode == "evaluation":
        temps_restant = int(session["timer"] - (time.time() - session["start"]))

    return render_template(
        "quiz.html",
        question=question,
        feedback=feedback,
        mode=mode,
        temps_restant=temps_restant
    )


# ============================================================
# ROUTE DU BILAN
# ============================================================

@app.route("/fin")
def fin():
    end = time.time()
    duree = round(end - session["start"], 1)
    total = session["total"]
    score = session["score"]
    taux = round(score / total * 100, 1) if total else 0
    temps_moyen = round(duree / total, 2) if total else 0

    erreurs = session.get("erreurs", [])

    analyse = None
    if erreurs:
        stats_verbes = {}
        stats_modes = {}
        stats_temps = {}

        for v, m, t, s, r, b in erreurs:
            stats_verbes[v] = stats_verbes.get(v, 0) + 1
            stats_modes[m] = stats_modes.get(m, 0) + 1
            stats_temps[t] = stats_temps.get(t, 0) + 1

        def top(d):
            return sorted(d.items(), key=lambda x: x[1], reverse=True)[:3]

        analyse = {
            "verbes": top(stats_verbes),
            "modes": top(stats_modes),
            "temps": top(stats_temps),
            "suggestion": f"{top(stats_verbes)[0][0]} — {top(stats_modes)[0][0]} — {top(stats_temps)[0][0]}"
        }

    return render_template(
        "fin.html",
        total=total,
        score=score,
        taux=taux,
        duree=duree,
        temps_moyen=temps_moyen,
        erreurs=erreurs,
        analyse=analyse
    )


# ============================================================
# LANCEMENT LOCAL
# ============================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
