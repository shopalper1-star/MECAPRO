import pandas as pd
import numpy as np
import random

random.seed(42)
np.random.seed(42)

makes_models = {
    'Toyota':['Corolla','Hilux','Yaris','Land Cruiser','RAV4'],
    'Renault':['Clio','Megane','Symbol','Kangoo','Duster'],
    'Volkswagen':['Golf','Polo','Passat','Tiguan','Caddy'],
    'Hyundai':['i10','i20','i30','Tucson','Santa Fe'],
    'Dacia':['Logan','Sandero','Duster','Dokker','Lodgy'],
    'Peugeot':['206','208','308','Partner','Expert'],
    'Ford':['Focus','Fiesta','Ranger','Transit','Kuga'],
    'Kia':['Picanto','Rio','Sportage','Cerato','Carnival'],
    'Mercedes':['C-Class','E-Class','Sprinter','Vito','A-Class'],
    'BMW':['Serie 1','Serie 3','Serie 5','X3','X5'],
    'Yamaha':['NMAX','MT-07','R3','FZ6','XT660'],
    'Honda':['CB500','PCX','Forza','CBR600','CRF'],
    'Isuzu':['N-Series','D-Max','Forward','NPR','NQR'],
    'Volvo':['FH16','FM','FMX','B8R','9700'],
}
vehicle_type_makes = {
    'car':['Toyota','Renault','Volkswagen','Hyundai','Dacia','Peugeot','Ford','Kia','Mercedes','BMW'],
    'moto':['Yamaha','Honda'],
    'truck':['Isuzu','Ford','Mercedes'],
    'bus':['Volvo','Mercedes','Isuzu'],
}
fuel_types    = ['petrol','diesel','hybrid']
transmissions = ['manual','automatic']
engine_sizes  = {
    'car':[1000,1200,1400,1600,1800,2000,2200,2500],
    'moto':[125,250,400,600,700],
    'truck':[3000,3500,4000,5000,6000],
    'bus':[5000,6000,7000,8000],
}
severity_levels  = ['low','medium','high','critical']
severity_weights = [0.2,0.35,0.3,0.15]
sev_mult = {'low':1.0,'medium':1.3,'high':1.7,'critical':2.2}

