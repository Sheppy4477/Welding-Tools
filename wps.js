(function () {
  const template = WeldTemplate;
  const record = document.getElementById('record');
  const pageSelect = document.getElementById('templatePage');
  const forms = document.getElementById('recordForms');
  const status = document.getElementById('exportStatus');
  const values = {
    WPS: {E4:'EX-WPS-001', P4:'0', G6:'EX-PQR-001', E13:'Illustrative carbon steel', E14:'Illustrative carbon steel', J27:'GMAW'},
    PQR: {E4:'EX-PQR-001', P4:'0', G6:'EX-WPS-001', J17:'GMAW'}
  };
  const pages = () => template.pages.filter(page => page.name.startsWith(record.value));
  const parser = new DOMParser();
  const parse = path => parser.parseFromString(template.parts[path], 'application/xml');
  const shared = Array.from(parse('xl/sharedStrings.xml').getElementsByTagName('si'), item =>
    Array.from(item.getElementsByTagName('t'), text => text.textContent).join(''));
  const styles = parse('xl/styles.xml');
  const formats = styles.getElementsByTagName('cellXfs')[0].children;
  const fills = styles.getElementsByTagName('fills')[0].children;
  const fonts = styles.getElementsByTagName('fonts')[0].children;
  function coordinates(address) {
    const [, letters, row] = /^([A-Z]+)(\d+)$/.exec(address);
    const column = [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
    return [Number(row), column];
  }
  function render() {
    const page = pages().find(item => item.name === pageSelect.value);
    const entries = values[page.name] ??= {};
    const sheet = parse(page.path);
    const editable = new Map(Object.values(page.groups).flat().map(field => [field.cell, field]));
    const cells = new Map(Array.from(sheet.getElementsByTagName('c'), cell => [cell.getAttribute('r'), cell]));
    const merges = new Map();
    const covered = new Set();
    const address = (r, c) => String.fromCharCode(64 + c) + r;
    for (const merge of sheet.getElementsByTagName('mergeCell')) {
      const [first, last] = merge.getAttribute('ref').split(':');
      const [r, c] = coordinates(first), [endRow, endCol] = coordinates(last);
      merges.set(first, [endRow-r+1, endCol-c+1]);
      for (let y=r; y<=endRow; y++) for (let x=c; x<=endCol; x++) {
        if (y!==r || x!==c) covered.add(address(y,x));
      }
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'worksheet-scroll';
    const table = document.createElement('table');
    table.className = 'worksheet-grid';
    table.setAttribute('aria-label', page.name + ' worksheet');
    const cols = document.createElement('colgroup');
    for (let c=1; c<=24; c++) {
      const col = document.createElement('col');
      const definition = Array.from(sheet.getElementsByTagName('col')).find(item =>
        c >= Number(item.getAttribute('min')) && c <= Number(item.getAttribute('max')));
      col.style.width = (Number(definition?.getAttribute('width') ?? 3) * 7 + 5) + 'px';
      cols.append(col);
    }
    table.append(cols);
    const body = table.createTBody();
    for (const row of sheet.getElementsByTagName('row')) {
      const r = Number(row.getAttribute('r'));
      const tr = body.insertRow();
      if (row.hasAttribute('ht')) tr.style.height = row.getAttribute('ht') + 'pt';
      for (let c=1; c<=24; c++) {
        const key = address(r,c);
        if (covered.has(key)) continue;
        const td = tr.insertCell();
        if (merges.has(key)) [td.rowSpan, td.colSpan] = merges.get(key);
        const source = cells.get(key);
        const style = formats[Number(source?.getAttribute('s') ?? 0)];
        const fill = fills[Number(style?.getAttribute('fillId') ?? 0)]?.getElementsByTagName('fgColor')[0]?.getAttribute('rgb');
        const font = fonts[Number(style?.getAttribute('fontId') ?? 0)];
        const ink = font?.getElementsByTagName('color')[0]?.getAttribute('rgb');
        if (fill) td.style.backgroundColor = '#' + fill.slice(-6);
        if (ink) td.style.color = '#' + ink.slice(-6);
        if (font?.getElementsByTagName('b').length) td.style.fontWeight = '700';
        const align = style?.getElementsByTagName('alignment')[0]?.getAttribute('horizontal');
        if (['left','center','right'].includes(align)) td.style.textAlign = align;
        const field = editable.get(key);
        if (!field) {
          const raw = source?.getElementsByTagName('v')[0]?.textContent ?? '';
          td.textContent = source?.getAttribute('t') === 's' ? shared[Number(raw)] : raw;
          continue;
        }
        td.classList.add('worksheet-editable');
        const control = document.createElement(field.multiline ? 'textarea' : 'input');
        control.setAttribute('aria-label', field.label + ' (' + key + ')');
        control.title = field.label;
        if (field.numeric) { control.type = 'number'; control.step = 'any'; }
        control.value = entries[key] ?? '';
        control.addEventListener('input', () => { entries[key] = control.value; status.textContent = ''; });
        td.append(control);
        if (field.options.length) {
          const list = document.createElement('datalist');
          list.id = 'options-' + key;
          for (const option of field.options) list.append(new Option(option, option));
          control.setAttribute('list', list.id);
          td.append(list);
        }
      }
    }
    wrapper.append(table);
    forms.replaceChildren(wrapper);
  }
  function selectRecord() {
    pageSelect.replaceChildren(...pages().map(page => new Option(page.name, page.name)));
    render();
  }
  record.onchange = selectRecord;
  pageSelect.onchange = render;
  const exportButton = document.getElementById('exportWorkbook');
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.textContent = 'Clear fields';
  exportButton.before(clear);
  clear.onclick = () => {
    if (pages().some(page => Object.values(values[page.name] ?? {}).some(Boolean))
      && !window.confirm('Clear all fields for this ' + record.value + '?')) return;
    for (const page of pages()) delete values[page.name];
    render();
    status.textContent = record.value + ' fields cleared.';
  };
  exportButton.onclick = () => {
    try {
      const selected = Object.fromEntries(pages().map(page => [page.name, values[page.name]]));
      const url = URL.createObjectURL(WeldWorkbook.create(template, selected));
      const link = document.createElement('a');
      link.href = url;
      link.download = record.value + '.xlsx';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      status.textContent = 'Excel workbook prepared.';
    } catch (error) {
      status.textContent = 'Could not create the workbook. ' + error.message;
    }
  };
  selectRecord();
})();
