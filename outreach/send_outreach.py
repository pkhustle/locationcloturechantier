#!/usr/bin/env python3
"""
Script d'envoi automatisé et sécurisé des courriels d'outreach aux fournisseurs.
Utilise le SMTP sécurisé de Gmail (Port 465 SSL).

Usage:
  python3 outreach/send_outreach.py --list
  python3 outreach/send_outreach.py --target lou-tec --dry-run
  python3 outreach/send_outreach.py --target lou-tec --send
"""

import argparse
import os
import re
import smtplib
import ssl
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# Répertoire racine
ROOT_DIR = Path(__file__).resolve().parent.parent

# Liste des 8 partenaires identifiés et vérifiés
PROVIDERS = {
    "groupe-choquette": {
        "name": "Groupe Choquette",
        "contact_name": "Vincent Lizotte",
        "email": "vlizotte@groupechoquette.com",
        "villes": "Montréal, Laval, Longueuil",
        "angle": "Votre disponibilité 24/7 à Montréal est un atout que nos visiteurs recherchent.",
    },
    "cloture-secure": {
        "name": "Clôture Sécure",
        "contact_name": "Vincent Lizotte",
        "email": "vlizotte@groupechoquette.com",
        "villes": "Montréal, Laval, Longueuil",
        "angle": "Votre service 24/7 dans la région de Montréal ressort auprès des chantiers qui nous contactent en urgence.",
    },
    "lou-tec": {
        "name": "LOU-TEC",
        "contact_name": "Hugues Charbonneau",
        "email": "hugues.charbonneau@loutec.com",
        "villes": "Montréal, Québec, Laval, Gatineau, Longueuil",
        "angle": "Votre réseau de centres de location actif depuis 1979 couvre l'ensemble des grands marchés que nous desservons.",
    },
    "simplex": {
        "name": "Location d'outils Simplex",
        "contact_name": "Daniel Laliberté",
        "email": "dlaliberte@simplex.ca",
        "villes": "Montréal, Québec, Laval",
        "angle": "Vos clôtures robustes de chantier intéressent les entrepreneurs de la région de Montréal et de Québec.",
    },
    "super-save": {
        "name": "Super Save — Location de Clôture",
        "contact_name": "Steve Cummings",
        "email": "scummings@supersave.ca",
        "villes": "Montréal, Laval, Longueuil",
        "angle": "Votre service d'urgence 24/7 avec installation et retrait répond aux besoins fréquents de nos visiteurs.",
    },
    "moduloc": {
        "name": "Modu-Loc",
        "contact_name": "Rob Palbom",
        "email": "rpalbom@moduloc.ca",
        "villes": "Montréal, Québec, Laval, Gatineau, Longueuil",
        "angle": "Vos solutions pour chantiers et événements élargissent l'offre présentée à nos visiteurs.",
    },
    "battlefield": {
        "name": "Location d'équipement Battlefield",
        "contact_name": "Jean Savard",
        "email": "jean.savard@battlefieldequipment.ca",
        "villes": "Montréal, Québec, Laval, Gatineau, Longueuil",
        "angle": "Votre réseau de succursales au Québec et votre inventaire de clôtures 6 et 8 pi couvrent bien la demande de ces régions.",
    },
    "cloture-temporaire": {
        "name": "Clôture Temporaire",
        "contact_name": "Direction de Clôture Temporaire",
        "email": "info@cloturetemporaire.com",
        "villes": "Montréal, Laval",
        "angle": "Vos clôtures opaques et brise-vent répondent à une demande fréquente en milieu urbain dense.",
    },
}


def load_env():
    """Charge les variables d'environnement depuis .env.outreach ou .env."""
    env_file = ROOT_DIR / "outreach" / ".env.outreach"
    if not env_file.exists():
        env_file = ROOT_DIR / ".env.outreach"
    if not env_file.exists():
        env_file = ROOT_DIR / ".env"

    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def build_email(p):
    """Génère le sujet et le contenu du courriel personnalisé."""
    subject = f"{p['name']} est répertorié sur LocationClôtureChantier.ca"

    greeting = (
        f"Bonjour {p['contact_name']},"
        if not p["contact_name"].startswith("Direction")
        else "Bonjour,"
    )

    body = f"""{greeting}

Je vous écris au nom de LocationClôtureChantier.ca, un répertoire indépendant qui met en relation les entrepreneurs et gestionnaires de chantier du Québec avec des fournisseurs de clôture de chantier.

Nous avons ajouté {p['name']} à notre répertoire pour les secteurs de {p['villes']}.
{p['angle']} Votre fiche renvoie déjà vers votre site, et nous acheminons vers vous les demandes de soumission des visiteurs de ces régions :
https://locationcloturechantier.ca/fournisseurs

Deux choses :

1. Exactitude — pouvez-vous confirmer que vos secteurs desservis et vos services sont bien représentés ? Je corrige avec plaisir.
2. Lien — si la ressource vous semble utile à vos clients, un lien depuis votre site (page « Partenaires », « Liens utiles » ou un article de blogue) les aiderait à nous trouver et renforcerait notre collaboration.

Merci et au plaisir,

L'équipe LocationClôtureChantier.ca
info@locationcloturechantier.ca
https://locationcloturechantier.ca
"""
    return subject, body


