(function (root) {
  const encoder = new TextEncoder();
  const escape = value => String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function crc32(bytes) {
    let crc = -1;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ -1) >>> 0;
  }

  // XLSX uses ZIP. Store the small XML parts uncompressed so export also works offline.
  function zip(parts) {
    const local = [], central = [];
    let offset = 0, directoryLength = 0;
    for (const [path, content] of Object.entries(parts)) {
      const name = encoder.encode(path), bytes = encoder.encode(content), crc = crc32(bytes);
      const header = new DataView(new ArrayBuffer(30));
      header.setUint32(0, 0x04034b50, true);
      header.setUint16(4, 20, true);
      header.setUint32(14, crc, true);
      header.setUint32(18, bytes.length, true);
      header.setUint32(22, bytes.length, true);
      header.setUint16(26, name.length, true);
      const entry = new DataView(new ArrayBuffer(46));
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      entry.setUint32(16, crc, true);
      entry.setUint32(20, bytes.length, true);
      entry.setUint32(24, bytes.length, true);
      entry.setUint16(28, name.length, true);
      entry.setUint32(42, offset, true);
      local.push(header.buffer, name, bytes);
      central.push(entry.buffer, name);
      offset += 30 + name.length + bytes.length;
      directoryLength += 46 + name.length;
    }
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, central.length / 2, true);
    end.setUint16(10, central.length / 2, true);
    end.setUint32(12, directoryLength, true);
    end.setUint32(16, offset, true);
    return new Blob([...local, ...central, end.buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }

  function create(template, values) {
    const parts = {...template.parts};
    for (const page of template.pages) {
      const entries = values[page.name] ?? {};
      let sheet = parts[page.path];
      for (const {cell, numeric} of Object.values(page.groups).flat()) {
        const value = entries[cell];
        if (value == null || value.trim() === '') continue;
        const pattern = new RegExp('<c\\b([^>]*\\br="' + cell + '"[^>]*?)(?:\\s*/>|>[\\s\\S]*?</c>)');
        if (!pattern.test(sheet)) throw Error('Missing template cell ' + cell + ' on ' + page.name + '.');
        sheet = sheet.replace(pattern, (_, attributes) => {
          const style = attributes.replace(/\s+t="[^"]*"/g, '');
          return numeric && Number.isFinite(Number(value))
            ? '<c' + style + '><v>' + Number(value) + '</v></c>'
            : '<c' + style + ' t="inlineStr"><is><t xml:space="preserve">' + escape(value) + '</t></is></c>';
        });
      }
      parts[page.path] = sheet;
    }
    return zip(parts);
  }
  root.WeldWorkbook = {create};
})(globalThis);