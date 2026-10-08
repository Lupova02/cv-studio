// Länderkatalog (ISO-3166-Codes) mit Namen, Telefonvorwahlen und Staatsangehörigkeiten in de/en/tr.
// AUTOMATISCH ERZEUGT von scripts/generate-countries.mjs – Änderungen dort vornehmen, nicht in dieser Datei.
import type { CvLanguage } from '../cv/cv-data';

/** Ein Land mit ISO-Code, internationaler Vorwahl und lokalisierten Bezeichnungen. */
export interface CountryRecord {
  /** ISO-3166-1-Alpha-2-Code, z. B. 'DE'. */
  code: string;
  /** Internationale Vorwahl mit Pluszeichen, z. B. '+49'; leer, wenn keine bekannt ist. */
  dial: string;
  name: Record<CvLanguage, string>;
  /** Staatsangehörigkeit als Adjektiv, z. B. 'Deutsch' / 'German' / 'Alman'. */
  demonym: Record<CvLanguage, string>;
}

/** Alle Länder, alphabetisch nach ISO-Code sortiert. */
export const COUNTRIES: readonly CountryRecord[] = [
  { code: 'AD', dial: '+376', name: { de: "Andorra", en: "Andorra", tr: "Andorra" }, demonym: { de: "Andorranisch", en: "Andorran", tr: "Andorralı" } },
  { code: 'AE', dial: '+971', name: { de: "Vereinigte Arabische Emirate", en: "United Arab Emirates", tr: "Birleşik Arap Emirlikleri" }, demonym: { de: "Emiratisch", en: "Emirati", tr: "Emirlikli" } },
  { code: 'AF', dial: '+93', name: { de: "Afghanistan", en: "Afghanistan", tr: "Afganistan" }, demonym: { de: "Afghanisch", en: "Afghan", tr: "Afgan" } },
  { code: 'AG', dial: '+1', name: { de: "Antigua und Barbuda", en: "Antigua and Barbuda", tr: "Antigua ve Barbuda" }, demonym: { de: "Antiguanisch", en: "Antiguans", tr: "Antigualı" } },
  { code: 'AI', dial: '+1', name: { de: "Anguilla", en: "Anguilla", tr: "Anguilla" }, demonym: { de: "Anguillanisch", en: "Anguillan", tr: "Anguillalı" } },
  { code: 'AL', dial: '+355', name: { de: "Albanien", en: "Albania", tr: "Arnavutluk" }, demonym: { de: "Albanisch", en: "Albanian", tr: "Arnavut" } },
  { code: 'AM', dial: '+374', name: { de: "Armenien", en: "Armenia", tr: "Ermenistan" }, demonym: { de: "Armenisch", en: "Armenian", tr: "Ermeni" } },
  { code: 'AO', dial: '+244', name: { de: "Angola", en: "Angola", tr: "Angola" }, demonym: { de: "Angolanisch", en: "Angolan", tr: "Angolalı" } },
  { code: 'AQ', dial: '+672', name: { de: "Antarktis", en: "Antarctica", tr: "Antarktika" }, demonym: { de: "Antarktisch", en: "Antarctic", tr: "Antarktikalı" } },
  { code: 'AR', dial: '+54', name: { de: "Argentinien", en: "Argentina", tr: "Arjantin" }, demonym: { de: "Argentinisch", en: "Argentinean", tr: "Arjantinli" } },
  { code: 'AS', dial: '+1', name: { de: "Amerikanisch-Samoa", en: "American Samoa", tr: "Amerikan Samoası" }, demonym: { de: "Amerikanisch-samoanisch", en: "American Samoan", tr: "Amerikan Samoalı" } },
  { code: 'AT', dial: '+43', name: { de: "Österreich", en: "Austria", tr: "Avusturya" }, demonym: { de: "Österreichisch", en: "Austrian", tr: "Avusturyalı" } },
  { code: 'AU', dial: '+61', name: { de: "Australien", en: "Australia", tr: "Avustralya" }, demonym: { de: "Australisch", en: "Australian", tr: "Avustralyalı" } },
  { code: 'AW', dial: '+297', name: { de: "Aruba", en: "Aruba", tr: "Aruba" }, demonym: { de: "Arubanisch", en: "Aruban", tr: "Arubalı" } },
  { code: 'AX', dial: '+358', name: { de: "Åland", en: "Åland Islands", tr: "Åland Adaları" }, demonym: { de: "Åland Insel", en: "Åland Islands", tr: "Ålandlı" } },
  { code: 'AZ', dial: '+994', name: { de: "Aserbaidschan", en: "Azerbaijan", tr: "Azerbaycan" }, demonym: { de: "Aserbaidschanisch", en: "Azerbaijani", tr: "Azerbaycanlı" } },
  { code: 'BA', dial: '+387', name: { de: "Bosnien und Herzegowina", en: "Bosnia and Herzegovina", tr: "Bosna Hersek" }, demonym: { de: "Bosnisch", en: "Bosnian", tr: "Bosna-Hersekli" } },
  { code: 'BB', dial: '+1', name: { de: "Barbados", en: "Barbados", tr: "Barbados" }, demonym: { de: "Barbadisch", en: "Barbadian", tr: "Barbadoslu" } },
  { code: 'BD', dial: '+880', name: { de: "Bangladesch", en: "Bangladesh", tr: "Bangladeş" }, demonym: { de: "Bangladeschisch", en: "Bangladeshi", tr: "Bangladeşli" } },
  { code: 'BE', dial: '+32', name: { de: "Belgien", en: "Belgium", tr: "Belçika" }, demonym: { de: "Belgisch", en: "Belgian", tr: "Belçikalı" } },
  { code: 'BF', dial: '+226', name: { de: "Burkina Faso", en: "Burkina Faso", tr: "Burkina Faso" }, demonym: { de: "Burkinisch", en: "Burkinabe", tr: "Burkina Fasolu" } },
  { code: 'BG', dial: '+359', name: { de: "Bulgarien", en: "Bulgaria", tr: "Bulgaristan" }, demonym: { de: "Bulgarisch", en: "Bulgarian", tr: "Bulgar" } },
  { code: 'BH', dial: '+973', name: { de: "Bahrain", en: "Bahrain", tr: "Bahreyn" }, demonym: { de: "Bahrainisch", en: "Bahraini", tr: "Bahreynli" } },
  { code: 'BI', dial: '+257', name: { de: "Burundi", en: "Burundi", tr: "Burundi" }, demonym: { de: "Burundisch", en: "Burundian", tr: "Burundili" } },
  { code: 'BJ', dial: '+229', name: { de: "Benin", en: "Benin", tr: "Benin" }, demonym: { de: "Beninisch", en: "Beninese", tr: "Beninli" } },
  { code: 'BL', dial: '+590', name: { de: "Saint-Barthélemy", en: "Saint Barthélemy", tr: "Saint Barthelemy" }, demonym: { de: "St. Barthélemy", en: "Saint Barthélemy", tr: "Saint Barthélemyli" } },
  { code: 'BM', dial: '+1', name: { de: "Bermuda", en: "Bermuda", tr: "Bermuda" }, demonym: { de: "Bermudisch", en: "Bermuda", tr: "Bermudalı" } },
  { code: 'BN', dial: '+673', name: { de: "Brunei Darussalam", en: "Brunei Darussalam", tr: "Brunei" }, demonym: { de: "Bruneiisch", en: "Bruneian", tr: "Bruneili" } },
  { code: 'BO', dial: '+591', name: { de: "Bolivien", en: "Bolivia", tr: "Bolivya" }, demonym: { de: "Bolivisch", en: "Bolivian", tr: "Bolivyalı" } },
  { code: 'BQ', dial: '+599', name: { de: "Bonaire", en: "Bonaire, Sint Eustatius and Saba", tr: "Karayip Hollanda" }, demonym: { de: "Bonaire, Sint Eustatius und Saba", en: "Bonaire, Sint Eustatius and Saba", tr: "Karayip Hollandalı" } },
  { code: 'BR', dial: '+55', name: { de: "Brasilien", en: "Brazil", tr: "Brezilya" }, demonym: { de: "Brasilianisch", en: "Brazilian", tr: "Brezilyalı" } },
  { code: 'BS', dial: '+1', name: { de: "Bahamas", en: "Bahamas", tr: "Bahamalar" }, demonym: { de: "Bahamaisch", en: "Bahamian", tr: "Bahamalı" } },
  { code: 'BT', dial: '+975', name: { de: "Bhutan", en: "Bhutan", tr: "Butan" }, demonym: { de: "Bhutanisch", en: "Bhutanese", tr: "Butanlı" } },
  { code: 'BV', dial: '', name: { de: "Bouvetinsel", en: "Bouvet Island", tr: "Bouvet Adası" }, demonym: { de: "Bouvet insel", en: "Bouvet Island", tr: "Bouvet Adalı" } },
  { code: 'BW', dial: '+267', name: { de: "Botswana", en: "Botswana", tr: "Botsvana" }, demonym: { de: "Botsuanisch", en: "Batswana", tr: "Botsvanalı" } },
  { code: 'BY', dial: '+375', name: { de: "Belarus", en: "Belarus", tr: "Beyaz Rusya" }, demonym: { de: "Belarussisch", en: "Belarusian", tr: "Belaruslu" } },
  { code: 'BZ', dial: '+501', name: { de: "Belize", en: "Belize", tr: "Belize" }, demonym: { de: "Belizisch", en: "Belizean", tr: "Belizeli" } },
  { code: 'CA', dial: '+1', name: { de: "Kanada", en: "Canada", tr: "Kanada" }, demonym: { de: "Kanadisch", en: "Canadian", tr: "Kanadalı" } },
  { code: 'CC', dial: '+61', name: { de: "Kokosinseln", en: "Cocos (Keeling) Islands", tr: "Cocos (Keeling) Adaları" }, demonym: { de: "Kokosinseln", en: "Cocos (Keeling) Islands", tr: "Cocos Adalı" } },
  { code: 'CD', dial: '+243', name: { de: "Kongo", en: "Democratic Republic of the Congo", tr: "Kongo - Kinşasa" }, demonym: { de: "Kongolesisch (Demokratische Republik Kongo)", en: "Congolese (Democratic Republic of the Congo)", tr: "Demokratik Kongolu" } },
  { code: 'CF', dial: '+236', name: { de: "Zentralafrikanische Republik", en: "Central African Republic", tr: "Orta Afrika Cumhuriyeti" }, demonym: { de: "Zentralafrikanisch", en: "Central African", tr: "Orta Afrikalı" } },
  { code: 'CG', dial: '+242', name: { de: "Republik Kongo", en: "Republic of the Congo", tr: "Kongo - Brazavil" }, demonym: { de: "Kongolesisch (Republik Kongo)", en: "Congolese (Republic of the Congo)", tr: "Kongolu" } },
  { code: 'CH', dial: '+41', name: { de: "Schweiz", en: "Switzerland", tr: "İsviçre" }, demonym: { de: "Schweizerisch", en: "Swiss", tr: "İsviçreli" } },
  { code: 'CI', dial: '+225', name: { de: "Elfenbeinküste", en: "Cote d'Ivoire", tr: "Fildişi Sahili" }, demonym: { de: "Ivorisch", en: "Ivorian", tr: "Fildişi Sahilli" } },
  { code: 'CK', dial: '+682', name: { de: "Cookinseln", en: "Cook Islands", tr: "Cook Adaları" }, demonym: { de: "Cookinseln", en: "Cook Islands", tr: "Cook Adalı" } },
  { code: 'CL', dial: '+56', name: { de: "Chile", en: "Chile", tr: "Şili" }, demonym: { de: "Chilenisch", en: "Chilean", tr: "Şilili" } },
  { code: 'CM', dial: '+237', name: { de: "Kamerun", en: "Cameroon", tr: "Kamerun" }, demonym: { de: "Kamerunisch", en: "Cameroonian", tr: "Kamerunlu" } },
  { code: 'CN', dial: '+86', name: { de: "China", en: "People's Republic of China", tr: "Çin" }, demonym: { de: "Chinesisch", en: "Chinese", tr: "Çinli" } },
  { code: 'CO', dial: '+57', name: { de: "Kolumbien", en: "Colombia", tr: "Kolombiya" }, demonym: { de: "Kolumbianisch", en: "Colombian", tr: "Kolombiyalı" } },
  { code: 'CR', dial: '+506', name: { de: "Costa Rica", en: "Costa Rica", tr: "Kosta Rika" }, demonym: { de: "Costa-Ricanisch", en: "Costa Rican", tr: "Kosta Rikalı" } },
  { code: 'CU', dial: '+53', name: { de: "Kuba", en: "Cuba", tr: "Küba" }, demonym: { de: "Kubanisch", en: "Cuban", tr: "Kübalı" } },
  { code: 'CV', dial: '+238', name: { de: "Kap Verde", en: "Cape Verde", tr: "Cape Verde" }, demonym: { de: "Kapverdisch", en: "Cape Verdean", tr: "Yeşil Burunlu" } },
  { code: 'CW', dial: '+599', name: { de: "Curaçao", en: "Curaçao", tr: "Curaçao" }, demonym: { de: "Curaçao", en: "Curaçao", tr: "Curaçaolu" } },
  { code: 'CX', dial: '+61', name: { de: "Weihnachtsinsel", en: "Christmas Island", tr: "Christmas Adası" }, demonym: { de: "Weihnachtsinsel", en: "Christmas Island", tr: "Christmas Adalı" } },
  { code: 'CY', dial: '+357', name: { de: "Zypern", en: "Cyprus", tr: "Güney Kıbrıs Rum Kesimi" }, demonym: { de: "Zyprisch", en: "Cypriot", tr: "Kıbrıslı" } },
  { code: 'CZ', dial: '+420', name: { de: "Tschechische Republik", en: "Czech Republic", tr: "Çek Cumhuriyeti" }, demonym: { de: "Tschechisch", en: "Czech", tr: "Çek" } },
  { code: 'DE', dial: '+49', name: { de: "Deutschland", en: "Germany", tr: "Almanya" }, demonym: { de: "Deutsch", en: "German", tr: "Alman" } },
  { code: 'DJ', dial: '+253', name: { de: "Dschibuti", en: "Djibouti", tr: "Cibuti" }, demonym: { de: "Dschibutisch", en: "Djibouti", tr: "Cibutili" } },
  { code: 'DK', dial: '+45', name: { de: "Dänemark", en: "Denmark", tr: "Danimarka" }, demonym: { de: "Dänisch", en: "Danish", tr: "Danimarkalı" } },
  { code: 'DM', dial: '+1', name: { de: "Dominica", en: "Dominica", tr: "Dominika" }, demonym: { de: "Dominicanisch (Dominica)", en: "Dominican (Dominica)", tr: "Dominikalı" } },
  { code: 'DO', dial: '+1', name: { de: "Dominikanische Republik", en: "Dominican Republic", tr: "Dominik Cumhuriyeti" }, demonym: { de: "Dominikanisch (Dominikanische Republik)", en: "Dominican (Dominican Republic)", tr: "Dominikli" } },
  { code: 'DZ', dial: '+213', name: { de: "Algerien", en: "Algeria", tr: "Cezayir" }, demonym: { de: "Algerisch", en: "Algerian", tr: "Cezayirli" } },
  { code: 'EC', dial: '+593', name: { de: "Ecuador", en: "Ecuador", tr: "Ekvador" }, demonym: { de: "Ecuadorianisch", en: "Ecuadorean", tr: "Ekvadorlu" } },
  { code: 'EE', dial: '+372', name: { de: "Estland", en: "Estonia", tr: "Estonya" }, demonym: { de: "Estnisch", en: "Estonian", tr: "Estonyalı" } },
  { code: 'EG', dial: '+20', name: { de: "Ägypten", en: "Egypt", tr: "Mısır" }, demonym: { de: "Ägyptisch", en: "Egyptian", tr: "Mısırlı" } },
  { code: 'EH', dial: '+212', name: { de: "Westsahara", en: "Western Sahara", tr: "Batı Sahara" }, demonym: { de: "Westsahara", en: "Western Sahara", tr: "Sahralı" } },
  { code: 'ER', dial: '+291', name: { de: "Eritrea", en: "Eritrea", tr: "Eritre" }, demonym: { de: "Eritreisch", en: "Eritrean", tr: "Eritreli" } },
  { code: 'ES', dial: '+34', name: { de: "Spanien", en: "Spain", tr: "İspanya" }, demonym: { de: "Spanisch", en: "Spanish", tr: "İspanyol" } },
  { code: 'ET', dial: '+251', name: { de: "Äthiopien", en: "Ethiopia", tr: "Etiyopya" }, demonym: { de: "Äthiopisch", en: "Ethiopian", tr: "Etiyopyalı" } },
  { code: 'FI', dial: '+358', name: { de: "Finnland", en: "Finland", tr: "Finlandiya" }, demonym: { de: "Finnisch", en: "Finnish", tr: "Finli" } },
  { code: 'FJ', dial: '+679', name: { de: "Fidschi", en: "Fiji", tr: "Fiji" }, demonym: { de: "Fidschianisch", en: "Fijian", tr: "Fijili" } },
  { code: 'FK', dial: '+500', name: { de: "Falklandinseln", en: "Falkland Islands (Malvinas)", tr: "Falkland Adaları" }, demonym: { de: "Falklandinseln", en: "Falkland Islands (Malvinas)", tr: "Falklandlı" } },
  { code: 'FM', dial: '+691', name: { de: "Mikronesien", en: "Micronesia, Federated States of", tr: "Mikronezya" }, demonym: { de: "Mikronesisch", en: "Micronesian", tr: "Mikronezyalı" } },
  { code: 'FO', dial: '+298', name: { de: "Färöer", en: "Faroe Islands", tr: "Faroe Adaları" }, demonym: { de: "Färöer", en: "Faroe Islands", tr: "Faroe Adalı" } },
  { code: 'FR', dial: '+33', name: { de: "Frankreich", en: "France", tr: "Fransa" }, demonym: { de: "Französisch", en: "French", tr: "Fransız" } },
  { code: 'GA', dial: '+241', name: { de: "Gabun", en: "Gabon", tr: "Gabon" }, demonym: { de: "Gabunisch", en: "Gabonese", tr: "Gabonlu" } },
  { code: 'GB', dial: '+44', name: { de: "Vereinigtes Königreich", en: "United Kingdom", tr: "Birleşik Krallık" }, demonym: { de: "Britisch", en: "British", tr: "Britanyalı" } },
  { code: 'GD', dial: '+1', name: { de: "Grenada", en: "Grenada", tr: "Grenada" }, demonym: { de: "Grenadisch", en: "Grenadian", tr: "Grenadalı" } },
  { code: 'GE', dial: '+995', name: { de: "Georgien", en: "Georgia", tr: "Gürcistan" }, demonym: { de: "Georgisch", en: "Georgian", tr: "Gürcü" } },
  { code: 'GF', dial: '+594', name: { de: "Französisch-Guayana", en: "French Guiana", tr: "Fransız Guyanası" }, demonym: { de: "Französisch-Guayana", en: "French (French Guiana)", tr: "Fransız Guyanalı" } },
  { code: 'GG', dial: '+44', name: { de: "Guernsey", en: "Guernsey", tr: "Guernsey" }, demonym: { de: "Guernsey", en: "Guernsey", tr: "Guernseyli" } },
  { code: 'GH', dial: '+233', name: { de: "Ghana", en: "Ghana", tr: "Gana" }, demonym: { de: "Ghanaisch", en: "Ghanaian", tr: "Ganalı" } },
  { code: 'GI', dial: '+350', name: { de: "Gibraltar", en: "Gibraltar", tr: "Cebelitarık" }, demonym: { de: "Gibraltar", en: "Gibraltar", tr: "Cebelitarıklı" } },
  { code: 'GL', dial: '+299', name: { de: "Grönland", en: "Greenland", tr: "Grönland" }, demonym: { de: "Grönländisch", en: "Greenland", tr: "Grönlandlı" } },
  { code: 'GM', dial: '+220', name: { de: "Gambia", en: "Republic of The Gambia", tr: "Gambiya" }, demonym: { de: "Gambisch", en: "Gambian", tr: "Gambiyalı" } },
  { code: 'GN', dial: '+224', name: { de: "Guinea", en: "Guinea", tr: "Gine" }, demonym: { de: "Guineisch", en: "Guinean", tr: "Gineli" } },
  { code: 'GP', dial: '+590', name: { de: "Guadeloupe", en: "Guadeloupe", tr: "Guadalupe" }, demonym: { de: "Guadeloupe", en: "Guadeloupe", tr: "Guadaluplu" } },
  { code: 'GQ', dial: '+240', name: { de: "Äquatorialguinea", en: "Equatorial Guinea", tr: "Ekvator Ginesi" }, demonym: { de: "Äquatorial-Guineisch", en: "Equatorial Guinean", tr: "Ekvator Gineli" } },
  { code: 'GR', dial: '+30', name: { de: "Griechenland", en: "Greece", tr: "Yunanistan" }, demonym: { de: "Griechisch", en: "Greek", tr: "Yunan" } },
  { code: 'GS', dial: '+500', name: { de: "Südgeorgien und die Südlichen Sandwichinseln", en: "South Georgia and the South Sandwich Islands", tr: "Güney Georgia ve Güney Sandwich Adaları" }, demonym: { de: "Südgeorgien und die Südlichen Sandwichinseln", en: "South Georgia and the South Sandwich Islands", tr: "Güney Georgialı" } },
  { code: 'GT', dial: '+502', name: { de: "Guatemala", en: "Guatemala", tr: "Guatemala" }, demonym: { de: "Guatemaltekisch", en: "Guatemalan", tr: "Guatemalalı" } },
  { code: 'GU', dial: '+1', name: { de: "Guam", en: "Guam", tr: "Guam" }, demonym: { de: "Guamisch", en: "Guam", tr: "Guamlı" } },
  { code: 'GW', dial: '+245', name: { de: "Guinea-Bissau", en: "Guinea-Bissau", tr: "Gine-Bissau" }, demonym: { de: "Guinea-Bissauisch", en: "Guinea-Bissauan", tr: "Gine-Bissaulu" } },
  { code: 'GY', dial: '+592', name: { de: "Guyana", en: "Guyana", tr: "Guyana" }, demonym: { de: "Guyanisch", en: "Guyanese", tr: "Guyanalı" } },
  { code: 'HK', dial: '+852', name: { de: "Hongkong", en: "Hong Kong", tr: "Çin Hong Kong ÖYB" }, demonym: { de: "Hongkong", en: "Hong Kong", tr: "Hong Konglu" } },
  { code: 'HM', dial: '', name: { de: "Heard und McDonaldinseln", en: "Heard Island and McDonald Islands", tr: "Heard Adası ve McDonald Adaları" }, demonym: { de: "Heard und McDonaldinseln", en: "Heard Island and Mcdonald Islands", tr: "Heard Adalı" } },
  { code: 'HN', dial: '+504', name: { de: "Honduras", en: "Honduras", tr: "Honduras" }, demonym: { de: "Honduranisch", en: "Honduran", tr: "Honduraslı" } },
  { code: 'HR', dial: '+385', name: { de: "Kroatien", en: "Croatia", tr: "Hırvatistan" }, demonym: { de: "Kroatisch", en: "Croatian", tr: "Hırvat" } },
  { code: 'HT', dial: '+509', name: { de: "Haiti", en: "Haiti", tr: "Haiti" }, demonym: { de: "Haitianisch", en: "Haitian", tr: "Haitili" } },
  { code: 'HU', dial: '+36', name: { de: "Ungarn", en: "Hungary", tr: "Macaristan" }, demonym: { de: "Ungarisch", en: "Hungarian", tr: "Macar" } },
  { code: 'ID', dial: '+62', name: { de: "Indonesien", en: "Indonesia", tr: "Endonezya" }, demonym: { de: "Indonesisch", en: "Indonesian", tr: "Endonezyalı" } },
  { code: 'IE', dial: '+353', name: { de: "Irland", en: "Ireland", tr: "İrlanda" }, demonym: { de: "Irisch", en: "Irish", tr: "İrlandalı" } },
  { code: 'IL', dial: '+972', name: { de: "Israel", en: "Israel", tr: "İsrail" }, demonym: { de: "Israelisch", en: "Israeli", tr: "İsrailli" } },
  { code: 'IM', dial: '+44', name: { de: "Insel Man", en: "Isle of Man", tr: "Man Adası" }, demonym: { de: "Man (Isle of Man)", en: "Manx", tr: "Man Adalı" } },
  { code: 'IN', dial: '+91', name: { de: "Indien", en: "India", tr: "Hindistan" }, demonym: { de: "Indisch", en: "Indian", tr: "Hintli" } },
  { code: 'IO', dial: '+246', name: { de: "Britisches Territorium im Indischen Ozean", en: "British Indian Ocean Territory", tr: "Britanya Hint Okyanusu Toprakları" }, demonym: { de: "Britisches Territorium im Indischen Ozean", en: "British Indian Ocean Territory", tr: "Britanya Hint Okyanuslu" } },
  { code: 'IQ', dial: '+964', name: { de: "Irak", en: "Iraq", tr: "Irak" }, demonym: { de: "Irakisch", en: "Iraqi", tr: "Iraklı" } },
  { code: 'IR', dial: '+98', name: { de: "Iran", en: "Islamic Republic of Iran", tr: "İran" }, demonym: { de: "Iranisch", en: "Iranian", tr: "İranlı" } },
  { code: 'IS', dial: '+354', name: { de: "Island", en: "Iceland", tr: "İzlanda" }, demonym: { de: "Isländisch", en: "Icelandic", tr: "İzlandalı" } },
  { code: 'IT', dial: '+39', name: { de: "Italien", en: "Italy", tr: "İtalya" }, demonym: { de: "Italienisch", en: "Italian", tr: "İtalyan" } },
  { code: 'JE', dial: '+44', name: { de: "Jersey", en: "Jersey", tr: "Jersey" }, demonym: { de: "Jersey", en: "Jersey", tr: "Jerseyli" } },
  { code: 'JM', dial: '+1', name: { de: "Jamaika", en: "Jamaica", tr: "Jamaika" }, demonym: { de: "Jamaikanisch", en: "Jamaican", tr: "Jamaikalı" } },
  { code: 'JO', dial: '+962', name: { de: "Jordanien", en: "Jordan", tr: "Ürdün" }, demonym: { de: "Jordanisch", en: "Jordanian", tr: "Ürdünlü" } },
  { code: 'JP', dial: '+81', name: { de: "Japan", en: "Japan", tr: "Japonya" }, demonym: { de: "Japanisch", en: "Japanese", tr: "Japon" } },
  { code: 'KE', dial: '+254', name: { de: "Kenia", en: "Kenya", tr: "Kenya" }, demonym: { de: "Kenianisch", en: "Kenyan", tr: "Kenyalı" } },
  { code: 'KG', dial: '+996', name: { de: "Kirgisistan", en: "Kyrgyzstan", tr: "Kırgızistan" }, demonym: { de: "Kirgisisch", en: "Kyrgyz", tr: "Kırgız" } },
  { code: 'KH', dial: '+855', name: { de: "Kambodscha", en: "Cambodia", tr: "Kamboçya" }, demonym: { de: "Kambodschanisch", en: "Cambodian", tr: "Kamboçyalı" } },
  { code: 'KI', dial: '+686', name: { de: "Kiribati", en: "Kiribati", tr: "Kiribati" }, demonym: { de: "Kiribatisch", en: "I-Kiribati", tr: "Kiribatili" } },
  { code: 'KM', dial: '+269', name: { de: "Komoren", en: "Comoros", tr: "Komorlar" }, demonym: { de: "Komorisch", en: "Comoran", tr: "Komorlu" } },
  { code: 'KN', dial: '+1', name: { de: "St. Kitts und Nevis", en: "Saint Kitts and Nevis", tr: "Saint Kitts ve Nevis" }, demonym: { de: "St. Kitts und Nevis", en: "Kittian and Nevisian", tr: "Saint Kitts ve Nevisli" } },
  { code: 'KP', dial: '+850', name: { de: "Nordkorea", en: "North Korea", tr: "Kuzey Kore" }, demonym: { de: "Nordkoreanisch", en: "North Korean", tr: "Kuzey Koreli" } },
  { code: 'KR', dial: '+82', name: { de: "Südkorea", en: "South Korea", tr: "Güney Kore" }, demonym: { de: "Südkoreanisch", en: "South Korean", tr: "Güney Koreli" } },
  { code: 'KW', dial: '+965', name: { de: "Kuwait", en: "Kuwait", tr: "Kuveyt" }, demonym: { de: "Kuwaitisch", en: "Kuwaiti", tr: "Kuveytli" } },
  { code: 'KY', dial: '+1', name: { de: "Kaimaninseln", en: "Cayman Islands", tr: "Cayman Adaları" }, demonym: { de: "Kaimaninseln", en: "Cayman Islands", tr: "Caymanlı" } },
  { code: 'KZ', dial: '+7', name: { de: "Kasachstan", en: "Kazakhstan", tr: "Kazakistan" }, demonym: { de: "Kasachisch", en: "Kazakhstani", tr: "Kazak" } },
  { code: 'LA', dial: '+856', name: { de: "Laos", en: "Lao People's Democratic Republic", tr: "Laos" }, demonym: { de: "Laotisch", en: "Laotian", tr: "Laoslu" } },
  { code: 'LB', dial: '+961', name: { de: "Libanon", en: "Lebanon", tr: "Lübnan" }, demonym: { de: "Libanesisch", en: "Lebanese", tr: "Lübnanlı" } },
  { code: 'LC', dial: '+1', name: { de: "St. Lucia", en: "Saint Lucia", tr: "Saint Lucia" }, demonym: { de: "Lucianisch", en: "Saint Lucian", tr: "Saint Lucialı" } },
  { code: 'LI', dial: '+423', name: { de: "Liechtenstein", en: "Liechtenstein", tr: "Liechtenstein" }, demonym: { de: "Liechtensteinisch", en: "Liechtensteiner", tr: "Lihtenştaynlı" } },
  { code: 'LK', dial: '+94', name: { de: "Sri Lanka", en: "Sri Lanka", tr: "Sri Lanka" }, demonym: { de: "Sri-Lankisch", en: "Sri Lankan", tr: "Sri Lankalı" } },
  { code: 'LR', dial: '+231', name: { de: "Liberia", en: "Liberia", tr: "Liberya" }, demonym: { de: "Liberianisch", en: "Liberian", tr: "Liberyalı" } },
  { code: 'LS', dial: '+266', name: { de: "Lesotho", en: "Lesotho", tr: "Lesoto" }, demonym: { de: "Lesothisch", en: "Mosotho", tr: "Lesotolu" } },
  { code: 'LT', dial: '+370', name: { de: "Litauen", en: "Lithuania", tr: "Litvanya" }, demonym: { de: "Litauisch", en: "Lithuanian", tr: "Litvanyalı" } },
  { code: 'LU', dial: '+352', name: { de: "Luxemburg", en: "Luxembourg", tr: "Lüksemburg" }, demonym: { de: "Luxemburgisch", en: "Luxembourger", tr: "Lüksemburglu" } },
  { code: 'LV', dial: '+371', name: { de: "Lettland", en: "Latvia", tr: "Letonya" }, demonym: { de: "Lettisch", en: "Latvian", tr: "Letonyalı" } },
  { code: 'LY', dial: '+218', name: { de: "Libyen", en: "Libya", tr: "Libya" }, demonym: { de: "Libysch", en: "Libyan", tr: "Libyalı" } },
  { code: 'MA', dial: '+212', name: { de: "Marokko", en: "Morocco", tr: "Fas" }, demonym: { de: "Marokkanisch", en: "Moroccan", tr: "Faslı" } },
  { code: 'MC', dial: '+377', name: { de: "Monaco", en: "Monaco", tr: "Monako" }, demonym: { de: "Monegassisch", en: "Monacan", tr: "Monakolu" } },
  { code: 'MD', dial: '+373', name: { de: "Moldawien", en: "Moldova, Republic of", tr: "Moldova" }, demonym: { de: "Moldawisch", en: "Moldovan", tr: "Moldovalı" } },
  { code: 'ME', dial: '+382', name: { de: "Montenegro", en: "Montenegro", tr: "Karadağ" }, demonym: { de: "Montenegrinisch", en: "Montenegrin", tr: "Karadağlı" } },
  { code: 'MF', dial: '+590', name: { de: "Saint-Martin", en: "Saint Martin (French part)", tr: "Saint Martin" }, demonym: { de: "Saint-Martin", en: "Saint Martin (French part)", tr: "Saint Martinli" } },
  { code: 'MG', dial: '+261', name: { de: "Madagaskar", en: "Madagascar", tr: "Madagaskar" }, demonym: { de: "Madagassisch", en: "Malagasy", tr: "Madagaskarlı" } },
  { code: 'MH', dial: '+692', name: { de: "Marshallinseln", en: "Marshall Islands", tr: "Marshall Adaları" }, demonym: { de: "Marshallisch", en: "Marshallese", tr: "Marshallı" } },
  { code: 'MK', dial: '+389', name: { de: "Nordmazedonien", en: "The Republic of North Macedonia", tr: "Kuzey Makedonya" }, demonym: { de: "Mazedonisch", en: "Macedonian", tr: "Kuzey Makedonyalı" } },
  { code: 'ML', dial: '+223', name: { de: "Mali", en: "Mali", tr: "Mali" }, demonym: { de: "Malisch", en: "Malian", tr: "Malili" } },
  { code: 'MM', dial: '+95', name: { de: "Myanmar", en: "Myanmar", tr: "Myanmar (Burma)" }, demonym: { de: "Myanmarisch", en: "Burmese", tr: "Myanmarlı" } },
  { code: 'MN', dial: '+976', name: { de: "Mongolei", en: "Mongolia", tr: "Moğolistan" }, demonym: { de: "Mongolisch", en: "Mongolian", tr: "Moğol" } },
  { code: 'MO', dial: '+853', name: { de: "Macao", en: "Macao", tr: "Çin Makao ÖYB" }, demonym: { de: "Macau", en: "Macao", tr: "Makaolu" } },
  { code: 'MP', dial: '+1', name: { de: "Nördliche Marianen", en: "Northern Mariana Islands", tr: "Kuzey Mariana Adaları" }, demonym: { de: "Nördliche Marianen", en: "Northern Mariana Islands", tr: "Kuzey Marianlı" } },
  { code: 'MQ', dial: '+596', name: { de: "Martinique", en: "Martinique", tr: "Martinik" }, demonym: { de: "Martinique", en: "Martinique", tr: "Martinikli" } },
  { code: 'MR', dial: '+222', name: { de: "Mauretanien", en: "Mauritania", tr: "Moritanya" }, demonym: { de: "Mauretanisch", en: "Mauritanian", tr: "Moritanyalı" } },
  { code: 'MS', dial: '+1', name: { de: "Montserrat", en: "Montserrat", tr: "Montserrat" }, demonym: { de: "Montserrat", en: "Montserrat", tr: "Montserratlı" } },
  { code: 'MT', dial: '+356', name: { de: "Malta", en: "Malta", tr: "Malta" }, demonym: { de: "Maltesisch", en: "Maltese", tr: "Maltalı" } },
  { code: 'MU', dial: '+230', name: { de: "Mauritius", en: "Mauritius", tr: "Mauritius" }, demonym: { de: "Mauritisch", en: "Mauritian", tr: "Mauritiuslu" } },
  { code: 'MV', dial: '+960', name: { de: "Malediven", en: "Maldives", tr: "Maldivler" }, demonym: { de: "Maledivisch", en: "Maldivan", tr: "Maldivli" } },
  { code: 'MW', dial: '+265', name: { de: "Malawi", en: "Malawi", tr: "Malavi" }, demonym: { de: "Malawisch", en: "Malawian", tr: "Malavili" } },
  { code: 'MX', dial: '+52', name: { de: "Mexiko", en: "Mexico", tr: "Meksika" }, demonym: { de: "Mexikanisch", en: "Mexican", tr: "Meksikalı" } },
  { code: 'MY', dial: '+60', name: { de: "Malaysia", en: "Malaysia", tr: "Malezya" }, demonym: { de: "Malaysisch", en: "Malaysian", tr: "Malezyalı" } },
  { code: 'MZ', dial: '+258', name: { de: "Mosambik", en: "Mozambique", tr: "Mozambik" }, demonym: { de: "Mosambikanisch", en: "Mozambican", tr: "Mozambikli" } },
  { code: 'NA', dial: '+264', name: { de: "Namibia", en: "Namibia", tr: "Namibya" }, demonym: { de: "Namibisch", en: "Namibian", tr: "Namibyalı" } },
  { code: 'NC', dial: '+687', name: { de: "Neukaledonien", en: "New Caledonia", tr: "Yeni Kaledonya" }, demonym: { de: "Neukaledonien", en: "New Caledonia", tr: "Yeni Kaledonyalı" } },
  { code: 'NE', dial: '+227', name: { de: "Niger", en: "Niger", tr: "Nijer" }, demonym: { de: "Nigerianisch (Niger)", en: "Nigerien", tr: "Nijerli" } },
  { code: 'NF', dial: '+672', name: { de: "Norfolkinsel", en: "Norfolk Island", tr: "Norfolk Adası" }, demonym: { de: "Norfolkinsel", en: "Norfolk Island", tr: "Norfolk Adalı" } },
  { code: 'NG', dial: '+234', name: { de: "Nigeria", en: "Nigeria", tr: "Nijerya" }, demonym: { de: "Nigerianisch (Nigeria)", en: "Nigerian", tr: "Nijeryalı" } },
  { code: 'NI', dial: '+505', name: { de: "Nicaragua", en: "Nicaragua", tr: "Nikaragua" }, demonym: { de: "Nicaraguanisch", en: "Nicaraguan", tr: "Nikaragualı" } },
  { code: 'NL', dial: '+31', name: { de: "Niederlande", en: "Netherlands", tr: "Hollanda" }, demonym: { de: "Niederländisch", en: "Dutch", tr: "Hollandalı" } },
  { code: 'NO', dial: '+47', name: { de: "Norwegen", en: "Norway", tr: "Norveç" }, demonym: { de: "Norwegisch", en: "Norwegian", tr: "Norveçli" } },
  { code: 'NP', dial: '+977', name: { de: "Nepal", en: "Nepal", tr: "Nepal" }, demonym: { de: "Nepalesisch", en: "Nepalese", tr: "Nepalli" } },
  { code: 'NR', dial: '+674', name: { de: "Nauru", en: "Nauru", tr: "Nauru" }, demonym: { de: "Nauruisch", en: "Nauruan", tr: "Naurulu" } },
  { code: 'NU', dial: '+683', name: { de: "Niue", en: "Niue", tr: "Niue" }, demonym: { de: "Niueanisch", en: "Niue", tr: "Niuelli" } },
  { code: 'NZ', dial: '+64', name: { de: "Neuseeland", en: "New Zealand", tr: "Yeni Zelanda" }, demonym: { de: "Neuseelandneuseeländisch", en: "New Zealander", tr: "Yeni Zelandalı" } },
  { code: 'OM', dial: '+968', name: { de: "Oman", en: "Oman", tr: "Umman" }, demonym: { de: "Omanisch", en: "Omani", tr: "Ummanlı" } },
  { code: 'PA', dial: '+507', name: { de: "Panama", en: "Panama", tr: "Panama" }, demonym: { de: "Panamaisch", en: "Panamanian", tr: "Panamalı" } },
  { code: 'PE', dial: '+51', name: { de: "Peru", en: "Peru", tr: "Peru" }, demonym: { de: "Peruanisch", en: "Peruvian", tr: "Perulu" } },
  { code: 'PF', dial: '+689', name: { de: "Französisch-Polynesien", en: "French Polynesia", tr: "Fransız Polinezyası" }, demonym: { de: "Französisch-Polynesien", en: "French (French Polynesia)", tr: "Fransız Polinezyalı" } },
  { code: 'PG', dial: '+675', name: { de: "Papua-Neuguinea", en: "Papua New Guinea", tr: "Papua Yeni Gine" }, demonym: { de: "Papua-Neuguienisch", en: "Papua New Guinea", tr: "Papua Yeni Gineli" } },
  { code: 'PH', dial: '+63', name: { de: "Philippinen", en: "Philippines", tr: "Filipinler" }, demonym: { de: "Philippinisch", en: "Filipino", tr: "Filipinli" } },
  { code: 'PK', dial: '+92', name: { de: "Pakistan", en: "Pakistan", tr: "Pakistan" }, demonym: { de: "Pakistanisch", en: "Pakistani", tr: "Pakistanlı" } },
  { code: 'PL', dial: '+48', name: { de: "Polen", en: "Poland", tr: "Polonya" }, demonym: { de: "Polnisch", en: "Polish", tr: "Polonyalı" } },
  { code: 'PM', dial: '+508', name: { de: "Saint-Pierre und Miquelon", en: "Saint Pierre and Miquelon", tr: "Saint Pierre ve Miquelon" }, demonym: { de: "St. Pierre und Miquelon", en: "Saint Pierre and Miquelon", tr: "Saint Pierre ve Miquelonlu" } },
  { code: 'PN', dial: '+64', name: { de: "Pitcairninseln", en: "Pitcairn", tr: "Pitcairn Adaları" }, demonym: { de: "Pitcairninseln", en: "Pitcairn", tr: "Pitcairnlı" } },
  { code: 'PR', dial: '+1', name: { de: "Puerto Rico", en: "Puerto Rico", tr: "Porto Riko" }, demonym: { de: "Puerto-Ricanisch", en: "Puerto Rico", tr: "Porto Rikolu" } },
  { code: 'PS', dial: '+970', name: { de: "Staat Palästina", en: "State of Palestine", tr: "Filistin Bölgeleri" }, demonym: { de: "Palästinensisch", en: "Palestinian", tr: "Filistinli" } },
  { code: 'PT', dial: '+351', name: { de: "Portugal", en: "Portugal", tr: "Portekiz" }, demonym: { de: "Portugiesisch", en: "Portuguese", tr: "Portekizli" } },
  { code: 'PW', dial: '+680', name: { de: "Palau", en: "Palau", tr: "Palau" }, demonym: { de: "Palauisch", en: "Palauan", tr: "Palaulu" } },
  { code: 'PY', dial: '+595', name: { de: "Paraguay", en: "Paraguay", tr: "Paraguay" }, demonym: { de: "Paraguayisch", en: "Paraguayan", tr: "Paraguaylı" } },
  { code: 'QA', dial: '+974', name: { de: "Katar", en: "Qatar", tr: "Katar" }, demonym: { de: "Katarisch", en: "Qatari", tr: "Katarlı" } },
  { code: 'RE', dial: '+262', name: { de: "Réunion", en: "Reunion", tr: "Réunion" }, demonym: { de: "Réunion", en: "Reunion", tr: "Réunionlu" } },
  { code: 'RO', dial: '+40', name: { de: "Rumänien", en: "Romania", tr: "Romanya" }, demonym: { de: "Rumänisch", en: "Romanian", tr: "Romen" } },
  { code: 'RS', dial: '+381', name: { de: "Serbien", en: "Serbia", tr: "Sırbistan" }, demonym: { de: "Serbisch", en: "Serbian", tr: "Sırp" } },
  { code: 'RU', dial: '+7', name: { de: "Russische Föderation", en: "Russian Federation", tr: "Rusya" }, demonym: { de: "Russisch", en: "Russian", tr: "Rus" } },
  { code: 'RW', dial: '+250', name: { de: "Ruanda", en: "Rwanda", tr: "Ruanda" }, demonym: { de: "Ruandisch", en: "Rwandan", tr: "Ruandalı" } },
  { code: 'SA', dial: '+966', name: { de: "Saudi-Arabien", en: "Saudi Arabia", tr: "Suudi Arabistan" }, demonym: { de: "Saudi-Arabisch", en: "Saudi", tr: "Suudi" } },
  { code: 'SB', dial: '+677', name: { de: "Salomonen", en: "Solomon Islands", tr: "Solomon Adaları" }, demonym: { de: "Salomonisch", en: "Solomon Islander", tr: "Solomonlu" } },
  { code: 'SC', dial: '+248', name: { de: "Seychellen", en: "Seychelles", tr: "Seyşeller" }, demonym: { de: "Seychellisch", en: "Seychellois", tr: "Seyşelli" } },
  { code: 'SD', dial: '+249', name: { de: "Sudan", en: "Sudan", tr: "Sudan" }, demonym: { de: "Sudanesisch", en: "Sudanese", tr: "Sudanlı" } },
  { code: 'SE', dial: '+46', name: { de: "Schweden", en: "Sweden", tr: "İsveç" }, demonym: { de: "Schwedisch", en: "Swedish", tr: "İsveçli" } },
  { code: 'SG', dial: '+65', name: { de: "Singapur", en: "Singapore", tr: "Singapur" }, demonym: { de: "Singapurisch", en: "Singaporean", tr: "Singapurlu" } },
  { code: 'SH', dial: '+290', name: { de: "St. Helena", en: "Saint Helena", tr: "Saint Helena" }, demonym: { de: "St.Helena", en: "Saint Helena", tr: "Saint Helenalı" } },
  { code: 'SI', dial: '+386', name: { de: "Slowenien", en: "Slovenia", tr: "Slovenya" }, demonym: { de: "Slowenisch", en: "Slovenian", tr: "Sloven" } },
  { code: 'SJ', dial: '+47', name: { de: "Svalbard und Jan Mayen", en: "Svalbard and Jan Mayen", tr: "Svalbard ve Jan Mayen Adaları" }, demonym: { de: "Jan Mayen", en: "Svalbard and Jan Mayen", tr: "Svalbardlı" } },
  { code: 'SK', dial: '+421', name: { de: "Slowakei", en: "Slovakia", tr: "Slovakya" }, demonym: { de: "Slowakisch", en: "Slovakian", tr: "Slovak" } },
  { code: 'SL', dial: '+232', name: { de: "Sierra Leone", en: "Sierra Leone", tr: "Sierra Leone" }, demonym: { de: "Sierra-Leonisch", en: "Sierra Leonean", tr: "Sierra Leoneli" } },
  { code: 'SM', dial: '+378', name: { de: "San Marino", en: "San Marino", tr: "San Marino" }, demonym: { de: "San-Marinesisch", en: "San Marinese", tr: "San Marinolu" } },
  { code: 'SN', dial: '+221', name: { de: "Senegal", en: "Senegal", tr: "Senegal" }, demonym: { de: "Senegalesisch", en: "Senegalese", tr: "Senegalli" } },
  { code: 'SO', dial: '+252', name: { de: "Somalia", en: "Somalia", tr: "Somali" }, demonym: { de: "Somalisch", en: "Somali", tr: "Somalili" } },
  { code: 'SR', dial: '+597', name: { de: "Suriname", en: "Suriname", tr: "Surinam" }, demonym: { de: "Surinamisch", en: "Surinamer", tr: "Surinamlı" } },
  { code: 'SS', dial: '+211', name: { de: "Südsudan", en: "South Sudan", tr: "Güney Sudan" }, demonym: { de: "Südsudanesisch", en: "South Sudan", tr: "Güney Sudanlı" } },
  { code: 'ST', dial: '+239', name: { de: "São Tomé und Príncipe", en: "Sao Tome and Principe", tr: "São Tomé ve Príncipe" }, demonym: { de: "São-Toméisch", en: "Sao Tomean", tr: "São Toméli" } },
  { code: 'SV', dial: '+503', name: { de: "El Salvador", en: "El Salvador", tr: "El Salvador" }, demonym: { de: "Salvadorianisch", en: "Salvadoran", tr: "Salvadorlu" } },
  { code: 'SX', dial: '+1', name: { de: "Sint Maarten", en: "Sint Maarten (Dutch part)", tr: "Sint Maarten" }, demonym: { de: "Sint Maarten", en: "Sint Maarten (Dutch part)", tr: "Sint Maartenli" } },
  { code: 'SY', dial: '+963', name: { de: "Syrien, Arabische Republik", en: "Syrian Arab Republic", tr: "Suriye" }, demonym: { de: "Syrisch", en: "Syrian", tr: "Suriyeli" } },
  { code: 'SZ', dial: '+268', name: { de: "Eswatini", en: "Eswatini", tr: "Svaziland" }, demonym: { de: "Swasiländisch", en: "Swazi", tr: "Svazilandlı" } },
  { code: 'TC', dial: '+1', name: { de: "Turks- und Caicosinseln", en: "Turks and Caicos Islands", tr: "Turks ve Caicos Adaları" }, demonym: { de: "Turks- und Caicosinseln", en: "Turks and Caicos Islands", tr: "Turks ve Caicoslu" } },
  { code: 'TD', dial: '+235', name: { de: "Tschad", en: "Chad", tr: "Çad" }, demonym: { de: "Tschadisch", en: "Chadian", tr: "Çadlı" } },
  { code: 'TF', dial: '+262', name: { de: "Französische Süd- und Antarktisgebiete", en: "French Southern Territories", tr: "Fransız Güney Toprakları" }, demonym: { de: "Französische Süd- und Antarktisgebiete", en: "French (French Southern Territories)", tr: "Fransız Güney Topraklı" } },
  { code: 'TG', dial: '+228', name: { de: "Togo", en: "Togo", tr: "Togo" }, demonym: { de: "Togolesisch", en: "Togolese", tr: "Togolu" } },
  { code: 'TH', dial: '+66', name: { de: "Thailand", en: "Thailand", tr: "Tayland" }, demonym: { de: "Thailändisch", en: "Thai", tr: "Taylandlı" } },
  { code: 'TJ', dial: '+992', name: { de: "Tadschikistan", en: "Tajikistan", tr: "Tacikistan" }, demonym: { de: "Tadschikisch", en: "Tajik", tr: "Tacik" } },
  { code: 'TK', dial: '+690', name: { de: "Tokelau", en: "Tokelau", tr: "Tokelau" }, demonym: { de: "Tokelau", en: "Tokelau", tr: "Tokelaulu" } },
  { code: 'TL', dial: '+670', name: { de: "Osttimor", en: "Timor-Leste", tr: "Timor-Leste" }, demonym: { de: "Timoresisch", en: "East Timorese", tr: "Doğu Timorlu" } },
  { code: 'TM', dial: '+993', name: { de: "Turkmenistan", en: "Turkmenistan", tr: "Türkmenistan" }, demonym: { de: "Turkmenisch", en: "Turkmenistan", tr: "Türkmen" } },
  { code: 'TN', dial: '+216', name: { de: "Tunesien", en: "Tunisia", tr: "Tunus" }, demonym: { de: "Tunesisch", en: "Tunisian", tr: "Tunuslu" } },
  { code: 'TO', dial: '+676', name: { de: "Tonga", en: "Tonga", tr: "Tonga" }, demonym: { de: "Tongaisch", en: "Tongan", tr: "Tongalı" } },
  { code: 'TR', dial: '+90', name: { de: "Türkei", en: "Türkiye", tr: "Türkiye" }, demonym: { de: "Türkisch", en: "Turkish", tr: "Türk" } },
  { code: 'TT', dial: '+1', name: { de: "Trinidad und Tobago", en: "Trinidad and Tobago", tr: "Trinidad ve Tobago" }, demonym: { de: "Trinidad und Tobago", en: "Trinidadian or Tobagonian", tr: "Trinidad ve Tobagolu" } },
  { code: 'TV', dial: '+688', name: { de: "Tuvalu", en: "Tuvalu", tr: "Tuvalu" }, demonym: { de: "Tuvaluisch", en: "Tuvaluan", tr: "Tuvalulu" } },
  { code: 'TW', dial: '+886', name: { de: "Taiwan", en: "Taiwan, Province of China", tr: "Tayvan" }, demonym: { de: "Taiwanesisch", en: "Taiwanese", tr: "Tayvanlı" } },
  { code: 'TZ', dial: '+255', name: { de: "Tansania, Vereinigte Republik", en: "United Republic of Tanzania", tr: "Tanzanya" }, demonym: { de: "Tansanisch", en: "Tanzanian", tr: "Tanzanyalı" } },
  { code: 'UA', dial: '+380', name: { de: "Ukraine", en: "Ukraine", tr: "Ukrayna" }, demonym: { de: "Ukrainisch", en: "Ukrainian", tr: "Ukraynalı" } },
  { code: 'UG', dial: '+256', name: { de: "Uganda", en: "Uganda", tr: "Uganda" }, demonym: { de: "Ugandisch", en: "Ugandan", tr: "Ugandalı" } },
  { code: 'UM', dial: '', name: { de: "United States Minor Outlying Islands", en: "United States Minor Outlying Islands", tr: "ABD Uzak Adaları" }, demonym: { de: "United States Minor Outlying Islands", en: "United States Minor Outlying Islands", tr: "ABD Uzak Adalı" } },
  { code: 'US', dial: '+1', name: { de: "Vereinigte Staaten von Amerika", en: "United States of America", tr: "ABD" }, demonym: { de: "Amerikanisch", en: "American", tr: "Amerikalı" } },
  { code: 'UY', dial: '+598', name: { de: "Uruguay", en: "Uruguay", tr: "Uruguay" }, demonym: { de: "Uruguayisch", en: "Uruguayan", tr: "Uruguaylı" } },
  { code: 'UZ', dial: '+998', name: { de: "Usbekistan", en: "Uzbekistan", tr: "Özbekistan" }, demonym: { de: "Usbekisch", en: "Uzbekistani", tr: "Özbek" } },
  { code: 'VA', dial: '+39', name: { de: "Vatikanstadt", en: "Holy See (Vatican City State)", tr: "Vatikan" }, demonym: { de: "Vatikanisch", en: "Holy See (Vatican City State)", tr: "Vatikanlı" } },
  { code: 'VC', dial: '+1', name: { de: "St. Vincent und die Grenadinen", en: "Saint Vincent and the Grenadines", tr: "Saint Vincent ve Grenadinler" }, demonym: { de: "Vincentisch", en: "Saint Vincent and the Grenadines", tr: "Saint Vincentli" } },
  { code: 'VE', dial: '+58', name: { de: "Venezuela", en: "Venezuela", tr: "Venezuela" }, demonym: { de: "Venezolanisch", en: "Venezuelan", tr: "Venezuelalı" } },
  { code: 'VG', dial: '+1', name: { de: "Britische Jungferninseln", en: "Virgin Islands, British", tr: "Britanya Virjin Adaları" }, demonym: { de: "Britische Jungferninseln", en: "Virgin Islands, British", tr: "Britanya Virjinli" } },
  { code: 'VI', dial: '+1', name: { de: "Amerikanische Jungferninseln", en: "Virgin Islands, U.S.", tr: "ABD Virjin Adaları" }, demonym: { de: "Amerikanische Jungferninseln", en: "Virgin Islands, U.S.", tr: "ABD Virjinli" } },
  { code: 'VN', dial: '+84', name: { de: "Vietnam", en: "Vietnam", tr: "Vietnam" }, demonym: { de: "Vietnamesisch", en: "Vietnamese", tr: "Vietnamlı" } },
  { code: 'VU', dial: '+678', name: { de: "Vanuatu", en: "Vanuatu", tr: "Vanuatu" }, demonym: { de: "Vanuatisch", en: "Vanuatu", tr: "Vanuatulu" } },
  { code: 'WF', dial: '+681', name: { de: "Wallis und Futuna", en: "Wallis and Futuna", tr: "Wallis ve Futuna Adaları" }, demonym: { de: "Wallis und Futuna", en: "Welsh", tr: "Wallis ve Futunalı" } },
  { code: 'WS', dial: '+685', name: { de: "Samoa", en: "Samoa", tr: "Samoa" }, demonym: { de: "Samoanisch", en: "Samoan", tr: "Samoalı" } },
  { code: 'XK', dial: '+383', name: { de: "Kosovo", en: "Kosovo", tr: "Kosova" }, demonym: { de: "Kosovarisch", en: "Kosovar", tr: "Kosovalı" } },
  { code: 'YE', dial: '+967', name: { de: "Jemen", en: "Yemen", tr: "Yemen" }, demonym: { de: "Jemenitisch", en: "Yemenite", tr: "Yemenli" } },
  { code: 'YT', dial: '+262', name: { de: "Mayotte", en: "Mayotte", tr: "Mayotte" }, demonym: { de: "Mayotte", en: "Mayotte", tr: "Mayotteli" } },
  { code: 'ZA', dial: '+27', name: { de: "Südafrika", en: "South Africa", tr: "Güney Afrika" }, demonym: { de: "Südafrikanisch", en: "South African", tr: "Güney Afrikalı" } },
  { code: 'ZM', dial: '+260', name: { de: "Sambia", en: "Zambia", tr: "Zambiya" }, demonym: { de: "Sambisch", en: "Zambian", tr: "Zambiyalı" } },
  { code: 'ZW', dial: '+263', name: { de: "Simbabwe", en: "Zimbabwe", tr: "Zimbabve" }, demonym: { de: "Simbabwisch", en: "Zimbabwean", tr: "Zimbabveli" } },
];