def update_backlinks_md(provider_key, provider_name=""):
    """Coche automatiquement la case 'Courriel envoyé' dans BACKLINKS.md."""
    backlinks_path = ROOT_DIR / "BACKLINKS.md"
    if not backlinks_path.exists():
        return

    content = backlinks_path.read_text(encoding="utf-8")
    lines = content.splitlines()
    new_lines = []

    aliases = {
        "groupe-choquette": "Groupe Choquette",
        "cloture-secure": "Clôture Sécure",
        "cloture-temporaire": "Clôture Temporaire",
        "lou-tec": "LOU-TEC",
        "simplex": "Simplex",
        "super-save": "Super Save",
        "battlefield": "Battlefield",
        "moduloc": "Modu-Loc",
    }
    match_str = aliases.get(provider_key, provider_name)

    for line in lines:
        if line.strip().startswith(f"| {match_str}"):
            parts = line.split("|")
            # Format: | Fournisseur | Contact trouvé | Courriel envoyé | Relance | Lien en ligne | Notes |
            if len(parts) >= 5:
                parts[3] = " ☑ "
                line = "|".join(parts)
        new_lines.append(line)

    backlinks_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    print(f"✓ BACKLINKS.md mis à jour : case 'Courriel envoyé' cochée pour {match_str}.")


def send_via_gmail(to_email, subject, body_text):
    """Envoie le courriel via le SMTP Gmail."""
    user = os.environ.get("GMAIL_USER")
    password = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "")
    sender_name = os.environ.get("SENDER_NAME", "Location Clôture Chantier")
    reply_to = os.environ.get("REPLY_TO", "info@locationcloturechantier.ca")

    if not user or not password:
        print("\n❌ Erreur : GMAIL_USER ou GMAIL_APP_PASSWORD introuvable.")
        print("Veuillez renseigner votre courriel et votre mot de passe d'application Google dans 'outreach/.env.outreach'.")
        sys.exit(1)

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{sender_name} <{user}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Reply-To"] = reply_to

    msg.attach(MIMEText(body_text, "plain", "utf-8"))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(user, password)
        server.sendmail(user, [to_email], msg.as_string())


def main():
    parser = argparse.ArgumentParser(description="Envoi d'outreach aux fournisseurs")
    parser.add_argument("--list", action="store_true", help="Lister les cibles disponibles")
    parser.add_argument("--target", type=str, help="Clé du fournisseur cible (ex: lou-tec, groupe-choquette)")
    parser.add_argument("--send", action="store_true", help="Confirmer l'envoi réel")
    parser.add_argument("--test", action="store_true", help="Envoyer un courriel de test à votre propre adresse Gmail")
    args = parser.parse_args()

    load_env()

    if args.test:
        user = os.environ.get("GMAIL_USER")
        if not user:
            print("❌ GMAIL_USER manquant dans .env.outreach.")
            sys.exit(1)
        print(f"📧 Envoi d'un courriel de test à {user}...")
        test_subject = "[TEST] Validation de la connexion SMTP - LocationClôtureChantier.ca"
        test_body = """Bonjour !

Ce courriel confirme que votre connexion SMTP Gmail est parfaitement configurée pour LocationClôtureChantier.ca.

Les courriels de partenariat personnalisés pourront être envoyés directement et de manière sécurisée vers les fournisseurs sélectionnés.

L'équipe LocationClôtureChantier.ca
"""
        send_via_gmail(user, test_subject, test_body)
        print(f"✅ Courriel de test envoyé avec succès à {user} ! Vérifiez votre boîte de réception.")
        return

    if args.list:
        print("\n📋 Fournisseurs configurés pour l'outreach :")
        for k, v in PROVIDERS.items():
            print(f"  • {k:20} -> {v['name']} ({v['contact_name']} <{v['email']}>)")
        print("\nExemple pour tester :")
        print("  python3 outreach/send_outreach.py --target lou-tec --dry-run\n")
        return

    if not args.target:
        print("Précisez une cible avec --target <cle> ou --list pour voir les fournisseurs disponibles.")
        sys.exit(0)

    target_key = args.target.lower()
    if target_key not in PROVIDERS:
        print(f"❌ Fournisseur inconnu : '{target_key}'. Utilisez --list pour voir les options.")
        sys.exit(1)

    p = PROVIDERS[target_key]
    subject, body = build_email(p)

    print("\n" + "=" * 65)
    print(f" DESTINATAIRE : {p['contact_name']} <{p['email']}>")
    print(f" SUJET        : {subject}")
    print("=" * 65)
    print(body)
    print("=" * 65 + "\n")

    if args.send:
        print(f"🚀 Envoi en cours vers {p['email']}...")
        send_via_gmail(p["email"], subject, body)
        print(f"✅ Courriel envoyé avec succès à {p['name']} ({p['email']}) !")
        update_backlinks_md(target_key, p["name"])
    else:
        print("💡 Mode simulation (--dry-run). Aucun courriel n'a été envoyé.")
        print(f"Pour envoyer réellement, lancez :")
        print(f"  python3 outreach/send_outreach.py --target {target_key} --send\n")


if __name__ == "__main__":
    main()
