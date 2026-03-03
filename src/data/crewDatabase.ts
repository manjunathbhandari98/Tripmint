export interface CrewMember {
  id: number;
  name: string;
  phone: string;
  address: string;
  location: string;
  lat: number | null;
  lng: number | null;
  designation: string;
  bookingLeadTime: string;
  locationLink: string;
}

function mapsLink(lat: number | null, lng: number | null): string {
  if (!lat || !lng) return "";
  return `${lat},${lng}`;
}

const rawCrew = [
  { id: 1, name: "Capt Shubhang Murthy", phone: "8806028575", address: "Ft. No. F2/IV F2&3/V 4TH Floor Anand Residency CHS Society Airport Road Near Navy Children's School Chicalim", location: "CHICALIM", lat: 15.393489396002124, lng: 73.83657977831255, designation: "Sr Pilot", bookingLeadTime: "1hr" },
  { id: 2, name: "Capt Avtar Singh Goraya", phone: "7219100142", address: "1A, Amar Apartment. Airport Road, Chicalim, Opp. Chicalim Sports Ground, Vasco, Goa 403711", location: "CHICALIM", lat: 15.392105229218174, lng: 73.83543720992088, designation: "Sr Pilot", bookingLeadTime: "1hr" },
  { id: 3, name: "Capt Kenan Muratovic", phone: "8100377247", address: "C 34, Gera River of Joy, Zone Z, Kadamba Plateau, Panelim, Goa 403402", location: "OLD GOA", lat: 15.491773552719748, lng: 73.89200741581124, designation: "Sr Pilot", bookingLeadTime: "1hr 10min" },
  { id: 4, name: "Capt Abhijit Bhushan", phone: "9036002615", address: "Flat No. 40/302, Milroc Kadamba, Kadamba Plateau, Banguinim, Old Goa, Goa 403402", location: "OLD GOA", lat: 15.486249139030424, lng: 73.90395080807544, designation: "Director Flight Operation", bookingLeadTime: "1hr 10min" },
  { id: 5, name: "Capt Radmil Vujicic", phone: "8956320680", address: "Oravs Guest House, 31st January Road, Panaji, Goa 403521", location: "PANJIM", lat: 15.497940223373803, lng: 73.83122594093494, designation: "Sr Pilot", bookingLeadTime: "1hr" },
  { id: 6, name: "Capt Amitabh Mullick", phone: "9810126482", address: "C-001 Bougainvilla Hermitage Borvon Waddo, Nachinola, Goa 403508", location: "Nachinola", lat: 15.582612304873006, lng: 73.85317450350455, designation: "Sr Pilot", bookingLeadTime: "1hr" },
  { id: 7, name: "Capt Manikantan Ayappan", phone: "9840132028", address: "Flat no 201, Building-I, Devashree Pinto Ville, Socorro, Porvorim Bardez, Goa 403501", location: "PORVORIM", lat: 15.541445800132296, lng: 73.82674605599554, designation: "Sr Pilot", bookingLeadTime: "50min" },
  { id: 8, name: "Capt Prasanna Gurung", phone: "8130026182", address: "Maria Rosa 2 Society Dolphine Circle Chogm Road Calangute, Goa 403516", location: "Calangute", lat: 15.540952614040341, lng: 73.76878190427536, designation: "Sr Pilot", bookingLeadTime: "50min" },
  { id: 9, name: "Capt Leo Chem Jong", phone: "9903991261", address: "Flat No. FF3, House No. 1638/4-FF-3, Solson's Gulmohar, Penha de Franca, Bardez, Porvorim, Goa 403521", location: "PORVORIM", lat: 15.526516025492722, lng: 73.8368812197949, designation: "Sr Pilot", bookingLeadTime: "50min" },
  { id: 10, name: "TFO Rohit Sanvatsarkar", phone: "8655017974", address: "Novo Cidade, Porvorim", location: "PORVORIM", lat: 15.527371509439355, lng: 73.82696776788946, designation: "Trainee First Officer", bookingLeadTime: "" },
  { id: 11, name: "Capt Yatan Sharma", phone: "8813881345", address: "Bapna House - Goa", location: "PORVORIM", lat: 15.551315518407344, lng: 73.83338670567169, designation: "Sr Pilot", bookingLeadTime: "45min" },
  { id: 12, name: "FO Anurag Malasi", phone: "9711108932", address: "Fort Aguada Road, Calangute, Bardez 403516", location: "Calangute", lat: 15.540764067150079, lng: 73.76886637792936, designation: "First Officer", bookingLeadTime: "" },
  { id: 13, name: "TFO Nikhil Melwani", phone: "9920977637", address: "House no. 146, Trindade Vaddo, Near Church Circle, Arpora, Bardez, Goa 403516", location: "ARPORA", lat: 15.564420753809456, lng: 73.76531033991567, designation: "Trainee First Officer", bookingLeadTime: "45min" },
  { id: 14, name: "FO Aseem Khajuria", phone: "9333313331", address: "C-4, B Wing Buildmore Woods Khorlim Mapusa 403507", location: "MAPUSA", lat: 15.590347377261272, lng: 73.80674071998773, designation: "First Officer", bookingLeadTime: "40min" },
  { id: 15, name: "Capt Jitendra Singh Sangwan", phone: "9880746655", address: "Zion 1 Square, Duler, Mapusa, House No 204, Block D-1, Mapusa", location: "MAPUSA", lat: 15.60779760471685, lng: 73.8136519807888, designation: "Sr Pilot", bookingLeadTime: "1hr" },
  { id: 16, name: "FO Kushal Sengupta", phone: "7002815635", address: "Flat No. 5, Majestic Apartment, Karaswada, Opp Vrundavan Hospital, Mapusa, North Goa 403507", location: "MAPUSA", lat: 15.604910902900313, lng: 73.82369208610703, designation: "First Officer", bookingLeadTime: "40min" },
  { id: 17, name: "FO Vivek Virendra Singh", phone: "9004642987", address: "Flat No. 5, Majestic Apartment, Karaswada, Opp Vrundavan Hospital, Mapusa, North Goa 403507", location: "MAPUSA", lat: 15.604910902900313, lng: 73.82369208610703, designation: "Trainee First Officer", bookingLeadTime: "40min" },
  { id: 18, name: "Capt Khairill Bin Anuar", phone: "7410142327", address: "Flat No. 5, Majestic Apartment, Karaswada, Opp Vrundavan Hospital, Mapusa, North Goa 403507", location: "MAPUSA", lat: 15.604910902900313, lng: 73.82369208610703, designation: "Sr Pilot", bookingLeadTime: "40min" },
  { id: 19, name: "TFO Gitesh Laddha", phone: "9672730467", address: "Flat-102, 1st Floor, Urban Mint Building, Karaswada NH 66, Mapusa, Goa 403507", location: "Karaswada", lat: 15.603031888001691, lng: 73.8240447380165, designation: "Trainee First Officer", bookingLeadTime: "40min" },
  { id: 20, name: "Capt Prateek Agarwal", phone: "9849699142", address: "H. No. 65/5/3 Tarchem Galu, Colvale, Bardez Goa", location: "Karaswada", lat: 15.646397490661178, lng: 73.83676316076892, designation: "Head of Pilot Training", bookingLeadTime: "40min" },
  { id: 21, name: "FO Neil Renavikar", phone: "8884997217", address: "B1, Raj Enclave, Goa-Mumbai Highway, Karaswada, Mapusa, Goa-403507", location: "Karaswada", lat: 15.61266799892506, lng: 73.82221265337789, designation: "First Officer", bookingLeadTime: "1hr" },
  { id: 23, name: "Capt Siddhesh Gujare", phone: "9604896869", address: "E-301, E Bldg, 3rd Floor, Pedro Martina Resort, Gaura Vaddo, Calangute, Bardez, North Goa 403515", location: "CALANGUTE", lat: 15.530347551003974, lng: 73.76516886902368, designation: "Sr Pilot", bookingLeadTime: "1hr" },
  { id: 24, name: "Capt Syed Kabeer", phone: "8269525086", address: "UG1, Bldg No. 1, Prudential Palms, Chogam Road, Porvorim, Pilerna, Bardez, Sangolda, Goa 403501", location: "PORVORIM", lat: 15.53487734508041, lng: 73.8205009490137, designation: "Sr Pilot", bookingLeadTime: "50min" },
  { id: 25, name: "FO Vishwas Patel", phone: "9096903273", address: "B1, Raj Enclaves, Mumbai-Goa Hwy, Next to Govt. Primary School, Karaswada, Mapusa, Goa 403507", location: "Karaswada", lat: 15.612647677125198, lng: 73.82222553650541, designation: "First Officer", bookingLeadTime: "1hr 30min" },
  { id: 26, name: "TFO Shravan Nagesh", phone: "9916045313", address: "Near Navtara Mapusa Goa", location: "MAPUSA", lat: 15.590347300871093, lng: 73.80673859654932, designation: "Trainee First Officer", bookingLeadTime: "40min" },
  { id: 27, name: "Capt Pedro Artilheiro", phone: "9205876142", address: "A1, Aguada Homes C, Fort Aguada Rd, Bammon Vaddo, Candolim, Goa 403515", location: "CANDOLIM", lat: 15.508603727981258, lng: 73.76978360114273, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 28, name: "Capt Vijayshekhar Poda", phone: "9849002659", address: "Otium Resort by Oterra Porvorim Goa", location: "PORVORIM", lat: null, lng: null, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 29, name: "TFO Gourav Reddy Moosani", phone: "7670969862", address: "Silver Oak, Karaswada", location: "Karaswada", lat: 15.59973164082737, lng: 73.82413384232775, designation: "Trainee First Officer", bookingLeadTime: "" },
  { id: 30, name: "SFO Amit Kumar", phone: "8392999992", address: "Paramount Homes E103 1st Floor Shree Ganespuri, Shivoli, Bardez", location: "Shivolim", lat: 15.612749069496266, lng: 73.80282973299616, designation: "Senior First Officer", bookingLeadTime: "" },
  { id: 31, name: "TFO Goli Nikhith", phone: "9848887983", address: "S1 Silver Oak Near Mapusa MRI Center Karaswada Mapusa Goa 403507", location: "MAPUSA", lat: 15.600334802907486, lng: 73.82439055652243, designation: "Trainee First Officer", bookingLeadTime: "" },
  { id: 32, name: "Capt Yogesh Dahiya", phone: "9789445413", address: "Zion 1 Square, Duler, Mapusa, House No 204, Block D-1, Mapusa", location: "MAPUSA", lat: 15.60779760471685, lng: 73.8136519807888, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 33, name: "FO Rahul Panchal", phone: "9910099910", address: "Flat no 101, Building B, 1st floor, Devashri Garden, Porvorim, Bardez Goa 403501", location: "PORVORIM", lat: 15.542540736663911, lng: 73.81989749835276, designation: "First Officer", bookingLeadTime: "" },
  { id: 34, name: "TFO Aryan Pandey", phone: "9818574264", address: "No. 27, 6th Floor, B-block, Sapna Heights, Electricity Colony, Panjim", location: "PANJIM", lat: 15.484882954810704, lng: 73.82209802272175, designation: "Trainee First Officer", bookingLeadTime: "" },
  { id: 35, name: "Capt Keziah Fernandes", phone: "9527311800", address: "1 SI-1 Models Boulevard, Caranzalem, Panjim, Goa 403002", location: "PANJIM", lat: 15.474500344075217, lng: 73.81211240754736, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 36, name: "TFO Nikhith Goli", phone: "9848887983", address: "S1, Silver Oak, Near Mapusa MRI Center, Karaswada, Mapusa, Goa 403507", location: "Karaswada", lat: 15.59973164082737, lng: 73.82413384232775, designation: "Trainee First Officer", bookingLeadTime: "" },
  { id: 37, name: "TFO Chandan Kumar Jena", phone: "9438822297", address: "005, MFA's Majestic Premium Apartments, Karaswada, Goa 403507", location: "Karaswada", lat: 15.60678889738524, lng: 73.82382573253024, designation: "Trainee First Officer", bookingLeadTime: "" },
  { id: 38, name: "TFO Sathish Kumar R", phone: "9677119677", address: "Flat No 27, 6th floor, Sapna Heights, St Inez, Panjim, Goa", location: "PANJIM", lat: 15.484717962094248, lng: 73.82215129438106, designation: "Trainee First Officer", bookingLeadTime: "" },
  { id: 39, name: "Nishant Chaudhary", phone: "9871120970", address: "Vasant Villa, House no. EHN-41, Beside Bhatji House, Near Mahadev Temple, Deulwada, Casarwarnem, Near Mopa Airport, Pernem, Goa 403512", location: "Casarwarnem", lat: 15.718220257686403, lng: 73.88561744971133, designation: "", bookingLeadTime: "" },
  { id: 40, name: "Amith Suresh", phone: "9833462455", address: "B&F Meadows, Nedora, Goa 403513", location: "NEDORA", lat: 15.66661200823656, lng: 73.85719270483976, designation: "", bookingLeadTime: "" },
  { id: 41, name: "Aakash Raichandani", phone: "7798329870", address: "House number 3/82/H4 4th Floor, Urban Heights, Karaswada, 403507", location: "Karaswada", lat: 15.61193984791817, lng: 73.82029663290992, designation: "", bookingLeadTime: "" },
  { id: 43, name: "Capt Vinay Prakash", phone: "9697280251", address: "Audrey Haven, House No 110A Near Rivasa Emerald Calangute", location: "Calangute", lat: 15.532922350878781, lng: 73.76716162930093, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 44, name: "Capt Aniruddha Arun Ransing", phone: "9967914288", address: "507 Devashree Vasudev Vihar Near St. Michael Church Taleigaon Panjim Goa, 403002", location: "PANJIM", lat: 15.467208666984398, lng: 73.82125346494396, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 45, name: "Hoshang Zubin Major", phone: "8095497393", address: "B&F Meadows, Bardez 403513, India", location: "NEDORA", lat: 15.666610949978248, lng: 73.85718867428392, designation: "", bookingLeadTime: "" },
  { id: 46, name: "TFO Surendhar Ganesan", phone: "7305943475", address: "Vedant Classic Chimbel", location: "Chimbel", lat: 15.485168314837846, lng: 73.87152475767068, designation: "Trainee First Officer", bookingLeadTime: "" },
  { id: 47, name: "Capt Bala Subramanium Subbiah", phone: "9025321574", address: "Alto Porvorim, Porvorim, Penha de Franc, Goa 403521", location: "Porvorim", lat: 15.527796868076969, lng: 73.83147340610488, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 48, name: "Capt Amit Verma", phone: "9999169733", address: "E-302 Socorro Gardens Kamat Nagar, Sabnis Valley, Porvorim, Aradi Socorro, Goa 403501", location: "Porvorim", lat: 15.545390685622737, lng: 73.82668241061788, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 49, name: "Capt Ankush Pure", phone: "9762130887", address: "302, Block F, Mangalam Casa Amora Phase 3, Kadamba Plateau, Old Goa-403402", location: "OLD GOA", lat: 15.484740116864806, lng: 73.90279677589665, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 50, name: "Capt Sunil Nair", phone: "9634027070", address: "Flat No. 501, B Block, 5th Floor, MVR Laguna Azul, Near MES College, South Goa 403726", location: "Sancoale", lat: 15.39883392242144, lng: 73.866397834797, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 51, name: "Capt Kunal Dey", phone: "9588483806", address: "Aqua-404, Salarpuria Sattva Water's Edge, Vidhya Nagar, Behind MES College, Zuari Nagar, Sancoale, Goa 403726", location: "Sancoale", lat: 15.397737828737915, lng: 73.86251330841552, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 52, name: "Capt Gagan Nandwana", phone: "9818860737", address: "B-308 Devashri Vasudev Vihar, Near St Michaels Church, Taleigao Panaji 403002", location: "Taligao", lat: 15.467580118289463, lng: 73.8214016354766, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 53, name: "Ms Subhasree Bera", phone: "9831098044", address: "Milroc Kadamba, Ribandar Goa", location: "OLD GOA", lat: 15.486383550146066, lng: 73.90404736750321, designation: "", bookingLeadTime: "" },
  { id: 54, name: "Capt Amol Deshpande", phone: "9448491207", address: "Flat No.B-303 Mohidin Iconia Apartments Jairam Nagar Dabolim, Goa 403711", location: "DABOLIM", lat: 15.394804768462059, lng: 73.85349228705688, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 55, name: "Capt Amardeep Singh Sarai", phone: "9632202787", address: "V302 Mangalam Casa Amora Phase 3, Baingini, close to Milrock Kadamba", location: "OLD GOA", lat: 15.484708334441756, lng: 73.90276458911768, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 56, name: "Capt Amitava Gupta", phone: "9953234366", address: "E41, Central Park, Cunchellim, Mapusa", location: "MAPUSA", lat: 15.61085436253531, lng: 73.81256505965668, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 57, name: "Capt Jasmine Massey", phone: "8008327951", address: "Aquarius, Siolim G-3, Flat 206", location: "Siolim", lat: 15.61582274707941, lng: 73.78749028675927, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 58, name: "FO Mohamed Wazil", phone: "9746920141", address: "Flat No 101, 2nd Floor, B Block, Mangalam Casa Amora Phase I, Baingini, Goa 403402", location: "OLD GOA", lat: 15.485053059096522, lng: 73.9050298705574, designation: "First Officer", bookingLeadTime: "" },
  { id: 59, name: "Capt Shibasish Kushary", phone: "9831953087", address: "DF2, B&F Meadows, Nedora, Goa 403513", location: "Nedora", lat: 15.666635110252944, lng: 73.85720761742033, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 60, name: "TFO Chandan Kumar Jena", phone: "9438822297", address: "Flat no.-005, MFA's Majestic Premium Apartments Karaswada, Mapusa, Goa-403507", location: "Karaswada", lat: 15.604887566683532, lng: 73.8237559951071, designation: "Trainee First Officer", bookingLeadTime: "" },
  { id: 61, name: "FO Yogesh Dhotre", phone: "9820931284", address: "Casa Amora Phase 1 Block E, Old Goa", location: "OLD GOA", lat: 15.485045627713841, lng: 73.90503411102571, designation: "First Officer", bookingLeadTime: "" },
  { id: 62, name: "Capt Junaid Hasan", phone: "9810138320", address: "Marshalls Villa, House No K-10, Kegdevelim, Verem, Bardez, North Goa, Goa-403114", location: "VEREM", lat: 15.498052315267213, lng: 73.7984118186001, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 63, name: "Capt Nishant Patel", phone: "7985639221", address: "House No. B 491, Ashok Beleza, Alto Betim, Porvorim, Bardez, North Goa, Goa 403101", location: "Betim", lat: 15.509302626506326, lng: 73.82766298219106, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 64, name: "Capt Harish Yadav", phone: "9911111741", address: "House No. B 491, Ashok Beleza, Alto Betim, Porvorim, Bardez, North Goa, Goa 403101", location: "Betim", lat: 15.509302626506326, lng: 73.82766298219106, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 65, name: "TFO Jubhillyn Carey", phone: "9920368978", address: "Flat No. B/460/LFI, Bridgeview Apt, Alto Betim, Bardez, North Goa, Goa 403101", location: "Betim", lat: 15.50794649148189, lng: 73.82754456582182, designation: "Trainee First Officer", bookingLeadTime: "" },
  { id: 66, name: "Capt Melvin Rogers", phone: "9811312667", address: "Marshalls Villa K-10 Kegdevelim, Nerul Reis Magos Road Verem, Reis Magos Bardez Goa-403114", location: "Nerul", lat: 15.498085930140025, lng: 73.79840847022133, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 67, name: "Capt Sudhanshu Saini", phone: "9517172600", address: "Building No. 491, UGF, Ashok Beleza, Patel Estate, Alto Betim, Porvorim, North Goa, Goa-403101", location: "Porvorim", lat: 15.509343022489677, lng: 73.82765956587271, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 68, name: "Capt Pradeep Badola", phone: "8125771643", address: "House no 463/4, Abaixa Waddo Mapusa-Calangute road, Parra, Canca, Mapusa, Goa", location: "Mapusa", lat: 15.578150074818057, lng: 73.79699354828287, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 69, name: "Capt Satish Chandra", phone: "9845322539", address: "Cresent Hotel, Miramar", location: "Miramar", lat: null, lng: null, designation: "Sr Pilot", bookingLeadTime: "" },
  { id: 70, name: "Capt Vikas Tomar", phone: "8851614034", address: "House No. 841/01, First Floor Beside Park Lane Housing Complex Alto, Porvorim Goa 403521", location: "Porvorim", lat: 15.537566108927797, lng: 73.82608261496814, designation: "Sr Pilot", bookingLeadTime: "" },
];

export const crewDatabase: CrewMember[] = rawCrew.map((c) => ({
  ...c,
  locationLink: mapsLink(c.lat, c.lng),
}));

export default crewDatabase;