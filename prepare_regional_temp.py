"""
Generates data/regional-temp.json:
Per-country temperature anomalies (smoothed, 2025-2100, 3 SSPs)
keyed by ISO 3166-1 numeric code so they match the world-atlas topojson.
"""
import json, os, statistics

PROJ = os.path.dirname(os.path.abspath(__file__))

# Natural Earth name → ISO 3166-1 numeric (as string, zero-padded to 3 digits)
NAME_TO_ISO = {
    'Afghanistan': '004', 'Algeria': '012', 'Angola': '024',
    'Antarctica': '010', 'Argentina': '032', 'Armenia': '051',
    'Australia': '036', 'Austria': '040', 'Azerbaijan': '031',
    'Bangladesh': '050', 'Belarus': '112', 'Belgium': '056',
    'Benin': '204', 'Bhutan': '064', 'Bolivia': '068',
    'Bosnia and Herz.': '070', 'Botswana': '072', 'Brazil': '076',
    'Brunei': '096', 'Bulgaria': '100', 'Burkina Faso': '854',
    'Burundi': '108', 'Cambodia': '116', 'Cameroon': '120',
    'Canada': '124', 'Central African Rep.': '140', 'Chad': '148',
    'Chile': '152', 'China': '156', 'Colombia': '170',
    'Congo': '178', 'Costa Rica': '188', 'Croatia': '191',
    'Cuba': '192', 'Czechia': '203', "Côte d'Ivoire": '384',
    'Dem. Rep. Congo': '180', 'Denmark': '208', 'Djibouti': '262',
    'Dominican Rep.': '214', 'Ecuador': '218', 'Egypt': '818',
    'Eritrea': '232', 'Estonia': '233', 'Ethiopia': '231',
    'Falkland Is.': '238', 'Fiji': '242', 'Finland': '246',
    'Fr. S. Antarctic Lands': '260', 'France': '250', 'Gabon': '266',
    'Georgia': '268', 'Germany': '276', 'Ghana': '288',
    'Greece': '300', 'Greenland': '304', 'Guatemala': '320',
    'Guinea': '324', 'Guinea-Bissau': '624', 'Guyana': '328',
    'Haiti': '332', 'Honduras': '340', 'Hungary': '348',
    'Iceland': '352', 'India': '356', 'Indonesia': '360',
    'Iran': '364', 'Iraq': '368', 'Ireland': '372',
    'Israel': '376', 'Italy': '380', 'Japan': '392',
    'Jordan': '400', 'Kazakhstan': '398', 'Kenya': '404',
    'Kosovo': None, 'Kyrgyzstan': '417', 'Laos': '418',
    'Latvia': '428', 'Lesotho': '426', 'Liberia': '430',
    'Libya': '434', 'Lithuania': '440', 'Madagascar': '450',
    'Malawi': '454', 'Malaysia': '458', 'Mali': '466',
    'Mauritania': '478', 'Mexico': '484', 'Moldova': '498',
    'Mongolia': '496', 'Morocco': '504', 'Mozambique': '508',
    'Myanmar': '104', 'Namibia': '516', 'Nepal': '524',
    'Netherlands': '528', 'New Zealand': '554', 'Nicaragua': '558',
    'Niger': '562', 'Nigeria': '566', 'North Korea': '408',
    'North Macedonia': '807', 'Norway': '578', 'Oman': '512',
    'Pakistan': '586', 'Panama': '591', 'Papua New Guinea': '598',
    'Paraguay': '600', 'Peru': '604', 'Philippines': '608',
    'Poland': '616', 'Portugal': '620', 'Romania': '642',
    'Russia': '643', 'S. Sudan': '728', 'Saudi Arabia': '682',
    'Senegal': '686', 'Serbia': '688', 'Sierra Leone': '694',
    'Slovakia': '703', 'Slovenia': '705', 'Somalia': '706',
    'Somaliland': None, 'South Africa': '710', 'South Korea': '410',
    'Spain': '724', 'Sri Lanka': '144', 'Sudan': '729',
    'Suriname': '740', 'Sweden': '752', 'Switzerland': '756',
    'Syria': '760', 'Tajikistan': '762', 'Tanzania': '834',
    'Thailand': '764', 'Tunisia': '788', 'Turkey': '792',
    'Turkmenistan': '795', 'Uganda': '800', 'Ukraine': '804',
    'United Arab Emirates': '784', 'United Kingdom': '826',
    'United States of America': '840', 'Uruguay': '858',
    'Uzbekistan': '860', 'Venezuela': '862', 'Vietnam': '704',
    'W. Sahara': '732', 'Yemen': '887', 'Zambia': '894',
    'Zimbabwe': '716', 'eSwatini': '748',
}

SSP_KEYS = {'ssp126': '126', 'ssp245': '245', 'ssp585': '585'}
YEARS = list(range(2025, 2101))  # 76 years

def smooth_linear(year_map, years_out):
    """Linear fit to reduce single-model interannual noise."""
    ys_in = sorted(year_map.keys())
    vs_in = [year_map[y] for y in ys_in]
    y0, y1 = ys_in[0], ys_in[-1]
    xs = [(y - y0) / (y1 - y0) for y in ys_in]
    # Least-squares linear fit
    n = len(xs)
    sx = sum(xs); sy = sum(vs_in)
    sxx = sum(x*x for x in xs); sxy = sum(x*v for x, v in zip(xs, vs_in))
    denom = n*sxx - sx*sx
    if abs(denom) < 1e-10:
        slope, intercept = 0, sy/n
    else:
        slope = (n*sxy - sx*sy) / denom
        intercept = (sy - slope*sx) / n
    result = []
    for yr in years_out:
        x = (yr - y0) / (y1 - y0)
        result.append(round(intercept + slope*x, 3))
    return result

def main():
    print("[regional] Loading tas_anomalies.json…")
    with open(os.path.join(PROJ, 'data', 'tas_anomalies.json')) as f:
        tas = json.load(f)

    out = {}
    skipped = []

    for country_name, ssp_data in tas['regions'].items():
        iso = NAME_TO_ISO.get(country_name)
        if iso is None:
            skipped.append(country_name)
            continue

        entry = {'name': country_name}
        for ssp_raw, ssp_short in SSP_KEYS.items():
            series = ssp_data.get(ssp_raw)
            if not series:
                continue
            year_map = {r['year']: r['anomaly'] for r in series}
            # filter to years we have data for (1980-2100), smooth over 2025-2100
            available = {y: v for y, v in year_map.items() if 1980 <= y <= 2100}
            if len(available) < 5:
                continue
            entry[ssp_short] = smooth_linear(available, YEARS)

        # Only include if we have all 3 SSPs
        if all(s in entry for s in ['126', '245', '585']):
            out[iso] = entry

    payload = {'countries': out, 'years': YEARS}
    out_path = os.path.join(PROJ, 'data', 'regional-temp.json')
    with open(out_path, 'w') as f:
        json.dump(payload, f, separators=(',', ':'))

    size_kb = os.path.getsize(out_path) / 1024
    print(f"[regional] Wrote {out_path} ({size_kb:.1f} KB)")
    print(f"[regional] {len(out)} countries included, {len(skipped)} skipped: {skipped}")

if __name__ == '__main__':
    main()
