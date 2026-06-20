// Star catalog: brightest ~200 stars visible to naked eye
// Format: [HIP, RA_hours, Dec_deg, Vmag, BayerName, IAUconst, Spectral, DistLy]
export const stars = [
  // Sirius
  [32349, 6.752, -16.716, -1.46, 'α CMa', 'CMa', 'A1V', 8.6],
  // Canopus
  [30438, 6.400, -52.696, -0.74, 'α Car', 'Car', 'F0II', 310],
  // Arcturus
  [69673, 14.258, 19.182, -0.05, 'α Boo', 'Boo', 'K1.5IIIFe-0.5', 36.7],
  // Alpha Centauri A
  [71683, 14.660, -60.833, -0.01, 'α Cen A', 'Cen', 'G2V', 4.37],
  // Vega
  [91262, 18.614, 38.784, 0.03, 'α Lyr', 'Lyr', 'A0V', 25.0],
  // Capella
  [24608, 5.277, 45.998, 0.08, 'α Aur', 'Aur', 'G3III', 42.2],
  // Rigel
  [24436, 5.242, -8.202, 0.13, 'β Ori', 'Ori', 'B8Iae', 860],
  // Procyon
  [37279, 7.655, 5.224, 0.34, 'α CMi', 'CMi', 'F5IV-V', 11.4],
  // Achernar
  [7588, 1.626, -57.237, 0.46, 'α Eri', 'Eri', 'B6Vep', 139],
  // Betelgeuse
  [27989, 5.920, 7.407, 0.50, 'α Ori', 'Ori', 'M1-M2Ia-Iab', 640],
  // Hadar
  [68702, 14.068, -60.367, 0.60, 'β Cen', 'Cen', 'B1III', 390],
  // Altair
  [97649, 19.851, 8.868, 0.76, 'α Aql', 'Aql', 'A7V', 16.7],
  // Aldebaran
  [21421, 4.600, 16.509, 0.86, 'α Tau', 'Tau', 'K5III', 65.3],
  // Antares
  [80763, 16.484, -26.431, 0.96, 'α Sco', 'Sco', 'M1.5Iab-b', 550],
  // Spica
  [65474, 13.417, -11.162, 0.97, 'α Vir', 'Vir', 'B1II-I', 260],
  // Pollux
  [37826, 7.764, 28.027, 1.14, 'β Gem', 'Gem', 'K0III', 33.8],
  // Fomalhaut
  [113368, 22.958, -29.622, 1.16, 'α PsA', 'PsA', 'A3V', 25.1],
  // Deneb
  [102098, 20.693, 45.280, 1.25, 'α Cyg', 'Cyg', 'A2Ia', 2600],
  // Regulus
  [49669, 10.140, 11.967, 1.36, 'α Leo', 'Leo', 'B7V', 79.3],
  // Adhara
  [33579, 6.983, -28.977, 1.50, 'ε CMa', 'CMa', 'B2II', 430],
  // Castor
  [36850, 7.570, 31.887, 1.57, 'α Gem', 'Gem', 'A1V', 51],
  // Gacrux
  [60718, 12.433, -57.016, 1.64, 'γ Cru', 'Cru', 'M3.5III', 88],
  // Bellatrix
  [25336, 5.417, 6.349, 1.64, 'γ Ori', 'Ori', 'B2III', 250],
  // Elnath
  [25428, 5.433, 28.600, 1.65, 'β Tau', 'Tau', 'B7III', 130],
  // Miaplacidus
  [45238, 9.217, -69.717, 1.67, 'β Car', 'Car', 'A1III', 110],
  // Alnilam
  [26311, 5.600, -1.202, 1.70, 'ε Ori', 'Ori', 'B0Iae', 2000],
  // Alnitak
  [26727, 5.683, -1.945, 1.74, 'ζ Ori', 'Ori', 'O9Ib', 1300],
  // Alioth
  [62956, 12.900, 55.958, 1.77, 'ε UMa', 'UMa', 'A1III-IV', 81],
  // Mirfak
  [15863, 3.408, 49.861, 1.79, 'α Per', 'Per', 'F5Ib', 590],
  // Dubhe
  [54061, 11.058, 61.750, 1.79, 'α UMa', 'UMa', 'K0III', 124],
  // Wezen
  [34444, 7.133, -26.388, 1.83, 'δ CMa', 'CMa', 'F8Ia', 1800],
  // Alkaid
  [67301, 13.783, 49.306, 1.86, 'η UMa', 'UMa', 'B3V', 101],
  // Sargas
  [86228, 17.610, -42.998, 1.86, 'θ Sco', 'Sco', 'F1II', 270],
  // Avior
  [54407, 11.133, -58.750, 1.86, 'ε Car', 'Car', 'K3III', 630],
  // Menkalinan
  [28360, 5.992, 44.948, 1.90, 'β Aur', 'Aur', 'A1IV-V', 82],
  // Kochab
  [72607, 14.850, 74.133, 2.07, 'β UMi', 'UMi', 'K4III', 131],
  // Phecda
  [58001, 11.900, 53.783, 2.08, 'γ UMa', 'UMa', 'A0Ve', 84],
  // Merak
  [53910, 11.033, 56.383, 2.08, 'β UMa', 'UMa', 'A1V', 80],
  // Alpheratz
  [677, 0.141, 29.090, 2.07, 'α And', 'And', 'B8IV-VHgMn', 97],
  // Mirach
  [5447, 1.162, 35.620, 2.07, 'β And', 'And', 'M0+III', 200],
  // Saiph
  [27366, 5.800, -9.669, 2.06, 'κ Ori', 'Ori', 'B0.5Iavar', 720],
  // Rasalhague
  [86032, 17.575, 12.561, 2.08, 'α Oph', 'Oph', 'A5III', 46.8],
  // Denebola
  [57632, 11.818, 14.567, 2.14, 'β Leo', 'Leo', 'A3V', 36.2],
  // Almach
  [9640, 2.067, 42.329, 2.15, 'γ And', 'And', 'B9IV', 350],
  // Polaris
  [11767, 2.530, 89.264, 2.02, 'α UMi', 'UMi', 'F7Ib', 430],
  // Shaula
  [85927, 17.559, -37.103, 1.63, 'λ Sco', 'Sco', 'B1.5IV+', 700],
  // Kaus Australis
  [90185, 18.400, -34.391, 1.85, 'ε Sgr', 'Sgr', 'B9.5III', 145],
  // Nunki
  [92855, 18.924, -26.297, 2.06, 'σ Sgr', 'Sgr', 'B3V', 228],
  // Markab
  [113963, 23.083, 15.205, 2.49, 'α Peg', 'Peg', 'B9III', 133],
  // Scheat
  [113881, 23.067, 28.083, 2.42, 'β Peg', 'Peg', 'M2+II-III', 200],
  // Algenib
  [1067, 0.222, 15.184, 2.84, 'γ Peg', 'Peg', 'B2IV', 390],
  // Enif
  [107315, 21.733, 9.875, 2.38, 'ε Peg', 'Peg', 'K2Ib-II', 670],
  // Hamal
  [9884, 2.117, 23.463, 2.01, 'α Ari', 'Ari', 'K2III', 65.8],
  // Algol
  [14576, 3.134, 40.956, 2.09, 'β Per', 'Per', 'B8V', 93],
  // Menkar
  [14135, 3.033, 4.089, 2.53, 'α Cet', 'Cet', 'M1.5III', 220],
  // Zubenelgenubi
  [74785, 15.283, -9.382, 2.75, 'α Lib', 'Lib', 'A3IV', 77],
  // Zubeneschamali
  [76333, 15.583, -9.595, 2.83, 'β Lib', 'Lib', 'B8V', 160],
  // Unukalhai
  [77070, 15.733, 6.417, 2.65, 'α Ser', 'Ser', 'K2III', 74],
  // Cebalrai
  [79593, 16.233, 4.251, 2.76, 'β Oph', 'Oph', 'K2III', 82],
  // Kornephoros
  [80816, 16.500, 21.478, 2.47, 'β Her', 'Her', 'G8III', 148],
  // Ras Algethi
  [84345, 17.233, 14.389, 3.48, 'α Her', 'Her', 'M5Ib-II', 380],
  // Etamin
  [87833, 17.933, 51.479, 2.24, 'γ Dra', 'Dra', 'K5III', 148],
  // Albireo
  [95947, 19.517, 27.959, 3.19, 'β Cyg', 'Cyg', 'K3II', 390],
  // Sadr
  [100453, 20.383, 40.257, 2.23, 'γ Cyg', 'Cyg', 'F8Iab', 1500],
  // Gienah
  [102488, 20.767, 47.312, 2.46, 'ε Cyg', 'Cyg', 'K0III', 72],
  // Rukbat
  [92041, 18.758, -21.670, 4.06, 'α Sgr', 'Sgr', 'B8V', 170],
  // Arneb
  [23015, 4.950, -17.822, 2.58, 'α Lep', 'Lep', 'F0Ib', 1300],
  // Nihal
  [22496, 4.850, -16.148, 2.84, 'β Lep', 'Lep', 'G5II', 160],
  // Markeb
  [39953, 8.166, -47.552, 2.69, 'κ Vel', 'Vel', 'B2IV-V', 540],
  // Suhail
  [44816, 9.133, -43.433, 2.23, 'λ Vel', 'Vel', 'K4Ib-II', 570],
  // Regor
  [45941, 9.370, -47.329, 1.78, 'γ Vel', 'Vel', 'WC8+O7IIIf', 1100],
  // Peacock
  [100751, 20.450, -56.736, 1.94, 'α Pav', 'Pav', 'B2IV', 180],
  // Al Na'ir
  [109268, 22.133, -46.880, 1.74, 'α Gru', 'Gru', 'B7IV', 100],
  // Ankaa
  [2081, 0.439, -42.304, 2.37, 'α Phe', 'Phe', 'K0III', 85],
  // Diphda
  [3419, 0.726, -17.987, 2.04, 'β Cet', 'Cet', 'K1III', 96],
  // Acamar
  [13847, 2.973, -40.304, 3.00, 'θ Eri', 'Eri', 'A3III', 160],
  // Zaurak
  [18543, 3.967, -0.300, 2.96, 'γ Eri', 'Eri', 'M1IIIb', 220],
  // Rana
  [29528, 6.233, -6.512, 3.55, 'δ Eri', 'Eri', 'K0III-IV', 29.5],
  // Cursa
  [23875, 5.133, -5.083, 2.78, 'β Eri', 'Eri', 'A3III', 89],
  // Etamin above, skip
  // Alkaid above
  // Thuban
  [68756, 14.083, 64.375, 3.65, 'α Dra', 'Dra', 'A0III', 300],
  // Eltanin (same as Etamin) γ Dra
  // Rastaban
  [85670, 17.500, 52.302, 2.79, 'β Dra', 'Dra', 'G2Ib-IIa', 380],
  // Vega above
  // Altair above
  // Tarazed
  [98036, 19.917, 10.583, 2.72, 'γ Aql', 'Aql', 'K3II', 460],
  // Alshain
  [97278, 19.767, 1.000, 3.71, 'β Aql', 'Aql', 'G8IV', 44.7],
  // Asterope
  [25606, 5.467, 21.255, 5.28, '21 Tau', 'Tau', 'B8V', 440],
  // Atlas
  [25499, 5.450, 24.074, 3.63, '27 Tau', 'Tau', 'B8III', 380],
  // Electra
  [25930, 5.533, 24.117, 3.72, '17 Tau', 'Tau', 'B6III', 400],
  // Maia
  [26038, 5.550, 24.050, 3.87, '20 Tau', 'Tau', 'B8III', 360],
  // Merope
  [26089, 5.567, 23.950, 4.17, '23 Tau', 'Tau', 'B6IVe', 390],
  // Taygeta
  [25861, 5.517, 24.584, 4.30, '19 Tau', 'Tau', 'B6V', 370],
  // Pleione
  [26207, 5.583, 24.155, 5.05, '28 Tau', 'Tau', 'B8IVep', 390],
  // Alcyone
  [25930, 5.534, 24.117, 2.87, 'η Tau', 'Tau', 'B7III', 370],
  // Celaeno
  [25813, 5.517, 24.270, 5.46, '16 Tau', 'Tau', 'B7IV', 340],
  // Errai
  [7513, 1.608, 63.669, 3.22, 'γ Cep', 'Cep', 'K1IV', 45],
  // Alfirk
  [82363, 16.828, 70.534, 3.23, 'β Cep', 'Cep', 'B1IV', 690],
  // Alderamin
  [105159, 21.317, 62.585, 2.45, 'α Cep', 'Cep', 'A7IV-V', 49],
  // Schedar
  [3179, 0.675, 56.536, 2.24, 'α Cas', 'Cas', 'K0IIIa', 230],
  // Caph
  [746, 0.155, 59.150, 2.28, 'β Cas', 'Cas', 'F2III-IV', 55],
  // Navi (γ Cas)
  [4427, 0.944, 60.717, 2.47, 'γ Cas', 'Cas', 'B0.5IVpe', 610],
  // Ruchbah
  [6686, 1.429, 60.236, 2.68, 'δ Cas', 'Cas', 'A5IV', 100],
  // Segin
  [10144, 2.175, 63.160, 3.35, 'ε Cas', 'Cas', 'B3III', 440],
  // Achird
  [3809, 0.813, 57.841, 3.45, 'η Cas', 'Cas', 'G0V', 19],
  // Marfark
  [100345, 20.350, 57.048, 3.63, 'κ Cep', 'Cep', 'B9III', 330],
  // Zosma
  [54872, 11.233, 20.538, 2.56, 'δ Leo', 'Leo', 'A4IV', 58],
  // Chertan
  [55642, 11.392, 15.422, 3.33, 'θ Leo', 'Leo', 'A2V', 170],
  // Algieba
  [50583, 10.333, 19.830, 2.47, 'γ Leo', 'Leo', 'K1-IIIbFe-0.5', 130],
  // Adhafera
  [50335, 10.300, 16.615, 3.43, 'ζ Leo', 'Leo', 'F0III', 260],
  // Rasalas
  [48402, 9.867, 24.555, 3.53, 'μ Leo', 'Leo', 'K2III', 130],
  // Eta Cen
  [54462, 11.142, -42.040, 2.33, 'η Cen', 'Cen', 'B1.5VNe', 310],
  // Theta Cen
  [66657, 13.658, -49.750, 2.06, 'θ Cen', 'Cen', 'K0III', 61],
  // Iota Cen
  [61561, 12.617, -50.206, 2.75, 'ι Cen', 'Cen', 'A2V', 59],
  // Gamma Cen
  [61935, 12.700, -48.940, 2.20, 'γ Cen', 'Cen', 'A1IV', 130],
  // Epsilon Cen
  [68737, 14.075, -53.308, 2.29, 'ε Cen', 'Cen', 'B1III', 380],
  // Zeta Cen
  [68933, 14.108, -47.342, 2.55, 'ζ Cen', 'Cen', 'B2.5IV', 380],
  // Atria
  [82273, 16.812, -69.029, 1.92, 'α TrA', 'TrA', 'K2II', 390],
  // Betria
  [79664, 16.258, -65.000, 2.87, 'β TrA', 'TrA', 'F2III', 40],
  // Girtria
  [82263, 16.808, -69.029, 2.87, 'γ TrA', 'TrA', 'A1V', 180],
  // Menkent
  [61932, 12.692, -36.446, 2.06, 'θ Cen', 'Cen', 'K0IIIb', 61],
  // Agena (Hadar already above)
  // Bungula (α Cen A + B)
  // Canopus above
  // Sirius above
  // Procyon above
  // Alphard
  [46390, 9.458, -8.667, 1.99, 'α Hya', 'Hya', 'K3III', 180],
  // Regulus above
  // Cor Caroli
  [63125, 12.933, 38.317, 2.90, 'α CVn', 'CVn', 'A0III', 110],
  // Vindemiatrix
  [58001, 11.900, 53.783, 2.56, 'ε Vir', 'Vir', 'A2V', 110],
  // Porrima
  [66249, 13.575, -1.614, 3.30, 'γ Vir', 'Vir', 'F0V+F0V', 39],
  // Auva
  [66803, 13.694, -0.397, 3.31, 'δ Vir', 'Vir', 'M3III', 200],
  // Zaniah
  [66257, 13.579, -2.666, 3.71, 'η Vir', 'Vir', 'A2IV', 250],
  // Syrma
  [68520, 14.033, -2.542, 3.58, 'ι Vir', 'Vir', 'F6III', 70],
  // Spica above
  // Acrux (α Cru)
  [60718, 12.433, -57.016, 1.33, 'α Cru', 'Cru', 'B0.5IV+B1V', 320],
  // Becrux (β Cru) - Mimosa
  [62434, 12.800, -59.689, 1.25, 'β Cru', 'Cru', 'B0.5III', 350],
  // Decrux (δ Cru)
  [59747, 12.250, -58.750, 2.79, 'δ Cru', 'Cru', 'B2IV', 360],
  // Miaplacidus above
  // Aspidiske
  [49424, 10.092, -58.201, 3.95, 'ι Car', 'Car', 'F0IV', 200],
  // Turais
  [51437, 10.508, -61.688, 2.25, 'ι Car', 'Car', 'F0IV', 160],
  // Naos
  [31681, 6.625, -40.304, 2.25, 'ζ Pup', 'Pup', 'O4If(n)p', 1100],
  // Tureis
  [35904, 7.400, -29.598, 2.79, 'ρ Pup', 'Pup', 'F2II', 230],
  // Nunki above
  // Ascella
  [89826, 18.333, -20.229, 2.61, 'ζ Sgr', 'Sgr', 'A2III', 88],
  // Kaus Borealis
  [88127, 18.000, -26.743, 2.70, 'λ Sgr', 'Sgr', 'K1III', 78],
  // Albaldah
  [90344, 18.433, -22.000, 3.16, 'π Sgr', 'Sgr', 'F2II', 440],
  // Alnasl
  [89341, 18.233, -28.983, 2.98, 'γ Sgr', 'Sgr', 'K0III', 100],
  // Dabih
  [89931, 18.350, -27.115, 3.05, 'β Sgr', 'Sgr', 'K0II+B8V', 380],
  // Arkab
  [91041, 18.567, -28.929, 4.06, 'α Sgr', 'Sgr', 'B8V', 170],
  // Omicron Sgr
  [91527, 18.667, -25.536, 4.13, 'ο Sgr', 'Sgr', 'K0III', 190],
  // φ Sgr
  [93654, 19.067, -25.505, 3.17, 'φ Sgr', 'Sgr', 'B8III', 330],
  // η Sgr
  [89642, 18.292, -30.167, 3.50, 'η Sgr', 'Sgr', 'M2III', 150],
  // τ Sgr
  [90193, 18.400, -27.113, 3.32, 'τ Sgr', 'Sgr', 'F2II', 120],
  // Pherkab above
  // Yildun
  [103111, 20.917, 86.517, 4.36, 'δ UMi', 'UMi', 'A1V', 180],
  // Zeta UMi
  [31286, 6.567, 85.917, 4.29, 'ζ UMi', 'UMi', 'A3V', 340],
  // Eta UMi
  [51056, 10.433, 75.833, 4.25, 'η UMi', 'UMi', 'F5V', 97],
  // Leo Minor 46
  [57380, 11.767, 34.605, 3.79, 'β LMi', 'LMi', 'G8III', 150],
  // Cor Leonis (Regulus above)
  // Alula A / B
  [56452, 11.567, 33.098, 3.50, 'ν UMa', 'UMa', 'K3III', 420],
  // Talitha
  [55847, 11.450, 31.502, 3.14, 'ι UMa', 'UMa', 'A7IV', 60],
  // Tania Borealis
  [58399, 11.967, 47.729, 3.02, 'λ UMa', 'UMa', 'A2IV', 160],
  // Tania Australis
  [59024, 12.100, 48.029, 3.24, 'μ UMa', 'UMa', 'M0III', 230],
  // Alula Borealis
  [57851, 11.867, 33.029, 3.59, 'ν UMa', 'UMa', 'K3III', 420],
  // Alula Australis
  [58001, 11.900, 53.783, 3.79, 'ξ UMa', 'UMa', 'G0Ve+G0Ve', 30],
  // Muscida
  [33288, 6.933, 48.417, 3.51, 'ο UMa', 'UMa', 'G4II-III', 180],
  // Menkib
  [16628, 3.567, 45.997, 4.50, 'ξ Per', 'Per', 'O7.5III(n)((f))', 1800],
  // Kemble's Cascade not a star
  // Mira
  [10728, 2.306, -2.978, 6.47, 'ο Cet', 'Cet', 'M7IIIe', 300],
  // Schemali
  [100751, 20.450, -56.736, 2.28, 'α Vul', 'Vul', 'M0III', 300],
  // Anser
  [103413, 20.950, 28.035, 4.49, 'α Vul', 'Vul', 'M0III', 300],
  // Beta Corvi
  [59316, 12.167, -23.723, 2.65, 'β Crv', 'Crv', 'G5II', 140],
  // Gienah Corvi
  [59803, 12.267, -17.572, 2.60, 'γ Crv', 'Crv', 'B8III', 160],
  // Algorab
  [60941, 12.483, -16.499, 2.99, 'δ Crv', 'Crv', 'A0IV', 88],
  // Kraz
  [62622, 12.833, -23.500, 2.86, 'β Crv', 'Crv', 'G5II', 140],
  // Minkar
  [61898, 12.683, -17.178, 4.44, 'ε Crv', 'Crv', 'K2III', 300],
  // Zeta Vir
  [60129, 12.350, -0.735, 3.37, 'ζ Vir', 'Vir', 'A3V', 74],
  // Deneb Algedi
  [109422, 22.167, -14.786, 2.85, 'δ Cap', 'Cap', 'A5mF2IV', 39],
  // Dabih discussed above under Sgr
  // Algedi
  [109492, 22.200, -16.983, 3.67, 'α Cap', 'Cap', 'G3III+A5IV', 160],
  // Nashira
  [109937, 22.283, -17.122, 3.67, 'γ Cap', 'Cap', 'F0III', 139],
  // Sadalmelik
  [109074, 22.083, -0.310, 2.95, 'α Aqr', 'Aqr', 'G2Ib', 520],
  // Sadalsuud
  [110003, 22.283, -0.300, 2.90, 'β Aqr', 'Aqr', 'G0Ib', 540],
  // Sadachbia
  [110960, 22.517, -3.459, 3.27, 'γ Aqr', 'Aqr', 'A0V', 164],
  // Skat
  [111497, 22.583, -15.833, 3.27, 'δ Aqr', 'Aqr', 'A3V', 113],
  // Albali
  [112247, 22.767, -8.983, 3.77, 'ε Aqr', 'Aqr', 'A1V', 145],
  // Situla
  [113136, 22.917, -5.183, 3.69, 'κ Aqr', 'Aqr', 'K1III', 190],
  // Enif above
  // Markab, Scheat, Algenib above
  // Matar
  [112748, 22.850, 28.617, 2.95, 'η Peg', 'Peg', 'G2III', 215],
  // Baham
  [112440, 22.783, 24.650, 3.77, 'θ Peg', 'Peg', 'A2V', 92],
  // Homam
  [111112, 22.517, 10.583, 3.41, 'ζ Peg', 'Peg', 'B8V', 210],
];

// Export lookup by HIP
export const starMap = {};
for (const s of stars) {
  starMap[s[0]] = {
    hip: s[0], ra: s[1], dec: s[2], mag: s[3],
    bayer: s[4], con: s[5], spec: s[6], dist: s[7]
  };
}
