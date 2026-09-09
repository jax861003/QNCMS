// Lightweight Markdown renderer for product descriptions (server side).
// Kept dependency-free so it bundles cleanly into Cloudflare Pages Functions.

export function renderMd(src) {
  var s = String(src == null ? '' : src);
  var esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  esc = esc.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  esc = esc.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  esc = esc.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  esc = esc.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  esc = esc.replace(/(?:^|\n)[ \t]*[-*+][ \t]+[^\n]+(?:\n[ \t]*[-*+][ \t]+[^\n]+)*/g, function (m) {
    return '<ul>' + m.trim().split(/\n/).map(function (l) { return '<li>' + l.replace(/^[ \t]*[-*+][ \t]+/, '') + '</li>'; }).join('') + '</ul>';
  });
  esc = esc.replace(/(?:^|\n)[ \t]*\d+[.)][ \t]+[^\n]+(?:\n[ \t]*\d+[.)][ \t]+[^\n]+)*/g, function (m) {
    return '<ol>' + m.trim().split(/\n/).map(function (l) { return '<li>' + l.replace(/^[ \t]*\d+[.)][ \t]+/, '') + '</li>'; }).join('') + '</ol>';
  });
  esc = esc.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  esc = esc.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  esc = esc.replace(/(^|[^*\n])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  esc = esc.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return esc.split(/\n{2,}/).map(function (block) {
    var b = block.trim();
    if (!b) return '';
    var lines = b.split('\n');
    var allBlock = lines.every(function (l) { return /^<(h\d|ul|ol|pre|\/)/.test(l) || l === ''; });
    return allBlock ? b : '<p>' + b.replace(/\n/g, '<br />') + '</p>';
  }).join('');
}
