export function element(parent, tag, text, className) {
  const item = document.createElement(tag);
  if (text != null) item.textContent = text;
  if (className) item.className = className;
  parent.append(item);
  return item;
}

export function button(parent, label, click, className = 'mq-choice') {
  const item = element(parent, 'button', label, className);
  item.type = 'button';
  item.onclick = click;
  return item;
}

export function section(parent, title) {
  const group = element(parent, 'section', null, 'mq-section');
  element(group, 'h3', title);
  return group;
}

export function disclosure(parent, title) {
  const group = element(parent, 'details', null, 'mq-disclosure');
  element(group, 'summary', title);
  return group;
}

// Generate a stable display order per journey without moving the authored answers.
export function shuffled(list, salt) {
  let seed = 2166136261;
  for (const char of String(salt)) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