/** Schnellzugriff auf Länder über ihren ISO-Code. */
const BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]));

/** Kompletter Ländereintrag zum ISO-Code oder undefined, wenn der Code unbekannt ist. */
export function countryRecord(code: string): CountryRecord | undefined {
  return BY_CODE.get(code);
}

/** Ländername in der gewünschten Sprache; leerer String bei unbekanntem Code. */
export function countryName(code: string, language: CvLanguage): string {
  return BY_CODE.get(code)?.name[language] ?? '';
}

/** Staatsangehörigkeit als Adjektiv (z. B. 'Deutsch', 'Türk') in der gewünschten Sprache; leer bei unbekanntem Code. */
export function nationalityAdjective(code: string, language: CvLanguage): string {
  return BY_CODE.get(code)?.demonym[language] ?? '';
}

/** Internationale Vorwahl des Landes (z. B. '+90'); leer bei unbekanntem Code. */
export function countryDial(code: string): string {
  return BY_CODE.get(code)?.dial ?? '';
}

/** Kopie aller Länder, alphabetisch nach dem Namen in der gewünschten Sprache sortiert – für Auswahllisten im Editor. */
export function countriesFor(language: CvLanguage): CountryRecord[] {
  return [...COUNTRIES].sort((left, right) => left.name[language].localeCompare(right.name[language], language));
}

