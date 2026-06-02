import bwipjs from 'bwip-js';

export async function renderBarcodePng({ text, scale = 3, height = 12, includetext = true }) {
  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale,
    height,
    includetext,
    textxalign: 'center',
    backgroundcolor: 'FFFFFF'
  });
  return png;
}

