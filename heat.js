(function (root) {
  // Workbook columns L:P: density, specific heat, conductivity, latent heat, melting temperature.
  const materials = {
    'Al. 3004': [.0939,.22,137,170,1220],
    'Al. 6061': [.0975,.222,136,170,1220],
    'Cast Iron': [.258,.11,52,54.2,2200],
    'Austenitic SS': [.289,.12,8.32,34.68,2750],
    'Martensitic SS': [.278,.11,8.26,33.1,2750],
    'Carbon Steel 0.5%': [.284,.12,31.2,24,2700],
    'Carbon Steel 1.0%': [.283,.12,24.8,24,2600],
    'Carbon Steel 1.5%': [.282,.12,20.8,24,2500]
  };
  const efficiencies = {'SAW':.99,'SMAW':.55,'GMAW 98/2 90/10':.96,'GMAW 75/25':.94,'GMAW CO2':.90,'Metal Core':.90,'FCAW-G':.85,'FCAW-S':.80,'GTAW':.30};
  const fields = [
    ['material','Material Composition',Object.keys(materials),'Cast Iron'],
    ['thickness','Material Thickness (b)','in',.25],
    ['initial','Initial Plate Temperature (To)','°F',77],
    ['interpass','Maximum Interpass Temperature (Tc)','°F',0],
    ['distance','Distance From Fusion Boundry (y)','in',0],
    ['process','WELDING PROCESS',Object.keys(efficiencies),'SMAW'],
    ['voltage','VOLTAGE','V',19.5],
    ['amperage','AMPERAGE','A',95],
    ['travel','TRAVEL SPEED','In/Min',7]
  ];

  function divide(numerator, denominator) {
    // Keep Excel's division error separate from the square-root domain error.
    return denominator === 0 ? Infinity : numerator / denominator;
  }

  function calculate(v) {
    if (Number(v.travel) === 0) {
      return {kj:Infinity, btu:Infinity, relative:Infinity, thin:Infinity, thick:Infinity, peak:Infinity, solidification:Infinity};
    }
    const [density, specificHeat, conductivity, latentHeat, melting] = materials[v.material];
    const thickness = Number(v.thickness);
    const initial = Number(v.initial);
    const delta = Number(v.interpass) - initial;
    const meltDelta = melting - initial;
    const pc = density * specificHeat;
    const k = (1 / 3600) * (1 / 12) * conductivity;
    const kj = divide(Number(v.voltage) * Number(v.amperage) * 60, Number(v.travel) * 1000) * efficiencies[v.process];
    const btu = kj * .947817;
    const relative = thickness * Math.sqrt(divide(pc * delta, btu));
    const thin = -2 * Math.PI * pc * delta ** 3 * divide(thickness, btu) ** 2 * k;
    const thick = divide(-2 * Math.PI * delta ** 2 * k, btu);
    const peak = initial + divide(btu * meltDelta, pc * thickness * Number(v.distance) * Math.sqrt(2 * Math.PI * Math.E) * meltDelta + btu);
    const solidification = divide(latentHeat * btu * density, k * 2 * Math.PI * pc * meltDelta ** 2);
    return {kj, btu, relative, thin, thick, peak, solidification};
  }

  root.WeldHeat = {calculate};
  if (typeof document === 'undefined') return;
  const form = document.getElementById('heatForm');
  const container = document.getElementById('heatFields');
  const controls = fields.map(([key, title, unit, value]) => {
    const label = document.createElement('label');
    const caption = document.createElement('span');
    caption.textContent = title;
    label.append(caption);
    const input = document.createElement(Array.isArray(unit) ? 'select' : 'input');
    if (Array.isArray(unit)) {
      for (const option of unit) input.add(new Option(option, option));
      label.append(input);
    } else {
      input.type = 'number';
      input.step = 'any';
      const wrap = document.createElement('div');
      wrap.className = 'input-wrap';
      const suffix = document.createElement('small');
      suffix.textContent = unit;
      wrap.append(input, suffix);
      label.append(wrap);
    }
    input.value = value;
    container.append(label);
    return [key, input];
  });
  const results = document.getElementById('heatResults');
  const format = new Intl.NumberFormat('en-US', {maximumFractionDigits:8});
  function update() {
    if (controls.some(([, input]) => input.value === '' || input.validity.badInput)) {
      results.innerHTML = 'Complete all nine inputs to calculate results.'
        + '<p class="note">If an input is irrelevant, enter 0.</p>';
      return;
    }
    const v = Object.fromEntries(controls.map(([key, input]) => [key, input.value]));
    const r = calculate(v);
    const row = (label, value, unit = '') => '<div class="result-row"><span>' + label + '</span><strong>'
      + (Number.isFinite(value) ? format.format(value) + ' ' + unit : '#DIV/0!') + '</strong></div>';
    const rule = Number.isFinite(r.relative)
      ? '<p class="note">Cooling rule: ' + (r.relative <= .6 ? 'use thin only.' : r.relative >= .9 ? 'use thick only.' : 'use both thin and thick.') + '</p>'
      : '';
    results.innerHTML = row('Net Heat Input',r.kj,'kJ/in') + row('Net Heat Input',r.btu,'BTU/in')
      + (Number.isFinite(r.relative) ? row('Relative Plate Thickness',r.relative) : '')
      + row('Cooling Rate Thin',r.thin,'−°F/s') + row('Cooling Rate Thick',r.thick,'−°F/s')
      + row('Peak Temperature',r.peak,'°F') + row('Solidification Rate',r.solidification,'Seconds')
      + rule;
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', event => event.preventDefault());
  update();
})(globalThis);