/** Bevorzugtes Land für Vorwahlen, die sich mehrere Länder teilen (z. B. +1 für USA, Kanada und Karibikstaaten). */
const PREFERRED_DIAL: Record<string, string> = {
  '+1': 'US',
  '+7': 'RU',
  '+44': 'GB',
  '+47': 'NO',
  '+61': 'AU',
  '+212': 'MA',
  '+262': 'RE',
  '+358': 'FI',
  '+590': 'GP',
  '+599': 'CW',
};

/** Zusätzliche Schreibweisen von Staatsangehörigkeiten (bereits normalisiert wie durch fold), damit Freitext aus älteren Daten einem Land zugeordnet werden kann. */
const ADJECTIVES: Record<string, string> = {
  deutsch: 'DE',
  german: 'DE',
  alman: 'DE',
  tuerkisch: 'TR',
  turkisch: 'TR',
  turkish: 'TR',
  oesterreichisch: 'AT',
  osterreichisch: 'AT',
  schweizerisch: 'CH',
  schweizer: 'CH',
  franzoesisch: 'FR',
  franzosisch: 'FR',
  italienisch: 'IT',
  spanisch: 'ES',
  polnisch: 'PL',
  russisch: 'RU',
  ukrainisch: 'UA',
  amerikanisch: 'US',
  britisch: 'GB',
  griechisch: 'GR',
  niederlaendisch: 'NL',
  niederlandisch: 'NL',
  syrisch: 'SY',
  irakisch: 'IQ',
  iranisch: 'IR',
  afghanisch: 'AF',
  chinesisch: 'CN',
  japanisch: 'JP',
  indisch: 'IN',
  brasilianisch: 'BR',
  kanadisch: 'CA',
  australisch: 'AU',
};