repairs = [
    {'repair_type':'Replace brake pads','probable_causes':['Worn brake pads','Brake pad degradation'],'primary_symptoms':['brake pedal vibration'],'secondary_symptoms':['suspension noise','steering wheel vibration'],'ambiguous_symptoms':['steering wheel vibration'],'base_min':600,'base_max':1100},
    {'repair_type':'Replace brake discs','probable_causes':['Warped brake disc','Disc surface wear'],'primary_symptoms':['brake pedal vibration','steering wheel vibration'],'secondary_symptoms':['suspension noise'],'ambiguous_symptoms':['brake pedal vibration'],'base_min':1200,'base_max':2000},
    {'repair_type':'Replace brake caliper','probable_causes':['Seized caliper','Caliper hydraulic leak'],'primary_symptoms':['brake pedal vibration'],'secondary_symptoms':['burning smell','oil leak under vehicle'],'ambiguous_symptoms':['burning smell'],'base_min':1000,'base_max':1800},
    {'repair_type':'Replace head gasket','probable_causes':['Blown head gasket','Overheating damage to gasket'],'primary_symptoms':['white smoke from exhaust','engine overheating'],'secondary_symptoms':['coolant leak','rough idle','loss of power'],'ambiguous_symptoms':['engine overheating','coolant leak'],'base_min':4000,'base_max':7000},
    {'repair_type':'Fix coolant leak','probable_causes':['Cracked coolant hose','Radiator pinhole leak'],'primary_symptoms':['coolant leak','engine overheating'],'secondary_symptoms':['white smoke from exhaust'],'ambiguous_symptoms':['engine overheating'],'base_min':600,'base_max':1100},
    {'repair_type':'Replace thermostat','probable_causes':['Stuck thermostat','Thermostat valve failure'],'primary_symptoms':['engine overheating'],'secondary_symptoms':['poor fuel consumption','rough idle'],'ambiguous_symptoms':['rough idle'],'base_min':450,'base_max':800},
    {'repair_type':'Replace radiator','probable_causes':['Radiator crack','Radiator corrosion'],'primary_symptoms':['engine overheating','coolant leak'],'secondary_symptoms':['white smoke from exhaust'],'ambiguous_symptoms':['coolant leak'],'base_min':1300,'base_max':2200},
    {'repair_type':'Replace battery','probable_causes':['Dead battery','Battery cell failure'],'primary_symptoms':['battery warning light','difficulty starting'],'secondary_symptoms':['check engine light'],'ambiguous_symptoms':['difficulty starting'],'base_min':600,'base_max':1000},
    {'repair_type':'Replace alternator','probable_causes':['Alternator failure','Alternator belt wear'],'primary_symptoms':['battery warning light'],'secondary_symptoms':['difficulty starting','check engine light','loss of power'],'ambiguous_symptoms':['battery warning light','difficulty starting'],'base_min':1200,'base_max':2100},
    {'repair_type':'Replace shock absorbers','probable_causes':['Worn shock absorbers','Shock absorber oil leak'],'primary_symptoms':['suspension noise'],'secondary_symptoms':['steering wheel vibration','rough idle'],'ambiguous_symptoms':['suspension noise'],'base_min':1100,'base_max':1900},
    {'repair_type':'Replace ball joint','probable_causes':['Ball joint wear','Ball joint socket failure'],'primary_symptoms':['suspension noise','steering wheel vibration'],'secondary_symptoms':['brake pedal vibration'],'ambiguous_symptoms':['suspension noise','steering wheel vibration'],'base_min':800,'base_max':1400},
    {'repair_type':'Replace AC compressor','probable_causes':['AC compressor failure','Compressor clutch wear'],'primary_symptoms':['AC not cooling'],'secondary_symptoms':['burning smell'],'ambiguous_symptoms':['AC not cooling'],'base_min':2500,'base_max':4500},
    {'repair_type':'Refill AC refrigerant','probable_causes':['Low refrigerant','AC gas leak'],'primary_symptoms':['AC not cooling'],'secondary_symptoms':[],'ambiguous_symptoms':['AC not cooling'],'base_min':300,'base_max':550},
    {'repair_type':'Replace clutch kit','probable_causes':['Worn clutch disc','Clutch pressure plate failure'],'primary_symptoms':['clutch hard to press','gear slipping'],'secondary_symptoms':['transmission jerking','burning smell'],'ambiguous_symptoms':['gear slipping','transmission jerking'],'base_min':2000,'base_max':3500},
    {'repair_type':'Repair gearbox','probable_causes':['Gearbox synchronizer failure','Gearbox bearing wear'],'primary_symptoms':['gear slipping','transmission jerking'],'secondary_symptoms':['clutch hard to press','loss of power'],'ambiguous_symptoms':['gear slipping'],'base_min':3500,'base_max':6500},
    {'repair_type':'Replace spark plugs','probable_causes':['Fouled spark plugs','Spark plug electrode wear'],'primary_symptoms':['rough idle','engine stalls at idle'],'secondary_symptoms':['poor fuel consumption','loss of power','check engine light'],'ambiguous_symptoms':['rough idle','check engine light'],'base_min':300,'base_max':600},
    {'repair_type':'Replace oxygen sensor','probable_causes':['Failed O2 sensor','O2 sensor contamination'],'primary_symptoms':['check engine light','poor fuel consumption'],'secondary_symptoms':['black smoke from exhaust','rough idle'],'ambiguous_symptoms':['check engine light','poor fuel consumption'],'base_min':600,'base_max':1100},
    {'repair_type':'Fix oil leak','probable_causes':['Valve cover gasket leak','Oil pan seal failure'],'primary_symptoms':['oil leak under vehicle'],'secondary_symptoms':['burning smell','engine knocking noise'],'ambiguous_symptoms':['burning smell'],'base_min':800,'base_max':1500},
    {'repair_type':'Replace fuel injectors','probable_causes':['Clogged fuel injector','Injector seal failure'],'primary_symptoms':['poor fuel consumption','fuel smell'],'secondary_symptoms':['rough idle','black smoke from exhaust','engine stalls at idle'],'ambiguous_symptoms':['poor fuel consumption','rough idle'],'base_min':1000,'base_max':1900},
    {'repair_type':'Replace timing belt','probable_causes':['Timing belt wear','Timing belt tensioner failure'],'primary_symptoms':['engine knocking noise','rough idle'],'secondary_symptoms':['loss of power','check engine light','black smoke from exhaust'],'ambiguous_symptoms':['engine knocking noise','rough idle'],'base_min':1300,'base_max':2300},
]

