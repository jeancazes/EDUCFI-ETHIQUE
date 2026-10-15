// Pions et jetons pour les jeux EDUCFI critique (makers club)
// Ouvrir dans OpenSCAD, choisir PIECE puis exporter en STL (F6 puis F7).
// Imprimer en PLA : 1 couleur par famille (orange, bleu, vert, violet) ou changer de filament.
// Fichier non testé sur toutes les versions d'OpenSCAD : vérifier l'aperçu avant l'impression.

PIECE = "pion";      // "pion", "jeton_dette", "jeton_renoncement" ou "plateau_test"
LETTRE = "O";        // O, B, V, P (famille) ou M / B (ménage / banque pour le jeu Crédit)
HAUTEUR = 32;        // hauteur du pion (mm)
$fn = 60;

module pion(lettre = "O", h = 32) {
    // socle
    cylinder(d = 24, h = 3);
    // corps
    translate([0, 0, 3]) cylinder(d1 = 16, d2 = 9, h = h - 14);
    // tête
    translate([0, 0, h - 6]) sphere(d = 11);
    // lettre gravée sur le socle (dessus)
    translate([0, -8.5, 2.6])
        linear_extrude(height = 0.8) text(lettre, size = 4, halign = "center", valign = "center");
}

module jeton(libelle = "D", d = 22, h = 3) {
    difference() {
        cylinder(d = d, h = h);
        // lettre gravée en creux sur le dessus
        translate([0, 0, h - 0.8])
            linear_extrude(height = 1) text(libelle, size = 8, halign = "center", valign = "center");
    }
}

if (PIECE == "pion") pion(LETTRE, HAUTEUR);
else if (PIECE == "jeton_dette") jeton("D");
else if (PIECE == "jeton_renoncement") jeton(LETTRE);   // S, L, E, A : Santé, Loisirs, École, Alimentation
else if (PIECE == "plateau_test") { pion("O"); translate([30, 0, 0]) pion("B"); translate([60, 0, 0]) pion("V"); translate([90, 0, 0]) pion("P"); }