/** Normalisiert Text für den Vergleich: getrimmt, kleingeschrieben, ohne Akzente und Umlautpunkte, ß als ss. */
function fold(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('de')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replaceAll('ß', 'ss');
}

/** Nachschlagetabelle: normalisierter Länder- oder Nationalitätsname (alle Sprachen) zum ISO-Code. */
const NAME_TO_CODE = new Map<string, string>();
for (const country of COUNTRIES) {
  for (const language of ['de', 'en', 'tr'] as const) {
    NAME_TO_CODE.set(fold(country.name[language]), country.code);
  }
}
for (const [alias, code] of Object.entries(ADJECTIVES)) {
  NAME_TO_CODE.set(alias, code);
}

/** ISO-Code zu einer Vorwahl wie '+49'; bei geteilten Vorwahlen gilt PREFERRED_DIAL, sonst das erste passende Land. Leer, wenn unbekannt. */
export function countryForDial(dial: string): string {
  return PREFERRED_DIAL[dial] ?? COUNTRIES.find((country) => country.dial === dial)?.code ?? '';
}

/** Ordnet Freitext (Ländername in de/en/tr oder gängige Nationalität) einem ISO-Code zu, z. B. beim Übernehmen alter Daten; leer, wenn nichts passt. */
export function matchCountry(value: string): string {
  return NAME_TO_CODE.get(fold(value)) ?? '';
}