rows = []
AMBIGUITY_RATE = 0.055

for repair in repairs:
    for _ in range(1000):
        vtype   = random.choices(['car','moto','truck','bus'],weights=[0.55,0.2,0.15,0.1])[0]
        make    = random.choice(vehicle_type_makes[vtype])
        model   = random.choice(makes_models[make])
        year    = random.randint(2005,2024)
        age     = 2024 - year
        mileage = random.randint(5000,350000)
        fuel    = random.choice(fuel_types)
        trans   = random.choice(transmissions)
        eng     = random.choice(engine_sizes[vtype])
        sev     = random.choices(severity_levels,weights=severity_weights)[0]

        use_ambiguous = random.random() < AMBIGUITY_RATE and len(repair['ambiguous_symptoms']) > 0
        if use_ambiguous:
            n = random.randint(1,min(2,len(repair['ambiguous_symptoms'])))
            chosen = random.sample(repair['ambiguous_symptoms'],n)
        else:
            n = random.randint(1,min(2,len(repair['primary_symptoms'])))
            chosen = random.sample(repair['primary_symptoms'],n)

        if repair['secondary_symptoms']:
            n_sec = random.randint(0,min(2,len(repair['secondary_symptoms'])))
            chosen += random.sample(repair['secondary_symptoms'],n_sec)

        chosen = list(set(chosen))
        random.shuffle(chosen)
        probable_cause = random.choice(repair['probable_causes'])

        noise = random.uniform(0.92,1.08)
        cost_min = int(repair['base_min'] * noise * sev_mult[sev] * (1.0+age*0.012) * (1.0+mileage/600000))
        cost_max = int(repair['base_max'] * noise * sev_mult[sev] * (1.0+age*0.012) * (1.0+mileage/600000))

        rows.append({
            'vehicle_type':vtype,'make':make,'model':model,'year':year,
            'vehicle_age_years':age,'mileage':mileage,'fuel_type':fuel,
            'transmission':trans,'engine_size_cc':eng,'severity_level':sev,
            'symptoms':', '.join(chosen),'symptom_count':len(chosen),
            'probable_cause':probable_cause,'repair_type':repair['repair_type'],
            'estimated_cost_min_mad':cost_min,'estimated_cost_max_mad':cost_max,
        })

random.shuffle(rows)
df = pd.DataFrame(rows)

print(f"Rows: {len(df)} | Nulls: {df.isnull().sum().sum()} | Repairs: {df['repair_type'].nunique()}")
df['ratio'] = df['estimated_cost_max_mad'] / df['estimated_cost_min_mad']
print(f"Cost ratio: mean={df['ratio'].mean():.2f} std={df['ratio'].std():.2f} max={df['ratio'].max():.2f}")
print(f"Cost min std (avg across repairs): {df.groupby('repair_type')['estimated_cost_min_mad'].std().mean():.0f} MAD")

df.drop(columns=['ratio']).to_csv('data/finaldataset.csv', index=False)
print("Saved to data/finaldataset.csv")
print("Now run: python train.py")