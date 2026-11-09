(function (root) {
  function calculate(v) {
    function number(key, label, min = 0, max = Infinity) {
      const value = Number(v[key]);
      if (v[key] == null || String(v[key]).trim() === '' || !Number.isFinite(value) || value < min || value > max) {
        throw Error('Enter a valid ' + label + '.');
      }
      return value;
    }
    const positive = (key, label) => number(key, label, Number.MIN_VALUE);
    const fraction = (key, label) => number(key, label, Number.MIN_VALUE, 100) / 100;
    const rate = number('labor', 'labor and overhead rate');
    const fillerPrice = number('fillerPrice', 'filler price');
    const gasRate = number('gasFlow', 'gas flow') * number('gasPrice', 'gas price');
    const fluxPrice = number('fluxPrice', 'flux price');
    const other = number('other', 'other costs');
    const quantity = positive('quantity', 'job quantity');
    let labor, filler, gas, flux;
    if (v.basis === 'weight') {
      const deposition = positive('deposition', 'positive deposition rate');
      labor = rate / (deposition * fraction('factor', 'operator factor between 0 and 100%'));
      filler = fillerPrice / fraction('efficiency', 'process efficiency between 0 and 100%');
      gas = gasRate / deposition;
      flux = fluxPrice * number('fluxRatio', 'flux ratio');
    } else {
      const perUnit = v.basis === 'unit';
      const length = perUnit ? positive('length', 'positive weld length') : 12;
      const arcMinutes = length / positive('travel', 'positive travel speed');
      const gasExtraMinutes = perUnit ? number('prePost', 'gas pre/postflow time') / 60 : 0;
      const paidMinutes = perUnit
        ? arcMinutes + number('handling', 'non-arc handling time') + gasExtraMinutes
        : arcMinutes / fraction('factor', 'operator factor between 0 and 100%');
      const wirePoundsPerInch = () => perUnit
        ? positive('wireWeightInch', 'wire weight per inch')
        : positive('wireWeight', 'wire weight per foot') / 12;
      const fillerPoundsPerMinute = v.process === 'stick'
        ? number('meltOff', 'electrode melt-off rate') * positive('rodWeight', 'electrode weight') / fraction('usable', 'usable electrode percentage between 0 and 100%')
        : number('wireFeed', 'wire feed speed') * wirePoundsPerInch();
      labor = rate * paidMinutes / 60;
      filler = fillerPrice * fillerPoundsPerMinute * arcMinutes;
      gas = gasRate * (arcMinutes + gasExtraMinutes) / 60;
      const fluxPounds = perUnit ? number('fluxUsed', 'flux used per unit')
        : fluxPrice === 0 ? 0 : number('weldWeight', 'weld weight per foot') * number('fluxRatio', 'flux ratio');
      flux = fluxPrice * fluxPounds;
    }
    const total = labor + filler + gas + flux + other;
    const jobTotal = total * quantity;
    if (!Number.isFinite(jobTotal)) throw Error('Inputs produce a cost too large to calculate.');
    return {labor, filler, gas, flux, other, total, jobTotal};
  }
  root.WeldCost = {calculate};
  if (typeof document === 'undefined') return;

  const fields = [
    ['basis','Cost basis',{unit:'Per finished unit',length:'Per foot of weld',weight:'Per pound deposited'},'unit'],
    ['process','Filler feed method',{wire:'Continuous wire',stick:'SMAW / stick'},'wire','unit,length'],
    ['labor','Labor and overhead rate','$/hr',135],
    ['length','Total weld length per unit','in',21,'unit'],
    ['travel','Travel speed','in/min',50,'unit,length'],
    ['handling','Non-arc handling time per unit','min',2.5,'unit'],
    ['prePost','Total gas pre/postflow per unit','sec',5,'unit'],
    ['factor','Operator factor','%',40,'length,weight'],
    ['deposition','Deposition rate during arc time','lb/hr',31.66,'weight'],
    ['wireFeed','Wire feed speed','in/min',325,'wire'],
    ['wireWeightInch','Wire weight','lb/in',0.0033,'wire'],
    ['wireWeight','Wire weight','lb/ft',0.0054,'wire'],
    ['meltOff','Electrode melt-off rate','electrodes/min',1,'stick'],
    ['rodWeight','Weight per electrode','lb',0.05,'stick'],
    ['usable','Usable electrode percentage','%',75,'stick'],
    ['efficiency','Process efficiency','%',99,'weight'],
    ['fillerPrice','Filler purchase price','$/lb',5.75],
    ['gasFlow','Shielding gas flow','ft³/hr',35],
    ['gasPrice','Shielding gas price','$/ft³',0.30],
    ['fluxPrice','Flux purchase price','$/lb',0],
    ['fluxUsed','Flux consumed per unit','lb',0,'unit'],
    ['fluxRatio','Flux-to-deposited-metal ratio','lb/lb',0,'length,weight'],
    ['weldWeight','Deposited weld weight per foot','lb/ft',0,'length'],
    ['other','Other costs on selected basis','$',0],
    ['quantity','Job quantity','',1]
  ];
  const form = document.getElementById('costInputs');
  const section = document.createElement('section');
  section.innerHTML = '<h2>Estimate inputs</h2><div class="fields"></div>';
  form.append(section);
  const controls = fields.map(([key, title, unit, value, condition]) => {
    const label = document.createElement('label');
    const caption = document.createElement('span');
    caption.textContent = title;
    label.append(caption);
    const input = document.createElement(typeof unit === 'object' ? 'select' : 'input');
    if (typeof unit === 'object') {
      for (const [id, name] of Object.entries(unit)) input.add(new Option(name, id));
      label.append(input);
    } else {
      input.type = 'number';
      input.step = 'any';
      input.min = '0';
      const wrap = document.createElement('div');
      wrap.className = 'input-wrap';
      const suffix = document.createElement('small');
      suffix.textContent = unit;
      wrap.append(input, suffix);
      label.append(wrap);
    }
    input.value = value;
    section.querySelector('.fields').append(label);
    return {key, label, input, condition};
  });
  const currency = new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'});
  function update() {
    const v = Object.fromEntries(controls.map(({key, input}) => [key, input.value]));
    const units = {unit:'unit', length:'ft', weight:'lb deposited'};
    const unit = units[v.basis];
    for (const {key, label, condition} of controls) {
      if (key === 'quantity') label.querySelector('span').textContent = {unit:'Job quantity (units)',length:'Job weld length (ft)',weight:'Job deposited weight (lb)'}[v.basis];
      const feedField = condition === 'wire' || condition === 'stick';
      label.hidden = !!condition && (feedField ? v.basis === 'weight' || condition !== v.process : !condition.split(',').includes(v.basis));
      if (key === 'wireWeightInch' && v.basis !== 'unit') label.hidden = true;
      if (key === 'wireWeight' && v.basis !== 'length') label.hidden = true;
    }
    const results = document.getElementById('costResults');
    const error = document.getElementById('costError');
    try {
      const r = calculate(v);
      const row = (label, value) => '<div class="result-row"><span>' + label + '</span><strong>' + currency.format(value) + '</strong></div>';
      error.textContent = '';
      results.innerHTML = '<div class="hero-value">' + currency.format(r.total) + '<span>per ' + unit + '</span></div>'
        + row('Labor and overhead', r.labor) + row('Filler metal', r.filler)
        + row('Shielding gas', r.gas) + row('Flux', r.flux) + row('Other costs', r.other)
        + '<h3>Job total</h3>' + row(v.quantity + ' × cost per ' + unit, r.jobTotal);
    } catch (e) {
      error.textContent = e.message;
      results.innerHTML = '';
    }
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', e => e.preventDefault());
  document.getElementById('printCost').onclick = () => window.print();
  update();
})(globalThis);
