import os
import json
import pandas as pd

base_dir = r"D:\test 2\Data"
mandi_csv = os.path.join(base_dir, "processed", "mandi_prices_clean.csv")
coords_file = os.path.join(base_dir, "processed", "district_coordinates.json")

df = pd.read_csv(mandi_csv)
unique_districts = sorted(df['district'].str.strip().unique())

with open(coords_file, 'r', encoding='utf-8') as f:
    existing_coords = json.load(f)

# Comprehensive Indian District Centroid Coordinates Dictionary
INDIAN_DISTRICTS_GEO = {
    # Uttar Pradesh
    "Agra": [27.1767, 78.0081], "Aligarh": [27.8974, 78.0880], "Allahabad": [25.4358, 81.8463],
    "Prayagraj": [25.4358, 81.8463], "Ambedkar Nagar": [26.4468, 82.6837], "Amethi": [26.1558, 81.8159],
    "Amroha": [28.9044, 78.4682], "Auraiya": [26.4674, 79.5161], "Ayodhya": [26.7922, 82.1998],
    "Azamgarh": [26.0688, 83.1839], "Baghpat": [28.9452, 77.2217], "Bahraich": [27.5750, 81.5947],
    "Ballia": [25.7584, 84.1497], "Balrampur": [27.4299, 82.1818], "Banda": [25.4754, 80.3364],
    "Barabanki": [26.9268, 81.1834], "Bareilly": [28.3670, 79.4304], "Basti": [26.8123, 82.7629],
    "Bhadohi": [25.3942, 82.5714], "Bijnor": [29.3732, 78.1358], "Budaun": [28.0315, 79.1256],
    "Bulandshahr": [28.4069, 77.8498], "Chandauli": [25.2618, 83.2721], "Chitrakoot": [25.2132, 80.9168],
    "Deoria": [26.5024, 83.7791], "Etah": [27.5574, 78.6653], "Etawah": [26.7769, 79.0238],
    "Farrukhabad": [27.3826, 79.5828], "Fatehpur": [25.9284, 80.8129], "Firozabad": [27.1591, 78.3957],
    "Gautam Buddha Nagar": [28.5355, 77.3910], "Ghaziabad": [28.6692, 77.4538], "Ghazipur": [25.5840, 83.5770],
    "Gonda": [27.1337, 81.9619], "Gorakhpur": [26.7606, 83.3732], "Hamirpur": [25.9547, 80.1517],
    "Hapur": [28.7306, 77.7759], "Hardoi": [27.3947, 80.1313], "Hathras": [27.5970, 78.0519],
    "Jalaun": [26.1458, 79.3364], "Jaunpur": [25.7464, 82.6837], "Jhansi": [25.4484, 78.5685],
    "Kannauj": [27.0549, 79.9199], "Kanpur": [26.4499, 80.3319], "Kanpur Dehat": [26.3310, 80.0000],
    "Kanpur Nagar": [26.4499, 80.3319], "Kasganj": [27.8092, 78.6475], "Kaushambi": [25.5317, 81.4011],
    "Kheri": [27.9472, 80.7787], "Kushinagar": [26.7408, 83.8890], "Lakhimpur Kheri": [27.9472, 80.7787],
    "Lalitpur": [24.6896, 78.4120], "Lucknow": [26.8467, 80.9462], "Maharajganj": [27.1472, 83.5614],
    "Mahoba": [25.2924, 79.8724], "Mainpuri": [27.2289, 79.0277], "Mathura": [27.4924, 77.6737],
    "Mau": [25.9417, 83.5614], "Meerut": [28.9845, 77.7064], "Mirzapur": [25.1460, 82.5690],
    "Moradabad": [28.8386, 78.7733], "Muzaffarnagar": [29.4727, 77.7085], "Pilibhit": [28.6310, 79.8037],
    "Pratapgarh": [25.8967, 81.9474], "Raebareli": [26.2303, 81.2409], "Rampur": [28.8074, 79.0277],
    "Saharanpur": [29.9671, 77.5510], "Sambhal": [28.5847, 78.5562], "Sant Kabir Nagar": [26.7820, 83.0336],
    "Shahjahanpur": [27.8814, 79.9118], "Shamli": [29.4497, 77.3090], "Shravasti": [27.7042, 81.9619],
    "Siddharthnagar": [27.2796, 82.8273], "Sitapur": [27.5684, 80.6829], "Sonbhadra": [24.6850, 83.0684],
    "Sultanpur": [26.2648, 82.0727], "Unnao": [26.5463, 80.4879], "Varanasi": [25.3176, 82.9739],

    # Madhya Pradesh
    "Bhopal": [23.2599, 77.4126], "Indore": [22.7196, 75.8577], "Gwalior": [26.2183, 78.1828],
    "Jabalpur": [23.1815, 79.9864], "Ujjain": [23.1765, 75.7885], "Sagar": [23.8388, 78.7378],
    "Dewas": [22.9676, 76.0534], "Satna": [24.5804, 80.8322], "Ratlam": [23.3315, 75.0367],
    "Rewa": [24.5373, 81.2999], "Murwara": [23.8343, 80.3995], "Katni": [23.8343, 80.3995],
    "Singrauli": [24.1992, 82.6645], "Burhanpur": [21.3142, 76.2299], "Khandwa": [21.8314, 76.3498],
    "Bhind": [26.5654, 78.7845], "Chhindwara": [22.0574, 78.9382], "Guna": [24.6465, 77.3109],
    "Shivpuri": [25.4312, 77.6599], "Vidisha": [23.5251, 77.8081], "Chhatarpur": [24.9164, 79.5811],
    "Damoh": [23.8323, 79.4418], "Mandsaur": [24.0722, 75.0683], "Khargone": [21.8257, 75.6139],
    "Neemuch": [24.4646, 74.8707], "Panna": [24.7208, 80.1837], "Hoshangabad": [22.7519, 77.7289],
    "Narmadapuram": [22.7519, 77.7289], "Sehore": [23.2032, 77.0844], "Betul": [21.9015, 77.9015],
    "Seoni": [22.0869, 79.5435], "Datia": [25.6687, 78.4608], "Dhar": [22.5985, 75.2974],
    "Raisen": [23.3315, 77.7818], "Shajapur": [23.4287, 76.2758], "Tikamgarh": [24.7432, 78.8315],
    "Barwani": [22.0364, 74.9034], "Harda": [22.3395, 77.0945], "Sheopur": [25.6687, 76.6999],
    "Morena": [26.4947, 77.9940], "Rajgarh": [24.0064, 76.7299], "Narsinghpur": [22.9463, 79.1947],
    "Balaghat": [21.8129, 80.1837], "Ashoknagar": [24.5750, 77.7289], "Anuppur": [23.1042, 81.6888],
    "Alirajpur": [22.3044, 74.3547], "Agar Malwa": [23.7142, 76.0169],

    # Maharashtra
    "Mumbai": [19.0760, 72.8777], "Pune": [18.5204, 73.8567], "Nagpur": [21.1458, 79.0882],
    "Thane": [19.2183, 72.9781], "Nashik": [19.9975, 73.7898], "Aurangabad": [19.8762, 75.3433],
    "Chhatrapati Sambhajinagar": [19.8762, 75.3433], "Solapur": [17.6599, 75.9064], "Amravati": [20.9374, 77.7796],
    "Kolhapur": [16.7050, 74.2433], "Sangli": [16.8524, 74.5815], "Jalgaon": [21.0077, 75.5626],
    "Akola": [20.7002, 77.0082], "Latur": [18.4088, 76.5604], "Dhule": [20.9042, 74.7749],
    "Ahmednagar": [19.0948, 74.7480], "Ahilyanagar": [19.0948, 74.7480], "Satara": [17.6805, 73.9934],
    "Chandrapur": [19.9615, 79.2961], "Parbhani": [19.2610, 76.7767], "Jalna": [19.8347, 75.8816],
    "Beed": [18.9891, 75.7601], "Yavatmal": [20.3888, 78.1204], "Nanded": [19.1383, 77.3210],
    "Gondia": [21.4598, 80.1961], "Wardha": [20.7453, 78.6022], "Osmanabad": [18.1856, 76.0419],
    "Dharashiv": [18.1856, 76.0419], "Nandurbar": [21.3695, 74.2407], "Hingoli": [19.7196, 77.1472],
    "Washim": [20.1118, 77.1332], "Bhandara": [21.1684, 79.6547], "Buldhana": [20.5292, 76.1843],
    "Ratnagiri": [16.9902, 73.3120], "Sindhudurg": [16.1189, 73.7279], "Raigad": [18.5158, 73.1822],
    "Palghar": [19.6967, 72.7699],

    # Rajasthan
    "Jaipur": [26.9124, 75.7873], "Jodhpur": [26.2389, 73.0243], "Kota": [25.2138, 75.8648],
    "Bikaner": [28.0229, 73.3119], "Ajmer": [26.4499, 74.6399], "Udaipur": [24.5854, 73.7125],
    "Bhilwara": [25.3407, 74.6313], "Alwar": [27.5530, 76.6346], "Bharatpur": [27.2152, 77.5030],
    "Sikar": [27.6094, 75.1398], "Pali": [25.7711, 73.3234], "Sri Ganganagar": [29.9038, 73.8772],
    "Hanumangarh": [29.5817, 74.3294], "Nagaur": [27.1983, 73.7483], "Chittorgarh": [24.8887, 74.6269],
    "Baran": [25.1011, 76.5132], "Dausa": [26.8924, 76.3375], "Jhunjhunu": [28.1289, 75.3995],
    "Churu": [28.2900, 74.9667], "Tonk": [26.1622, 75.7895], "Sawai Madhopur": [25.9928, 76.3526],
    "Bundi": [25.4414, 75.6450], "Jhalawar": [24.5973, 76.1610], "Barmer": [25.7521, 71.3967],

    # Gujarat
    "Ahmedabad": [23.0225, 72.5714], "Surat": [21.1702, 72.8311], "Vadodara": [22.3072, 73.1812],
    "Rajkot": [22.3039, 70.8022], "Bhavnagar": [21.7645, 72.1519], "Jamnagar": [22.4707, 70.0577],
    "Junagadh": [21.5222, 70.4579], "Gandhinagar": [23.2156, 72.6369], "Anand": [22.5645, 72.9289],
    "Navsari": [20.9500, 72.9300], "Mehsana": [23.5880, 72.3693], "Morbi": [22.8120, 70.8236],
    "Surendranagar": [22.7277, 71.6370], "Amreli": [21.6032, 71.2223], "Patan": [23.8493, 72.1266],
    "Sabarkantha": [23.5937, 73.0645], "Banaskantha": [24.1724, 72.4346], "Kutch": [23.7337, 69.8597],
    "Bharuch": [21.7051, 72.9959], "Porbandar": [21.6417, 69.6293], "Kheda": [22.7513, 72.6858],

    # Punjab & Haryana
    "Ludhiana": [30.9010, 75.8573], "Amritsar": [31.6340, 74.8723], "Jalandhar": [31.3260, 75.5762],
    "Patiala": [30.3398, 76.3869], "Bathinda": [30.2110, 74.9455], "Hoshiarpur": [31.5143, 75.9115],
    "Karnal": [29.6857, 76.9905], "Ambala": [30.3782, 76.7767], "Hisar": [29.1492, 75.7217],
    "Rohtak": [28.8955, 76.6066], "Panipat": [29.3909, 76.9635], "Sonipat": [28.9931, 77.0151],
    "Gurugram": [28.4595, 77.0266], "Faridabad": [28.4089, 77.3178], "Sirsa": [29.5349, 75.0298],
    "Kurukshetra": [29.9695, 76.8783], "Fatehabad": [29.5167, 75.4500], "Jind": [29.3140, 76.3140],
    "Kaithal": [29.8015, 76.3996], "Rewari": [28.1834, 76.6183], "Bhiwani": [28.7932, 76.1390],
    "Yamunanagar": [30.1290, 77.2674],

    # Karnataka & Andhra Pradesh & Telangana & Tamil Nadu & Kerala
    "Bengaluru": [12.9716, 77.5946], "Mysuru": [12.2958, 76.6394], "Hubballi": [15.3647, 75.1240],
    "Belagavi": [15.8497, 74.4977], "Kalaburagi": [17.3297, 76.8343], "Davanagere": [14.4644, 75.9218],
    "Ballari": [15.1394, 76.9214], "Shivamogga": [13.9299, 75.5681], "Tumakuru": [13.3409, 77.1006],
    "Hassan": [13.0033, 76.1004], "Mandya": [12.5230, 76.8969], "Dakshina Kannada": [12.8703, 75.2479],
    "Uttara Kannada": [14.7937, 74.6869], "Udupi": [13.3409, 74.7421], "Kolar": [13.1367, 78.1340],
    "Chikkaballapura": [13.4355, 77.7275], "Bagalkote": [16.1856, 75.6968], "Vijayapura": [16.8302, 75.7100],
    "Gadag": [15.4297, 75.6322], "Haveri": [14.7966, 75.3995], "Raichur": [16.2120, 77.3439],
    "Koppal": [15.3533, 76.1555], "Yadgir": [16.7645, 77.1378], "Chitradurga": [14.2251, 76.4018],
    
    # Andhra Pradesh & Telangana
    "Visakhapatnam": [17.6868, 83.2185], "Vijayawada": [16.5062, 80.6480], "Guntur": [16.3067, 80.4365],
    "Nellore": [14.4426, 79.9865], "Kurnool": [15.8281, 78.0373], "Kadapah": [14.4673, 78.8242],
    "YSR": [14.4673, 78.8242], "Anantapur": [14.6819, 77.6006], "Chittoor": [13.2172, 79.1003],
    "Prakasam": [15.5057, 80.0499], "West Godavari": [16.7107, 81.0952], "East Godavari": [17.0005, 81.8040],
    "Krishna": [16.1809, 81.1303], "Srikakulam": [18.2949, 83.8938], "Vizianagaram": [18.1067, 83.3956],
    "Hyderabad": [17.3850, 78.4867], "Warangal": [17.9689, 79.5941], "Nizamabad": [18.6725, 78.0941],
    "Karimnagar": [18.4386, 79.1288], "Khammam": [17.2473, 80.1514], "Nalgonda": [17.0577, 79.2684],
    "Mahabubnagar": [16.7488, 77.9856], "Medak": [18.0487, 78.2612], "Adilabad": [19.6641, 78.5320],

    # Tamil Nadu & Kerala
    "Chennai": [13.0827, 80.2707], "Coimbatore": [11.0168, 76.9558], "Madurai": [9.9252, 78.1198],
    "Tiruchirappalli": [10.7905, 78.7047], "Salem": [11.6643, 78.1460], "Tirunelveli": [8.7139, 77.7567],
    "Erode": [11.3410, 77.7172], "Vellore": [12.9165, 79.1325], "Thanjavur": [10.7870, 79.1378],
    "Dindigul": [10.3673, 77.9803], "Cuddalore": [11.7480, 79.7714], "Kanchipuram": [12.8342, 79.7036],
    "Dharmapuri": [12.1211, 78.1582], "Krishnagiri": [12.5186, 78.2137], "Villupuram": [11.9401, 79.4861],
    "Tiruppur": [11.1085, 77.3411], "The Nilgiris": [11.4916, 76.7337], "Theni": [10.0104, 77.4768],
    "Thiruvananthapuram": [8.5241, 76.9366], "Kochi": [9.9312, 76.2673], "Ernakulam": [9.9816, 76.2999],
    "Kozhikode": [11.2588, 75.7804], "Thrissur": [10.5276, 76.2144], "Kollam": [8.8932, 76.6141],
    "Palakkad": [10.7867, 76.6548], "Malappuram": [11.0510, 76.0711], "Kannur": [11.8745, 75.3704],
    "Kottayam": [9.5916, 76.5222], "Alappuzha": [9.4981, 76.3388], "Idukki": [9.8494, 76.9806],
    "Wayanad": [11.6854, 76.1320], "Kasaragod": [12.4996, 74.9869], "Pathanamthitta": [9.2648, 76.7870],

    # West Bengal & Bihar & Odisha
    "Kolkata": [22.5726, 88.3639], "Howrah": [22.5958, 88.2636], "Bardhaman": [23.2324, 87.8615],
    "Purba Bardhaman": [23.2324, 87.8615], "Paschim Bardhaman": [23.6889, 86.9661], "Hooghly": [22.9030, 88.3888],
    "Nadia": [23.4710, 88.5565], "Murshidabad": [24.1759, 88.2802], "Malda": [25.0108, 88.1411],
    "North 24 Parganas": [22.7230, 88.4800], "South 24 Parganas": [22.1352, 88.4016], "Bankura": [23.2319, 87.0784],
    "Purulia": [23.3322, 86.3652], "Birbhum": [23.8404, 87.6186], "Darjeeling": [27.0410, 88.2663],
    "Jalpaiguri": [26.5405, 88.7196], "Cooch Behar": [26.3239, 89.4510], "Patna": [25.5941, 85.1376],
    "Gaya": [24.7914, 85.0002], "Muzaffarpur": [26.1209, 85.3647], "Bhagalpur": [25.2425, 86.9842],
    "Purnia": [25.7771, 87.4753], "Darbhanga": [26.1542, 85.8918], "Begusarai": [25.4182, 86.1272],
    "Bhubaneswar": [20.2961, 85.8245], "Cuttack": [20.4625, 85.8828], "Puri": [19.8135, 85.8312],
    "Sambalpur": [21.4669, 83.9812], "Balasore": [21.4934, 86.9135], "Ganjam": [19.3822, 84.8868],

    # Himachal, Uttarakhand, J&K, Northeast & Island
    "Shimla": [31.1048, 77.1734], "Kangra": [32.0998, 76.2691], "Mandi": [31.5892, 76.9182],
    "Kullu": [31.9579, 77.1095], "Solan": [30.9045, 77.0967], "Dehradun": [30.3165, 78.0322],
    "Haridwar": [29.9457, 78.1642], "Nainital": [29.3919, 79.4542], "Udham Singh Nagar": [28.9800, 79.4000],
    "Srinagar": [34.0837, 74.7973], "Jammu": [32.7266, 74.8570], "Anantnag": [33.7311, 75.1522],
    "Baramulla": [34.1980, 74.3636], "Guwahati": [26.1445, 91.7362], "Kamrup": [26.3150, 91.5984],
    "Cachar": [24.8333, 92.7789], "Dibrugarh": [27.4728, 94.9120], "Imphal": [24.8170, 93.9368],
    "Agartala": [23.8315, 91.2868], "North and Middle Andaman": [12.9200, 92.9300], "Nicobar": [9.1550, 92.7560],
    "South Andaman": [11.6234, 92.7265]
}

# Merge existing with new geo-dictionary
merged_coords = existing_coords.copy()
for d, coord in INDIAN_DISTRICTS_GEO.items():
    merged_coords[d] = coord

# For any remaining district, match case-insensitively or assign nearest/state center
for d in unique_districts:
    if d not in merged_coords:
        # Try title case
        if d.title() in merged_coords:
            merged_coords[d] = merged_coords[d.title()]
        elif d.capitalize() in merged_coords:
            merged_coords[d] = merged_coords[d.capitalize()]

# Save updated coordinates file
with open(coords_file, 'w', encoding='utf-8') as f:
    json.dump(merged_coords, f, indent=2)

matched_now = [d for d in unique_districts if d in merged_coords]
print(f"Updated district_coordinates.json: {len(merged_coords)} total coordinates.")
print(f"District match count in Mandi dataset: {len(matched_now)} / {len(unique_districts)} ({len(matched_now)/len(unique_districts)*100:.1f}%)")
