<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PartsTableSeeder extends Seeder
{
    public function run()
    {
        $parts = [
            // --- ENGINE ZONE (MOTEUR) ---
            ['id' => 1, 'name' => 'Bloc moteur', 'zone' => 'engine', 'category' => 'Pièces principales', 'cost' => 7800.00, 'price' => 12000.00], 
            ['id' => 2, 'name' => 'Culasse', 'zone' => 'engine', 'category' => 'Pièces principales', 'cost' => 2925.00, 'price' => 4500.00],
            ['id' => 3, 'name' => 'Joint de culasse', 'zone' => 'engine', 'category' => 'Pièces principales', 'cost' => 227.50, 'price' => 350.00], 
            ['id' => 4, 'name' => 'Pistons', 'zone' => 'engine', 'category' => 'Pièces principales', 'cost' => 1170.00, 'price' => 1800.00], 
            ['id' => 5, 'name' => 'Segments de piston', 'zone' => 'engine', 'category' => 'Pièces principales', 'cost' => 390.00, 'price' => 600.00],
            ['id' => 6, 'name' => 'Bielles', 'zone' => 'engine', 'category' => 'Pièces principales', 'cost' => 520.00, 'price' => 800.00],
            ['id' => 7, 'name' => 'Vilebrequin', 'zone' => 'engine', 'category' => 'Pièces principales', 'cost' => 2600.00, 'price' => 4000.00],
            ['id' => 8, 'name' => 'Arbre à cames', 'zone' => 'engine', 'category' => 'Pièces principales', 'cost' => 1170.00, 'price' => 1800.00],
            ['id' => 9, 'name' => 'Soupapes (admission / échappement)', 'zone' => 'engine', 'category' => 'Pièces principales', 'cost' => 78.00, 'price' => 120.00],
            ['id' => 10, 'name' => 'Ressorts de soupapes', 'zone' => 'engine', 'category' => 'Pièces principales', 'cost' => 39.00, 'price' => 60.00],
            ['id' => 11, 'name' => 'Injecteurs', 'zone' => 'engine', 'category' => 'Système d’alimentation', 'cost' => 910.00, 'price' => 1400.00], 
            ['id' => 12, 'name' => 'Pompe à carburant', 'zone' => 'engine', 'category' => 'Système d’alimentation', 'cost' => 552.50, 'price' => 850.00],
            ['id' => 13, 'name' => 'Filtre à carburant', 'zone' => 'engine', 'category' => 'Système d’alimentation', 'cost' => 97.50, 'price' => 150.00],
            ['id' => 14, 'name' => 'Rampe d’injection', 'zone' => 'engine', 'category' => 'Système d’alimentation', 'cost' => 780.00, 'price' => 1200.00],
            ['id' => 15, 'name' => 'Corps papillon', 'zone' => 'engine', 'category' => 'Système d’alimentation', 'cost' => 1040.00, 'price' => 1600.00],
            ['id' => 16, 'name' => 'Bougies d’allumage', 'zone' => 'engine', 'category' => 'Allumage', 'cost' => 39.00, 'price' => 60.00], 
            ['id' => 17, 'name' => 'Bobines d’allumage', 'zone' => 'engine', 'category' => 'Allumage', 'cost' => 260.00, 'price' => 400.00],
            ['id' => 18, 'name' => 'Faisceau d’allumage', 'zone' => 'engine', 'category' => 'Allumage', 'cost' => 227.50, 'price' => 350.00],
            ['id' => 19, 'name' => 'Capteur PMH (vilebrequin)', 'zone' => 'engine', 'category' => 'Allumage', 'cost' => 162.50, 'price' => 250.00],
            ['id' => 20, 'name' => 'Pompe à huile', 'zone' => 'engine', 'category' => 'Lubrification', 'cost' => 585.00, 'price' => 900.00],
            ['id' => 21, 'name' => 'Filtre à huile', 'zone' => 'engine', 'category' => 'Lubrification', 'cost' => 45.50, 'price' => 70.00],
            ['id' => 22, 'name' => 'Carter d’huile', 'zone' => 'engine', 'category' => 'Lubrification', 'cost' => 520.00, 'price' => 800.00],
            ['id' => 23, 'name' => 'Joint de carter', 'zone' => 'engine', 'category' => 'Lubrification', 'cost' => 78.00, 'price' => 120.00],
            ['id' => 24, 'name' => 'Sonde de pression d’huile', 'zone' => 'engine', 'category' => 'Lubrification', 'cost' => 97.50, 'price' => 150.00],
            ['id' => 26, 'name' => 'Radiateur', 'zone' => 'engine', 'category' => 'Refroidissement', 'cost' => 910.00, 'price' => 1400.00],
            ['id' => 27, 'name' => 'Ventilateur moteur', 'zone' => 'engine', 'category' => 'Refroidissement', 'cost' => 585.00, 'price' => 900.00],
            ['id' => 28, 'name' => 'Thermostat (calorstat)', 'zone' => 'engine', 'category' => 'Refroidissement', 'cost' => 117.00, 'price' => 180.00],
            ['id' => 29, 'name' => 'Pompe à eau', 'zone' => 'engine', 'category' => 'Refroidissement', 'cost' => 292.50, 'price' => 450.00],
            ['id' => 30, 'name' => 'Durites de refroidissement', 'zone' => 'engine', 'category' => 'Refroidissement', 'cost' => 97.50, 'price' => 150.00],
            ['id' => 31, 'name' => 'Vase d’expansion', 'zone' => 'engine', 'category' => 'Refroidissement', 'cost' => 162.50, 'price' => 250.00],
            ['id' => 32, 'name' => 'Courroie de distribution', 'zone' => 'engine', 'category' => 'Distribution', 'cost' => 227.50, 'price' => 350.00],
            ['id' => 33, 'name' => 'Chaîne de distribution', 'zone' => 'engine', 'category' => 'Distribution', 'cost' => 715.00, 'price' => 1100.00],
            ['id' => 34, 'name' => 'Galet tendeur', 'zone' => 'engine', 'category' => 'Distribution', 'cost' => 182.00, 'price' => 280.00],
            ['id' => 35, 'name' => 'Poulie vilebrequin', 'zone' => 'engine', 'category' => 'Distribution', 'cost' => 390.00, 'price' => 600.00],
            
            // --- WHEELS ZONE (ROUES) ---
            ['id' => 36, 'name' => 'Pneus', 'zone' => 'wheels', 'category' => 'Roues', 'cost' => 487.50, 'price' => 750.00], 
            ['id' => 37, 'name' => 'Jantes', 'zone' => 'wheels', 'category' => 'Roues', 'cost' => 780.00, 'price' => 1200.00], 
            ['id' => 38, 'name' => 'Enjoliveurs', 'zone' => 'wheels', 'category' => 'Roues', 'cost' => 52.00, 'price' => 80.00],
            ['id' => 39, 'name' => 'Boulons / écrous de roue', 'zone' => 'wheels', 'category' => 'Roues', 'cost' => 13.00, 'price' => 20.00],
            ['id' => 40, 'name' => 'Valves de pneus', 'zone' => 'wheels', 'category' => 'Roues', 'cost' => 9.75, 'price' => 15.00],
            ['id' => 41, 'name' => 'Disques de frein', 'zone' => 'wheels', 'category' => 'Freinage', 'cost' => 390.00, 'price' => 600.00], 
            ['id' => 42, 'name' => 'Plaquettes de frein', 'zone' => 'wheels', 'category' => 'Freinage', 'cost' => 227.50, 'price' => 350.00], 
            ['id' => 43, 'name' => 'Étriers de frein', 'zone' => 'wheels', 'category' => 'Freinage', 'cost' => 585.00, 'price' => 900.00],
            ['id' => 44, 'name' => 'Flexibles de frein', 'zone' => 'wheels', 'category' => 'Freinage', 'cost' => 78.00, 'price' => 120.00],
            ['id' => 45, 'name' => 'Maître-cylindre', 'zone' => 'wheels', 'category' => 'Freinage', 'cost' => 487.50, 'price' => 750.00],
            ['id' => 46, 'name' => 'Tambours de frein (arrière)', 'zone' => 'wheels', 'category' => 'Freinage', 'cost' => 292.50, 'price' => 450.00],
            ['id' => 47, 'name' => 'Amortisseurs', 'zone' => 'wheels', 'category' => 'Suspension & direction', 'cost' => 422.50, 'price' => 650.00], 
            ['id' => 48, 'name' => 'Ressorts', 'zone' => 'wheels', 'category' => 'Suspension & direction', 'cost' => 195.00, 'price' => 300.00],
            ['id' => 49, 'name' => 'Bras de suspension', 'zone' => 'wheels', 'category' => 'Suspension & direction', 'cost' => 357.50, 'price' => 550.00],
            ['id' => 50, 'name' => 'Rotules', 'zone' => 'wheels', 'category' => 'Suspension & direction', 'cost' => 117.00, 'price' => 180.00],
            ['id' => 51, 'name' => 'Silentblocs', 'zone' => 'wheels', 'category' => 'Suspension & direction', 'cost' => 52.00, 'price' => 80.00],
            ['id' => 52, 'name' => 'Barre stabilisatrice', 'zone' => 'wheels', 'category' => 'Suspension & direction', 'cost' => 325.00, 'price' => 500.00],
            ['id' => 53, 'name' => 'Biellette de direction', 'zone' => 'wheels', 'category' => 'Suspension & direction', 'cost' => 130.00, 'price' => 200.00],
            ['id' => 54, 'name' => 'Crémaillère de direction', 'zone' => 'wheels', 'category' => 'Suspension & direction', 'cost' => 1430.00, 'price' => 2200.00],

            // --- EXHAUST ZONE (ECHAPPEMENT) ---
            ['id' => 55, 'name' => 'Collecteur d’échappement', 'zone' => 'exhaust', 'category' => 'Échappement', 'cost' => 650.00, 'price' => 1000.00],
            ['id' => 56, 'name' => 'Joint de collecteur', 'zone' => 'exhaust', 'category' => 'Échappement', 'cost' => 52.00, 'price' => 80.00],
            ['id' => 57, 'name' => 'Catalyseur', 'zone' => 'exhaust', 'category' => 'Échappement', 'cost' => 2080.00, 'price' => 3200.00],
            ['id' => 58, 'name' => 'Filtre à particules (FAP)', 'zone' => 'exhaust', 'category' => 'Échappement', 'cost' => 2470.00, 'price' => 3800.00],
            ['id' => 59, 'name' => 'Sonde lambda', 'zone' => 'exhaust', 'category' => 'Échappement', 'cost' => 357.50, 'price' => 550.00],
            ['id' => 60, 'name' => 'Silencieux', 'zone' => 'exhaust', 'category' => 'Échappement', 'cost' => 455.00, 'price' => 700.00],
            ['id' => 61, 'name' => 'Ligne d’échappement', 'zone' => 'exhaust', 'category' => 'Échappement', 'cost' => 780.00, 'price' => 1200.00],
            ['id' => 62, 'name' => 'Colliers d’échappement', 'zone' => 'exhaust', 'category' => 'Échappement', 'cost' => 19.50, 'price' => 30.00],
            ['id' => 63, 'name' => 'Supports en caoutchouc', 'zone' => 'exhaust', 'category' => 'Échappement', 'cost' => 16.25, 'price' => 25.00],
            
            // --- LIGHTS ZONE (ECLAIRAGE) ---
            ['id' => 64, 'name' => 'Phares avant', 'zone' => 'lights', 'category' => 'Éclairage avant', 'cost' => 910.00, 'price' => 1400.00],
            ['id' => 65, 'name' => 'Ampoules', 'zone' => 'lights', 'category' => 'Éclairage avant', 'cost' => 26.00, 'price' => 40.00],
            ['id' => 66, 'name' => 'Clignotants avant', 'zone' => 'lights', 'category' => 'Éclairage avant', 'cost' => 97.50, 'price' => 150.00],
            ['id' => 67, 'name' => 'Feux de position', 'zone' => 'lights', 'category' => 'Éclairage avant', 'cost' => 65.00, 'price' => 100.00],
            ['id' => 68, 'name' => 'Feux arrière', 'zone' => 'lights', 'category' => 'Éclairage arrière', 'cost' => 585.00, 'price' => 900.00],
            ['id' => 69, 'name' => 'Feux stop', 'zone' => 'lights', 'category' => 'Éclairage arrière', 'cost' => 26.00, 'price' => 40.00],
            ['id' => 70, 'name' => 'Feux de recul', 'zone' => 'lights', 'category' => 'Éclairage arrière', 'cost' => 26.00, 'price' => 40.00],
            ['id' => 71, 'name' => 'Clignotants arrière', 'zone' => 'lights', 'category' => 'Éclairage arrière', 'cost' => 65.00, 'price' => 100.00],
            ['id' => 72, 'name' => 'Feux antibrouillard', 'zone' => 'lights', 'category' => 'Autres', 'cost' => 195.00, 'price' => 300.00],
            ['id' => 73, 'name' => 'Feu de plaque', 'zone' => 'lights', 'category' => 'Autres', 'cost' => 39.00, 'price' => 60.00],
            ['id' => 74, 'name' => 'Fusibles', 'zone' => 'lights', 'category' => 'Autres', 'cost' => 3.25, 'price' => 5.00],
            ['id' => 75, 'name' => 'Relais', 'zone' => 'lights', 'category' => 'Autres', 'cost' => 32.50, 'price' => 50.00],
            ['id' => 76, 'name' => 'Commodo d’éclairage', 'zone' => 'lights', 'category' => 'Autres', 'cost' => 292.50, 'price' => 450.00],
            
            // --- BODY ZONE (CARROSSERIE) ---
            ['id' => 77, 'name' => 'Pare-chocs', 'zone' => 'body', 'category' => 'Parties extérieures', 'cost' => 975.00, 'price' => 1500.00], 
            ['id' => 78, 'name' => 'Capot', 'zone' => 'body', 'category' => 'Parties extérieures', 'cost' => 1430.00, 'price' => 2200.00],
            ['id' => 79, 'name' => 'Ailes', 'zone' => 'body', 'category' => 'Parties extérieures', 'cost' => 520.00, 'price' => 800.00],
            ['id' => 80, 'name' => 'Portes', 'zone' => 'body', 'category' => 'Parties extérieures', 'cost' => 1950.00, 'price' => 3000.00],
            ['id' => 81, 'name' => 'Coffre / hayon', 'zone' => 'body', 'category' => 'Parties extérieures', 'cost' => 1820.00, 'price' => 2800.00],
            ['id' => 82, 'name' => 'Rétroviseurs', 'zone' => 'body', 'category' => 'Parties extérieures', 'cost' => 390.00, 'price' => 600.00],
            ['id' => 83, 'name' => 'Calandre', 'zone' => 'body', 'category' => 'Parties extérieures', 'cost' => 455.00, 'price' => 700.00],
            ['id' => 84, 'name' => 'Pare-brise', 'zone' => 'body', 'category' => 'Vitres & joints', 'cost' => 845.00, 'price' => 1300.00],
            ['id' => 85, 'name' => 'Vitres latérales', 'zone' => 'body', 'category' => 'Vitres & joints', 'cost' => 325.00, 'price' => 500.00],
            ['id' => 86, 'name' => 'Lunette arrière', 'zone' => 'body', 'category' => 'Vitres & joints', 'cost' => 650.00, 'price' => 1000.00],
            ['id' => 87, 'name' => 'Joints de portes', 'zone' => 'body', 'category' => 'Vitres & joints', 'cost' => 162.50, 'price' => 250.00],
            ['id' => 88, 'name' => 'Lève-vitres', 'zone' => 'body', 'category' => 'Vitres & joints', 'cost' => 325.00, 'price' => 500.00],
            ['id' => 89, 'name' => 'Agrafes', 'zone' => 'body', 'category' => 'Fixations & accessoires', 'cost' => 1.30, 'price' => 2.00],
            ['id' => 90, 'name' => 'Clips', 'zone' => 'body', 'category' => 'Fixations & accessoires', 'cost' => 1.30, 'price' => 2.00],
            ['id' => 91, 'name' => 'Vis carrosserie', 'zone' => 'body', 'category' => 'Fixations & accessoires', 'cost' => 1.95, 'price' => 3.00],
            ['id' => 92, 'name' => 'Supports', 'zone' => 'body', 'category' => 'Fixations & accessoires', 'cost' => 26.00, 'price' => 40.00],
            ['id' => 93, 'name' => 'Garnitures intérieures', 'zone' => 'body', 'category' => 'Fixations & accessoires', 'cost' => 260.00, 'price' => 400.00],
            ['id' => 94, 'name' => 'Carburateur (anciens véhicules)', 'zone' => 'engine', 'category' => 'Système d’alimentation', 'cost' => 1170.00, 'price' => 1800.00],
        ];

        // Insert using Upsert (avoids errors if ID exists)
        // We add timestamps and stock to every row
        foreach ($parts as &$part) {
            $part['created_at'] = now();
            $part['updated_at'] = now();
            $part['stock_quantity'] = 50; // Set default stock
        }

        DB::table('parts')->upsert($parts, ['id'], ['name', 'zone', 'category', 'cost', 'price', 'stock_quantity']);
    }
}